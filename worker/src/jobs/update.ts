import type { PrismaClient } from '@prisma/client'
import Dockerode from 'dockerode'
import pino from 'pino'
import { buildContainerEnv, createContainerOptions, getComposeOwnedContainerLabels, prepareGameServerRuntimeFiles } from './game-server.js'

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

export async function handleUpdateJob(
  payload: Record<string, unknown>,
  prisma: PrismaClient,
): Promise<void> {
  const { branch = 'public', profileId } = payload as { branch?: string, profileId?: string }

  // Read the profile from database
  const profile = profileId
    ? await prisma.serverProfile.findUnique({
        where: { id: profileId },
        include: { mods: { where: { isEnabled: true }, orderBy: { order: 'asc' } } },
      })
    : await prisma.serverProfile.findFirst({
        where: { isActive: true },
        include: { mods: { where: { isEnabled: true }, orderBy: { order: 'asc' } } },
      })

  if (!profile) {
    throw new Error('No server profile found for update job')
  }

  const containerName = process.env.GAME_SERVER_CONTAINER_NAME || 'pzm-game-server'
  const docker = createDockerClient()

  // Stop and remove existing container
  try {
    const container = docker.getContainer(containerName)
    const info = await container.inspect()
    if (info.State.Running) {
      logger.info('Stopping game server for update...')
      await container.stop({ t: 30 })
    }
    await container.remove()
    logger.info('Removed existing container')
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

  // Recreate container with force update flag
  const container = await docker.createContainer(createContainerOptions(profile, {
    containerName,
    image: gameServerImage,
    env: buildContainerEnv(profile, {
      branch,
      modApiBaseUrl,
      rconPassword,
      forceUpdate: true,
    }),
    labels,
  }))

  await container.start()

  // Update the profile's steam build in DB if branch changed
  if (branch !== profile.steamBuild) {
    await prisma.serverProfile.update({
      where: { id: profile.id },
      data: { steamBuild: branch },
    })
  }

  logger.info({ branch, profileId: profile.id }, 'Game server update triggered via container recreation')
}
