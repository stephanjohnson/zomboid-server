import Dockerode from 'dockerode'
import { existsSync } from 'node:fs'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'

import { buildProfileModSettings, prepareGameServerRuntimeFiles, stripManagedModOverrides } from './game-server-runtime'
import {
  getGameServerConfigureScriptPath,
  getGameServerDataMountSource,
  getGameServerEntrypointPath,
  getGameServerLuaBridgeMountSource,
  getGameServerModSourceMount,
  getGameServerServerFilesMountSource,
  getLuaBridgePath,
  getPzDataPath,
  getPzServerPath,
} from './runtime-paths'
import { decodeDockerLogBuffer } from './server-logs'

let docker: Dockerode | null = null

export interface GameServerProfileRuntime {
  servername: string
  gamePort: number
  directPort: number
  rconPort: number
  rconPassword?: string
  steamBuild: string
  mapName: string
  maxPlayers: number
  pvp: boolean
  serverIniOverrides?: Record<string, string>
  sandboxVarsOverrides?: Record<string, unknown>
  forceUpdate?: boolean
  mods?: Array<{
    workshopId: string
    modName: string
    isEnabled?: boolean | null
  }>
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

function inferComposeProjectName(): string {
  const configuredProjectName = process.env.NUXT_GAME_SERVER_COMPOSE_PROJECT_NAME
    || process.env.GAME_SERVER_COMPOSE_PROJECT_NAME
    || process.env.COMPOSE_PROJECT_NAME

  if (configuredProjectName) {
    return configuredProjectName
  }

  const networkName = getGameServerNetworkName()
  const separatorIndex = networkName.lastIndexOf('_')

  if (separatorIndex > 0) {
    return networkName.slice(0, separatorIndex)
  }

  return 'zomboid-server'
}

const DOCKER_MEMORY_UNITS: Record<string, number> = {
  b: 1,
  k: 1024,
  kb: 1024,
  m: 1024 ** 2,
  mb: 1024 ** 2,
  g: 1024 ** 3,
  gb: 1024 ** 3,
  t: 1024 ** 4,
  tb: 1024 ** 4,
}

function parseDockerMemory(value: string | undefined, variableName: string): number {
  if (!value?.trim()) {
    return 0
  }

  const normalizedValue = value.trim().toLowerCase()
  const match = normalizedValue.match(/^(\d+(?:\.\d+)?)([kmgt]?b?)?$/)

  if (!match) {
    throw new Error(`Invalid ${variableName} value: ${value}`)
  }

  const amount = Number(match[1])
  const unit = match[2] || 'b'
  const multiplier = DOCKER_MEMORY_UNITS[unit]

  if (!multiplier) {
    throw new Error(`Unsupported ${variableName} unit: ${value}`)
  }

  return Math.floor(amount * multiplier)
}

function getGameServerHostResourceConfig(): Pick<NonNullable<Dockerode.ContainerCreateOptions['HostConfig']>, 'Memory' | 'MemoryReservation'> {
  const config = useRuntimeConfig()
  const memory = parseDockerMemory(config.gameServerMemoryLimit, 'GAME_SERVER_MEM_LIMIT')
  const memoryReservation = parseDockerMemory(config.gameServerMemoryReservation, 'GAME_SERVER_MEM_RESERVATION')

  if (memory > 0 && memoryReservation > memory) {
    throw new Error('GAME_SERVER_MEM_RESERVATION cannot exceed GAME_SERVER_MEM_LIMIT')
  }

  return {
    Memory: memory,
    MemoryReservation: memoryReservation,
  }
}

function isMissingImageError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error)
  return message.toLowerCase().includes('no such image')
}

async function pullDockerImage(client: Dockerode, image: string): Promise<void> {
  const stream = await new Promise<NodeJS.ReadableStream>((resolve, reject) => {
    client.pull(image, (error, result) => {
      if (error) {
        reject(error)
        return
      }

      if (!result) {
        reject(new Error(`Docker pull did not return a stream for ${image}`))
        return
      }

      resolve(result)
    })
  })

  const modem = (client as Dockerode & {
    modem?: {
      followProgress?: (stream: NodeJS.ReadableStream, onFinished: (error?: Error | null) => void) => void
    }
  }).modem

  if (!modem?.followProgress) {
    throw new Error('Docker client does not support image pull progress tracking')
  }

  await new Promise<void>((resolve, reject) => {
    modem.followProgress(stream, (error) => {
      if (error) {
        reject(error)
        return
      }

      resolve()
    })
  })
}

async function ensureGameServerImageAvailable(client: Dockerode, image: string): Promise<void> {
  try {
    await pullDockerImage(client, image)
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to pull game server image ${image}: ${message}`)
  }
}

async function getComposeLabels(client: Dockerode, serviceName: string): Promise<Record<string, string>> {
  const labels: Record<string, string> = {
    'com.docker.compose.project': inferComposeProjectName(),
    'com.docker.compose.service': serviceName,
    'com.docker.compose.oneoff': 'False',
    'com.docker.compose.container-number': '1',
  }

  const currentContainerId = process.env.HOSTNAME

  if (!currentContainerId) {
    return labels
  }

  try {
    const info = await client.getContainer(currentContainerId).inspect()
    const currentLabels = info.Config?.Labels ?? {}

    for (const key of [
      'com.docker.compose.project',
      'com.docker.compose.project.config_files',
      'com.docker.compose.project.working_dir',
      'com.docker.compose.version',
    ]) {
      const value = currentLabels[key]

      if (value) {
        labels[key] = value
      }
    }
  }
  catch {
    // Fall back to the inferred project labels when running outside Compose.
  }

  return labels
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
  const rconPassword = profile.rconPassword || config.pzRconPassword
  const modSettings = buildProfileModSettings(profile)

  const env = [
    `SERVERNAME=${profile.servername}`,
    `PZ_GAME_PORT=${profile.gamePort}`,
    `PZ_DIRECT_PORT=${profile.directPort}`,
    `PZ_RCON_PORT=${profile.rconPort}`,
    `PZ_RCON_PASSWORD=${rconPassword}`,
    `PZ_ADMIN_PASSWORD=${rconPassword}`,
    `PZ_STEAM_BRANCH=${profile.steamBuild || 'public'}`,
    `PZ_MAP_NAMES=${profile.mapName}`,
    `PZ_MAX_PLAYERS=${profile.maxPlayers}`,
    `PZ_PVP=${profile.pvp ? 'true' : 'false'}`,
    `ZM_API_BASE_URL=${config.modApiBaseUrl}`,
    `ADMIN_PASSWORD=${rconPassword}`,
    `ADMIN_USERNAME=admin`,
    `DEFAULT_PORT=${profile.gamePort}`,
    `UDP_PORT=${profile.directPort}`,
    `RCON_PASSWORD=${rconPassword}`,
    `RCON_PORT=${profile.rconPort}`,
    `SERVER_NAME=${profile.servername}`,
    `GAME_VERSION=${profile.steamBuild || 'public'}`,
    `MAP_NAMES=${profile.mapName}`,
    `MAX_PLAYERS=${profile.maxPlayers}`,
    `MAX_RAM=${config.gameServerMaxRam}`,
    `PUBLIC_SERVER=true`,
    `PAUSE_ON_EMPTY=true`,
    `STEAM_VAC=true`,
    `MOD_NAMES=${modSettings.modIds.join(';')}`,
    `MOD_WORKSHOP_IDS=${modSettings.workshopIds.join(';')}`,
  ]

  // Serialize INI overrides as newline-separated key=value pairs
  if (profile.serverIniOverrides && Object.keys(profile.serverIniOverrides).length > 0) {
    const overrides = Object.entries(stripManagedModOverrides(profile.serverIniOverrides))
      .map(([k, v]) => `${k}=${v}`)
      .join('\n')

    if (overrides.length > 0) {
      env.push(`PZ_INI_OVERRIDES=${overrides}`)
    }
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
    `${getGameServerServerFilesMountSource()}:/home/steam/ZomboidDedicatedServer`,
  ]

  const modSourceMount = getGameServerModSourceMount()
  if (modSourceMount) {
    binds.push(`${modSourceMount}:/opt/ZomboidManager-source:ro`)
  }

  const entrypointPath = getGameServerEntrypointPath()
  if (existsSync(entrypointPath)) {
    binds.push(`${resolve(entrypointPath)}:/home/steam/entrypoint.sh:ro`)
  }

  const configureScriptPath = getGameServerConfigureScriptPath()
  if (existsSync(configureScriptPath)) {
    binds.push(`${resolve(configureScriptPath)}:/home/steam/configure-server.sh:ro`)
  }

  return binds
}

async function containerNeedsReconciliation(profile: GameServerProfileRuntime): Promise<boolean> {
  const config = useRuntimeConfig()
  const container = getGameContainer()
  const info = await container.inspect()
  const currentEnv = new Set(info.Config?.Env ?? [])
  const currentBinds = new Set(info.HostConfig?.Binds ?? [])
  const currentLabels = info.Config?.Labels ?? {}
  const expectedEnv = createEnv(profile)
  const expectedBinds = createExpectedBinds()
  const networkName = getGameServerNetworkName()
  const networkAlias = getGameServerNetworkAlias()
  const attachedNetwork = info.NetworkSettings?.Networks?.[networkName]
  const expectedLabels = await getComposeLabels(getDockerClient(), 'game-server')
  const expectedHostResources = getGameServerHostResourceConfig()

  if (info.Config?.Image !== config.gameServerImageName) {
    return true
  }

  if ((info.HostConfig?.Memory ?? 0) !== expectedHostResources.Memory) {
    return true
  }

  if ((info.HostConfig?.MemoryReservation ?? 0) !== expectedHostResources.MemoryReservation) {
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

  for (const [key, value] of Object.entries(expectedLabels)) {
    if (currentLabels[key] !== value) {
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
  const composeLabels = await getComposeLabels(client, 'game-server')
  const pzDataPath = getPzDataPath()
  const luaBridgePath = getLuaBridgePath()
  const pzServerPath = getPzServerPath()
  const modSourceMount = getGameServerModSourceMount()

  if (modSourceMount && modSourceMount.includes('/') && !existsSync(modSourceMount)) {
    throw new Error(`Game server mod source mount does not exist: ${modSourceMount}`)
  }

  await mkdir(pzDataPath, { recursive: true })
  await mkdir(luaBridgePath, { recursive: true })
  await mkdir(pzServerPath, { recursive: true })
  await prepareGameServerRuntimeFiles(profile, profile.rconPassword || config.pzRconPassword)

  const containerOptions: Dockerode.ContainerCreateOptions = {
    name: config.gameServerContainerName,
    Image: config.gameServerImageName,
    Entrypoint: ['/bin/bash', '/home/steam/entrypoint.sh'],
    Env: createEnv(profile),
    Labels: composeLabels,
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
      ...getGameServerHostResourceConfig(),
      NetworkMode: networkName,
      PortBindings: createPortBindings(profile),
      RestartPolicy: { Name: 'unless-stopped' },
    },
  }

  try {
    return await client.createContainer(containerOptions)
  }
  catch (error) {
    if (isMissingImageError(error)) {
      await ensureGameServerImageAvailable(client, config.gameServerImageName)
      return await client.createContainer(containerOptions)
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
    await prepareGameServerRuntimeFiles(profile, profile.rconPassword || config.pzRconPassword)

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
  return decodeDockerLogBuffer(logs)
}
