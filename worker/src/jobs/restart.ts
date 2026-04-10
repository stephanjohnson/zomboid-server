import type { PrismaClient } from '@prisma/client'
import Dockerode from 'dockerode'
import { Rcon } from 'rcon-client'
import pino from 'pino'
import { buildContainerEnv, createContainerWithImagePull, getComposeOwnedContainerLabels, prepareGameServerRuntimeFiles } from './game-server.js'

const logger = pino({ level: process.env.LOG_LEVEL || 'info' })

function createDockerClient(): Dockerode {
  const proxyUrl = process.env.DOCKER_PROXY_URL || 'http://docker-socket-proxy:2375'
  const url = new URL(proxyUrl)
  return new Dockerode({
    host: url.hostname,
    port: Number(url.port),
    protocol: url.protocol === 'https:' ? 'https' : 'http',
  })
}

export async function handleRestartJob(
  payload: Record<string, unknown>,
  prisma: PrismaClient,
): Promise<void> {
  const { countdown = 0 } = payload as { countdown: number, requestedBy: string }

  // Send countdown warnings via RCON
  if (countdown > 0) {
    try {
      const rcon = await Rcon.connect({
        host: process.env.PZ_RCON_HOST || 'game-server',
        port: Number(process.env.PZ_RCON_PORT) || 27015,
        password: process.env.PZ_RCON_PASSWORD || '',
      })

      const intervals = [300, 120, 60, 30, 10, 5]
      let remaining = countdown

      for (const interval of intervals) {
        if (remaining > interval) {
          await new Promise(resolve => setTimeout(resolve, (remaining - interval) * 1000))
          remaining = interval
          await rcon.send(`servermsg "Server restarting in ${interval} seconds"`)
        }
      }

      await new Promise(resolve => setTimeout(resolve, remaining * 1000))
      await rcon.send('servermsg "Server restarting NOW"')
      await rcon.send('save')
      rcon.end()

      // Wait for save
      await new Promise(resolve => setTimeout(resolve, 5000))
    }
    catch {
      logger.warn('Could not send RCON warnings')
    }
  }

  // Read profile from DB and reconcile (recreate container with latest config)
  const profile = await prisma.serverProfile.findFirst({
    where: { isActive: true },
    include: { mods: { where: { isEnabled: true }, orderBy: { order: 'asc' } } },
  })

  if (!profile) {
    throw new Error('No active server profile for restart')
  }

  const containerName = process.env.GAME_SERVER_CONTAINER_NAME || 'pzm-game-server'
  const docker = createDockerClient()

  // Stop and remove existing container
  try {
    const container = docker.getContainer(containerName)
    const info = await container.inspect()
    if (info.State.Running) {
      await container.stop({ t: 30 })
    }
    await container.remove()
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (!message.includes('No such container')) {
      throw error
    }
  }

  const modApiBaseUrl = process.env.MOD_API_BASE_URL || 'http://nitro-app:3000/api/mod'
  const rconPassword = profile.rconPassword || process.env.PZ_RCON_PASSWORD || ''
  const gameServerImage = process.env.GAME_SERVER_IMAGE || 'renegademaster/zomboid-dedicated-server:latest'
  const labels = await getComposeOwnedContainerLabels(docker, 'game-server')
  await prepareGameServerRuntimeFiles(profile, rconPassword)

  const container = await createContainerWithImagePull(docker, profile, {
    containerName,
    image: gameServerImage,
    env: buildContainerEnv(profile, {
      modApiBaseUrl,
      rconPassword,
    }),
    labels,
  })

  await container.start()
  logger.info({ profileId: profile.id }, 'Server restarted with latest profile')
}
