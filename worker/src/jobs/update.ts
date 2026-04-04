import { writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { PrismaClient } from '@prisma/client'
import Dockerode from 'dockerode'
import pino from 'pino'

const logger = pino({ level: process.env.LOG_LEVEL || 'info' })

export async function handleUpdateJob(
  payload: Record<string, unknown>,
  _prisma: PrismaClient,
): Promise<void> {
  const { branch = 'public' } = payload as { branch?: string }

  const pzDataPath = process.env.PZ_DATA_PATH || '/pz-data'
  const containerName = process.env.GAME_SERVER_CONTAINER_NAME || 'pz-game-server'
  const proxyUrl = process.env.DOCKER_PROXY_URL || 'http://docker-socket-proxy:2375'

  // Write force update flag and branch override
  writeFileSync(join(pzDataPath, '.force_update'), 'true')
  if (branch !== 'public') {
    writeFileSync(join(pzDataPath, '.steam_branch'), branch)
  }

  // Restart the game container — it will pick up the flag and run SteamCMD
  const url = new URL(proxyUrl)
  const docker = new Dockerode({
    host: url.hostname,
    port: Number(url.port),
    protocol: url.protocol === 'https:' ? 'https' : 'http',
  })

  const container = docker.getContainer(containerName)
  await container.restart({ t: 30 })

  logger.info({ branch }, 'Game server update triggered')
}
