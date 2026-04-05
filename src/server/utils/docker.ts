import Dockerode from 'dockerode'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'

import { prepareGameServerRuntimeFiles } from './game-server-runtime'
import {
  getGameServerDataMountSource,
  getGameServerLuaBridgeMountSource,
  getGameServerModSourceMount,
  getLuaBridgePath,
  getPzDataPath,
} from './runtime-paths'

let docker: Dockerode | null = null

export interface GameServerProfileRuntime {
  servername: string
  gamePort: number
  directPort: number
  rconPort: number
  steamBuild: string
  mapName: string
  maxPlayers: number
  pvp: boolean
  serverIniOverrides?: Record<string, string>
  sandboxVarsOverrides?: Record<string, unknown>
  forceUpdate?: boolean
}

interface GameContainerStatus {
  exists: boolean
  running: boolean
  status: string
  statusLabel: string
  startedAt: string | null
}

function getGameServerNetworkName(): string {
  const config = useRuntimeConfig()
  return config.gameServerNetworkName || process.env.NUXT_GAME_SERVER_NETWORK_NAME || process.env.GAME_SERVER_NETWORK_NAME || 'zomboid-server_zomboid-net'
}

function getGameServerNetworkAlias(): string {
  const config = useRuntimeConfig()
  return config.gameServerNetworkAlias || process.env.NUXT_GAME_SERVER_NETWORK_ALIAS || process.env.GAME_SERVER_NETWORK_ALIAS || 'game-server'
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
    `PZ_MAP_NAMES=${profile.mapName}`,
    `PZ_MAX_PLAYERS=${profile.maxPlayers}`,
    `PZ_PVP=${profile.pvp ? 'true' : 'false'}`,
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

function createExpectedBinds(): string[] {
  const binds = [
    `${getGameServerDataMountSource()}:/home/steam/Zomboid`,
    `${getGameServerLuaBridgeMountSource()}:/home/steam/Zomboid/Lua`,
  ]

  const modSourceMount = getGameServerModSourceMount()
  if (modSourceMount) {
    binds.push(`${modSourceMount}:/opt/ZomboidManager-source:ro`)
  }

  return binds
}

async function containerNeedsReconciliation(profile: GameServerProfileRuntime): Promise<boolean> {
  const config = useRuntimeConfig()
  const container = getGameContainer()
  const info = await container.inspect()
  const currentEnv = new Set(info.Config?.Env ?? [])
  const currentBinds = new Set(info.HostConfig?.Binds ?? [])
  const expectedEnv = createEnv(profile)
  const expectedBinds = createExpectedBinds()
  const networkName = getGameServerNetworkName()
  const networkAlias = getGameServerNetworkAlias()
  const attachedNetwork = info.NetworkSettings?.Networks?.[networkName]

  if (info.Config?.Image !== config.gameServerImageName) {
    return true
  }

  for (const envVar of expectedEnv) {
    if (!currentEnv.has(envVar)) {
      return true
    }
  }

  for (const bind of expectedBinds) {
    if (!currentBinds.has(bind)) {
      return true
    }
  }

  if (!attachedNetwork || !attachedNetwork.Aliases?.includes(networkAlias)) {
    return true
  }

  return false
}

async function createGameContainer(profile: GameServerProfileRuntime): Promise<Dockerode.Container> {
  const config = useRuntimeConfig()
  const client = getDockerClient()
  const networkName = getGameServerNetworkName()
  const networkAlias = getGameServerNetworkAlias()
  const pzDataPath = getPzDataPath()
  const luaBridgePath = getLuaBridgePath()
  const modSourceMount = getGameServerModSourceMount()

  if (modSourceMount && modSourceMount.includes('/') && !existsSync(modSourceMount)) {
    throw new Error(`Game server mod source mount does not exist: ${modSourceMount}`)
  }

  await mkdir(pzDataPath, { recursive: true })
  await mkdir(luaBridgePath, { recursive: true })
  await prepareGameServerRuntimeFiles(profile, config.pzRconPassword)

  try {
    return await client.createContainer({
      name: config.gameServerContainerName,
      Image: config.gameServerImageName,
      Env: createEnv(profile),
      NetworkingConfig: {
        EndpointsConfig: {
          [networkName]: {
            Aliases: [networkAlias],
          },
        },
      },
      ExposedPorts: {
        [`${profile.gamePort}/udp`]: {},
        [`${profile.directPort}/udp`]: {},
        [`${profile.rconPort}/tcp`]: {},
      },
      HostConfig: {
        Binds: createExpectedBinds(),
        ExtraHosts: ['host.docker.internal:host-gateway'],
        NetworkMode: networkName,
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
  const config = useRuntimeConfig()

  if (!status.exists) {
    if (!profile) {
      throw new Error('A server profile is required to create the game server container')
    }

    const container = await createGameContainer(profile)
    await container.start()
    return
  }

  if (profile) {
    await prepareGameServerRuntimeFiles(profile, config.pzRconPassword)

    if (await containerNeedsReconciliation(profile)) {
      await reconcileGameContainer(profile)
      return
    }
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
