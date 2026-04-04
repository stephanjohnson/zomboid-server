import amqplib from 'amqplib'
import type { Channel, Connection } from 'amqplib'

let connection: Connection | null = null
let channel: Channel | null = null

export const QUEUES = {
  BACKUP: 'jobs.backup',
  RESTORE: 'jobs.restore',
  RESTART: 'jobs.restart',
  UPDATE: 'jobs.update',
  STOP: 'jobs.stop',
  WIPE: 'jobs.wipe',
} as const

export type QueueName = typeof QUEUES[keyof typeof QUEUES]

async function getChannel(): Promise<Channel> {
  const config = useRuntimeConfig()

  if (channel) return channel

  if (!connection) {
    connection = await amqplib.connect(config.rabbitmqUrl)
    connection.on('error', () => {
      connection = null
      channel = null
    })
    connection.on('close', () => {
      connection = null
      channel = null
    })
  }

  channel = await connection.createChannel()

  // Assert all queues
  for (const queue of Object.values(QUEUES)) {
    await channel.assertQueue(queue, { durable: true })
  }

  return channel
}

export async function publishJob(queue: QueueName, payload: Record<string, unknown>): Promise<void> {
  const ch = await getChannel()
  ch.sendToQueue(queue, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    contentType: 'application/json',
  })
}

export async function disconnectQueue(): Promise<void> {
  if (channel) {
    await channel.close()
    channel = null
  }
  if (connection) {
    await connection.close()
    connection = null
  }
}
