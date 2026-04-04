import type { PrismaClient } from '@prisma/client'
import Dockerode from 'dockerode'
import { Rcon } from 'rcon-client'
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
  const profile = await prisma.serverProfile.findFirst({ where: { isActive: true } })

  if (!profile) {
    throw new Error('No active server profile for restart')
  }

  const containerName = process.env.GAME_SERVER_CONTAINER_NAME || 'pz-game-server'
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

  // Recreate with latest profile from DB
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
    `PZ_STEAM_BRANCH=${profile.steamBuild || 'public'}`,
    `ZM_API_BASE_URL=${modApiBaseUrl}`,
  ]

  const iniOverrides = profile.serverIniOverrides as Record<string, string> | null
  if (iniOverrides && Object.keys(iniOverrides).length > 0) {
    const overrides = Object.entries(iniOverrides)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')
    env.push(`PZ_INI_OVERRIDES=${overrides}`)
  }

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
  logger.info({ profileId: profile.id }, 'Server restarted with latest profile')
}
