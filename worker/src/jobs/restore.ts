import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import type { PrismaClient } from '@prisma/client'
import Dockerode from 'dockerode'
import pino from 'pino'

const logger = pino({ level: process.env.LOG_LEVEL || 'info' })

export async function handleRestoreJob(
  payload: Record<string, unknown>,
  _prisma: PrismaClient,
): Promise<void> {
  const { filePath, profileId } = payload as {
    jobId: string
    backupId: string
    filePath: string
    profileId: string
  }

  if (!existsSync(filePath)) {
    throw new Error(`Backup file not found: ${filePath}`)
  }

  const pzDataPath = process.env.PZ_DATA_PATH || '/pz-data'
  const containerName = process.env.GAME_SERVER_CONTAINER_NAME || 'pz-game-server'
  const proxyUrl = process.env.DOCKER_PROXY_URL || 'http://docker-socket-proxy:2375'

  // Stop game server
  logger.info('Stopping game server for restore...')
  const url = new URL(proxyUrl)
  const docker = new Dockerode({
    host: url.hostname,
    port: Number(url.port),
    protocol: url.protocol === 'https:' ? 'https' : 'http',
  })
  const container = docker.getContainer(containerName)

  try {
    await container.stop({ t: 30 })
  }
  catch {
    logger.warn('Container may already be stopped')
  }

  // Extract backup
  logger.info({ filePath }, 'Restoring backup...')
  execSync(`tar -xzf "${filePath}" -C "${pzDataPath}"`, { timeout: 300000 })

  // Restart game server
  logger.info('Restarting game server...')
  await container.start()

  logger.info('Restore completed successfully')
}
