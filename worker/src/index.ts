import amqplib from 'amqplib'
import { PrismaClient } from '@prisma/client'
import pino from 'pino'
import { handleBackupJob } from './jobs/backup.js'
import { handleRestoreJob } from './jobs/restore.js'
import { handleRestartJob } from './jobs/restart.js'
import { handleUpdateJob } from './jobs/update.js'
import { handleStopJob } from './jobs/stop.js'

const logger = pino({ level: process.env.LOG_LEVEL || 'info' })
const prisma = new PrismaClient()

const QUEUES = [
  'jobs.backup',
  'jobs.restore',
  'jobs.restart',
  'jobs.update',
  'jobs.stop',
  'jobs.wipe',
] as const

type JobHandler = (payload: Record<string, unknown>, prisma: PrismaClient) => Promise<void>

const handlers: Record<string, JobHandler> = {
  'jobs.backup': handleBackupJob,
  'jobs.restore': handleRestoreJob,
  'jobs.restart': handleRestartJob,
  'jobs.update': handleUpdateJob,
  'jobs.stop': handleStopJob,
}

async function main() {
  const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://zomboid:zomboid@localhost:5672'

  logger.info('Connecting to RabbitMQ...')
  const connection = await amqplib.connect(rabbitmqUrl)
  const channel = await connection.createChannel()

  // Prefetch 1 to process one job at a time
  await channel.prefetch(1)

  // Assert and consume all queues
  for (const queue of QUEUES) {
    await channel.assertQueue(queue, { durable: true })

    channel.consume(queue, async (msg) => {
      if (!msg) return

      const payload = JSON.parse(msg.content.toString())
      logger.info({ queue, jobId: payload.jobId }, `Processing job`)

      try {
        // Update job status to RUNNING
        if (payload.jobId) {
          await prisma.job.update({
            where: { id: payload.jobId },
            data: { status: 'RUNNING', startedAt: new Date() },
          })
        }

        const handler = handlers[queue]
        if (handler) {
          await handler(payload, prisma)
        }
        else {
          logger.warn({ queue }, `No handler for queue`)
        }

        // Mark job as completed
        if (payload.jobId) {
          await prisma.job.update({
            where: { id: payload.jobId },
            data: { status: 'COMPLETED', finishedAt: new Date() },
          })
        }

        channel.ack(msg)
        logger.info({ queue, jobId: payload.jobId }, `Job completed`)
      }
      catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Unknown error'
        logger.error({ queue, jobId: payload.jobId, error: errorMsg }, `Job failed`)

        // Update job status to FAILED
        if (payload.jobId) {
          await prisma.job.update({
            where: { id: payload.jobId },
            data: { status: 'FAILED', error: errorMsg, finishedAt: new Date() },
          })
        }

        // Reject without requeue (dead letter)
        channel.nack(msg, false, false)
      }
    })

    logger.info({ queue }, `Consuming queue`)
  }

  logger.info('Worker ready — waiting for jobs')

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.info('Shutting down...')
    await channel.close()
    await connection.close()
    await prisma.$disconnect()
    process.exit(0)
  })
}

main().catch((err) => {
  logger.fatal(err, 'Worker failed to start')
  process.exit(1)
})
