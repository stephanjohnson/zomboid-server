import Dockerode from 'dockerode'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'

import { getGameServerModSourcePath, getLuaBridgePath, getPzDataPath } from './runtime-paths'

let docker: Dockerode | null = null

export interface GameServerProfileRuntime {
  servername: string
  gamePort: number
  directPort: number
  rconPort: number
  steamBuild: string
  serverIniOverrides?: Record<string, string>
  forceUpdate?: boolean
}

interface GameContainerStatus {
  exists: boolean
  running: boolean
  status: string
  statusLabel: string
  startedAt: string | null
}

export function getDockerClient(): Dockerode {
  if (!docker) {
    const config = useRuntimeConfig()
    const url = new URL(config.dockerProxyUrl)
    docker = new Dockerode({
      host: url.hostname,
      port: Number(url.port),
      protocol: url.protocol === 'https:' ? 'https' : 'http',
    })
  }
  return docker
}

export function getGameContainer(): Dockerode.Container {
  const config = useRuntimeConfig()
  const client = getDockerClient()
  return client.getContainer(config.gameServerContainerName)
}

function createPortBindings(profile: GameServerProfileRuntime): NonNullable<Dockerode.ContainerCreateOptions['HostConfig']>['PortBindings'] {
  return {
    [`${profile.gamePort}/udp`]: [{ HostPort: String(profile.gamePort) }],
    [`${profile.directPort}/udp`]: [{ HostPort: String(profile.directPort) }],
    [`${profile.rconPort}/tcp`]: [{ HostIp: '127.0.0.1', HostPort: String(profile.rconPort) }],
  }
}

function createEnv(profile: GameServerProfileRuntime): string[] {
  const config = useRuntimeConfig()

  const env = [
    `SERVERNAME=${profile.servername}`,
    `PZ_GAME_PORT=${profile.gamePort}`,
    `PZ_DIRECT_PORT=${profile.directPort}`,
    `PZ_RCON_PORT=${profile.rconPort}`,
    `PZ_RCON_PASSWORD=${config.pzRconPassword}`,
    `PZ_ADMIN_PASSWORD=${config.pzRconPassword}`,
    `PZ_STEAM_BRANCH=${profile.steamBuild || 'public'}`,
    `ZM_API_BASE_URL=${config.modApiBaseUrl}`,
  ]

  // Serialize INI overrides as newline-separated key=value pairs
  if (profile.serverIniOverrides && Object.keys(profile.serverIniOverrides).length > 0) {
    const overrides = Object.entries(profile.serverIniOverrides)
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')
    env.push(`PZ_INI_OVERRIDES=${overrides}`)
  }

  if (profile.forceUpdate) {
    env.push('PZ_FORCE_UPDATE=true')
  }

  return env
}

async function createGameContainer(profile: GameServerProfileRuntime): Promise<Dockerode.Container> {
  const config = useRuntimeConfig()
  const client = getDockerClient()
  const pzDataPath = getPzDataPath()
  const luaBridgePath = getLuaBridgePath()
  const modSourcePath = getGameServerModSourcePath()

  if (!existsSync(modSourcePath)) {
    throw new Error(`Game server mod source path does not exist: ${modSourcePath}`)
  }

  await mkdir(pzDataPath, { recursive: true })
  await mkdir(luaBridgePath, { recursive: true })

  try {
    return await client.createContainer({
      name: config.gameServerContainerName,
      Image: config.gameServerImageName,
      Env: createEnv(profile),
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
        ExtraHosts: ['host.docker.internal:host-gateway'],
        PortBindings: createPortBindings(profile),
        RestartPolicy: { Name: 'unless-stopped' },
      },
    })
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)

    if (message.includes('No such image')) {
      throw new Error(`Game server image not found: ${config.gameServerImageName}. Build it with: docker compose build game-server`)
    }

    throw error
  }
}

export async function getContainerStatus(): Promise<GameContainerStatus> {
  try {
    const container = getGameContainer()
    const info = await container.inspect()
    return {
      exists: true,
      running: info.State.Running,
      status: info.State.Status,
      statusLabel: info.State.Status,
      startedAt: info.State.StartedAt || null,
    }
  }
  catch {
    return {
      exists: false,
      running: false,
      status: 'not_created',
      statusLabel: 'Not created',
      startedAt: null,
    }
  }
}

export async function startGameContainer(profile?: GameServerProfileRuntime): Promise<void> {
  const status = await getContainerStatus()

  if (!status.exists) {
    if (!profile) {
      throw new Error('A server profile is required to create the game server container')
    }

    const container = await createGameContainer(profile)
    await container.start()
    return
  }

  if (status.running) {
    return
  }

  const container = getGameContainer()
  await container.start()
}

export async function removeGameContainer(): Promise<void> {
  try {
    const container = getGameContainer()
    const info = await container.inspect()

    if (info.State.Running) {
      await container.stop({ t: 30 })
    }

    await container.remove()
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    if (message.includes('No such container')) {
      return // Already gone
    }
    throw error
  }
}

/**
 * Reconcile the running container with the DB profile.
 * Removes the existing container and recreates it with the latest env vars.
 * This is the only way to change env vars on a Docker container.
 */
export async function reconcileGameContainer(profile: GameServerProfileRuntime): Promise<void> {
  await removeGameContainer()

  const container = await createGameContainer(profile)
  await container.start()
}

export async function stopGameContainer(): Promise<void> {
  const container = getGameContainer()
  await container.stop({ t: 30 })
}

export async function restartGameContainer(): Promise<void> {
  const container = getGameContainer()
  await container.restart({ t: 30 })
}

export async function getContainerLogs(tail: number = 100): Promise<string> {
  const container = getGameContainer()
  const logs = await container.logs({
    stdout: true,
    stderr: true,
    tail,
    timestamps: true,
  })
  return logs.toString()
}
