import type { PrismaClient } from '@prisma/client'
import Dockerode from 'dockerode'
import pino from 'pino'

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
    ? await prisma.serverProfile.findUnique({ where: { id: profileId } })
    : await prisma.serverProfile.findFirst({ where: { isActive: true } })

  if (!profile) {
    throw new Error('No server profile found for update job')
  }

  const containerName = process.env.GAME_SERVER_CONTAINER_NAME || 'pz-game-server'
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

  // Build env vars — same shape as docker.ts createEnv but standalone for worker
  const pzDataPath = process.env.PZ_DATA_PATH || '/pz-data'
  const luaBridgePath = process.env.LUA_BRIDGE_PATH || '/lua-bridge'
  const modApiBaseUrl = process.env.MOD_API_BASE_URL || 'http://nitro-app:3000/api/mod'
  const rconPassword = process.env.PZ_RCON_PASSWORD || ''
  const gameServerImage = process.env.GAME_SERVER_IMAGE || 'pz-game-server:local'
  const modSourcePath = process.env.GAME_SERVER_MOD_SOURCE_PATH || '/app/lua-bridge/ZomboidManager'

  const env: string[] = [
    `SERVERNAME=${profile.servername}`,
    `PZ_GAME_PORT=${profile.gamePort}`,
    `PZ_DIRECT_PORT=${profile.directPort}`,
    `PZ_RCON_PORT=${profile.rconPort}`,
    `PZ_RCON_PASSWORD=${rconPassword}`,
    `PZ_ADMIN_PASSWORD=${rconPassword}`,
    `PZ_STEAM_BRANCH=${branch}`,
    `ZM_API_BASE_URL=${modApiBaseUrl}`,
    `PZ_FORCE_UPDATE=true`,
  ]

  // Add INI overrides if present
  const iniOverrides = profile.serverIniOverrides as Record<string, string> | null
  if (iniOverrides && Object.keys(iniOverrides).length > 0) {
    const overrides = Object.entries(iniOverrides)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')
    env.push(`PZ_INI_OVERRIDES=${overrides}`)
  }

  // Recreate container with force update flag
  const container = await docker.createContainer({
    name: containerName,
    Image: gameServerImage,
    Env: env,
    ExposedPorts: {
      [`${profile.gamePort}/udp`]: {},
      [`${profile.directPort}/udp`]: {},
      [`${profile.rconPort}/tcp`]: {},
    },
    HostConfig: {
      Binds: [
        `${pzDataPath}:/home/steam/Zomboid`,
        `${luaBridgePath}:/home/steam/Zomboid/Lua`,
        `${modSourcePath}:/home/steam/Zomboid/mods/ZomboidManager:ro`,
      ],
      PortBindings: {
        [`${profile.gamePort}/udp`]: [{ HostPort: String(profile.gamePort) }],
        [`${profile.directPort}/udp`]: [{ HostPort: String(profile.directPort) }],
        [`${profile.rconPort}/tcp`]: [{ HostIp: '127.0.0.1', HostPort: String(profile.rconPort) }],
      },
      RestartPolicy: { Name: 'unless-stopped' },
    },
  })

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
