import type { ServerProfile } from '@prisma/client'
import type Dockerode from 'dockerode'
import { existsSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, resolve } from 'node:path'

const ZOMBOID_MANAGER_MOD_ID = 'ZomboidManager'
const ZOMBOID_MANAGER_WORKSHOP_ID = '3685323705'

interface RuntimeProfileModEntry {
  workshopId: string
  modName: string
  isEnabled?: boolean | null
}

type RuntimeProfile = ServerProfile & {
  mods?: RuntimeProfileModEntry[]
}

const DEFAULT_SERVER_INI_SETTINGS: Record<string, string> = {
  ResetID: '0',
  Map: 'Muldraugh, KY',
  Mods: '',
  WorkshopItems: '',
  DoLuaChecksum: 'false',
  Password: '',
  Public: 'true',
  PauseEmpty: 'true',
  Open: 'true',
  AutoCreateUserInWhiteList: 'true',
  AutoSave: 'true',
  SaveWorldEveryMinutes: '15',
  SteamVAC: 'true',
}

function asStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(value).flatMap(([key, innerValue]) => (
      typeof innerValue === 'string'
        ? [[key, innerValue]]
        : []
    )),
  )
}

function asUnknownRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function appendSemicolonValue(listValue: string | undefined, entry: string): string {
  const entries = (listValue ?? '')
    .split(';')
    .map(value => value.trim())
    .filter(Boolean)

  if (!entries.includes(entry)) {
    entries.push(entry)
  }

  return entries.join(';')
}

function appendEntries(listValue: string | undefined, entries: string[]): string {
  let nextValue = listValue

  for (const entry of entries) {
    nextValue = appendSemicolonValue(nextValue, entry)
  }

  return nextValue ?? ''
}

function splitSemicolonValue(listValue: string | undefined): string[] {
  return (listValue ?? '')
    .split(';')
    .map(value => value.trim())
    .filter(Boolean)
}

function buildProfileModSettings(profile: {
  serverIniOverrides?: unknown
  mods?: RuntimeProfileModEntry[]
}): {
  modIds: string[]
  workshopIds: string[]
} {
  const serverIniOverrides = asStringRecord(profile.serverIniOverrides)
  const modIds = splitSemicolonValue(serverIniOverrides.Mods)
  const workshopIds = splitSemicolonValue(serverIniOverrides.WorkshopItems)

  for (const mod of profile.mods ?? []) {
    if (mod.isEnabled === false) {
      continue
    }

    for (const modId of splitSemicolonValue(mod.modName)) {
      if (!modIds.includes(modId)) {
        modIds.push(modId)
      }
    }

    if (!workshopIds.includes(mod.workshopId)) {
      workshopIds.push(mod.workshopId)
    }
  }

  if (!modIds.includes(ZOMBOID_MANAGER_MOD_ID)) {
    modIds.push(ZOMBOID_MANAGER_MOD_ID)
  }

  if (!workshopIds.includes(ZOMBOID_MANAGER_WORKSHOP_ID)) {
    workshopIds.push(ZOMBOID_MANAGER_WORKSHOP_ID)
  }

  return { modIds, workshopIds }
}

function serializeServerIni(data: Record<string, string>): string {
  return Object.entries(data)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function expandDotNotationRecord(values: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(values)) {
    const segments = key.split('.').filter(Boolean)
    if (segments.length === 0) {
      continue
    }

    let current = result

    for (const [index, segment] of segments.entries()) {
      if (index === segments.length - 1) {
        current[segment] = value
        continue
      }

      if (!isPlainObject(current[segment])) {
        current[segment] = {}
      }

      current = current[segment] as Record<string, unknown>
    }
  }

  return result
}

function normalizeSandboxTree(data: Record<string, unknown>): Record<string, unknown> {
  const expandedData = expandDotNotationRecord(data)
  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(expandedData)) {
    result[key] = isPlainObject(value)
      ? normalizeSandboxTree(value)
      : value
  }

  return result
}

function formatSandboxValue(value: unknown): string {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : '0'
  }

  const normalizedValue = typeof value === 'string' ? value : String(value ?? '')
  return `"${normalizedValue.replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}

function stringifySandboxTable(data: Record<string, unknown>, indentLevel: number): string[] {
  const lines: string[] = []
  const indent = '    '.repeat(indentLevel)

  for (const [key, value] of Object.entries(data)) {
    if (isPlainObject(value)) {
      lines.push(`${indent}${key} = {`)
      lines.push(...stringifySandboxTable(value, indentLevel + 1))
      lines.push(`${indent}},`)
      continue
    }

    lines.push(`${indent}${key} = ${formatSandboxValue(value)},`)
  }

  return lines
}

function serializeSandboxVars(data: Record<string, unknown>): string {
  const lines = ['SandboxVars = {']
  lines.push(...stringifySandboxTable(normalizeSandboxTree(data), 1))
  lines.push('}')
  return lines.join('\n')
}

function resolveMountSource(configuredSource: string | undefined, fallback: string): string {
  const mountSource = configuredSource ?? fallback

  if (mountSource.includes('/') || mountSource.startsWith('.')) {
    return isAbsolute(mountSource) ? mountSource : resolve(process.cwd(), mountSource)
  }

  return mountSource
}

function getPzDataPath(): string {
  return process.env.PZ_DATA_PATH || '/pzm-data'
}

function getGameServerDataMountSource(): string {
  return resolveMountSource(process.env.GAME_SERVER_DATA_MOUNT_SOURCE, 'pzm-data')
}

function getGameServerLuaBridgeMountSource(): string {
  return resolveMountSource(process.env.GAME_SERVER_LUA_BRIDGE_MOUNT_SOURCE, 'pzm-lua-bridge')
}

function getGameServerServerFilesMountSource(): string {
  return resolveMountSource(process.env.GAME_SERVER_SERVER_FILES_MOUNT_SOURCE, 'pzm-server-files')
}

function getGameServerModSourceMount(): string | undefined {
  const mountSource = process.env.GAME_SERVER_MOD_SOURCE_MOUNT
  return mountSource ? resolveMountSource(mountSource, mountSource) : undefined
}

function getGameServerNetworkName(): string {
  return process.env.GAME_SERVER_NETWORK_NAME || 'zomboid-server_zomboid-net'
}

function getGameServerNetworkAlias(): string {
  return process.env.GAME_SERVER_NETWORK_ALIAS || 'game-server'
}

function inferComposeProjectName(): string {
  const configuredProjectName = process.env.GAME_SERVER_COMPOSE_PROJECT_NAME || process.env.COMPOSE_PROJECT_NAME

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
  const memory = parseDockerMemory(process.env.GAME_SERVER_MEM_LIMIT || '4g', 'GAME_SERVER_MEM_LIMIT')
  const memoryReservation = parseDockerMemory(process.env.GAME_SERVER_MEM_RESERVATION || '3g', 'GAME_SERVER_MEM_RESERVATION')

  if (memory > 0 && memoryReservation > memory) {
    throw new Error('GAME_SERVER_MEM_RESERVATION cannot exceed GAME_SERVER_MEM_LIMIT')
  }

  return {
    Memory: memory,
    MemoryReservation: memoryReservation,
  }
}

export async function getComposeOwnedContainerLabels(docker: Dockerode, serviceName: string): Promise<Record<string, string>> {
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
    const info = await docker.getContainer(currentContainerId).inspect()
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
    // Fall back to inferred labels when the worker runs outside Compose.
  }

  return labels
}

function createPortBindings(profile: ServerProfile): NonNullable<Dockerode.ContainerCreateOptions['HostConfig']>['PortBindings'] {
  return {
    [`${profile.gamePort}/udp`]: [{ HostPort: String(profile.gamePort) }],
    [`${profile.directPort}/udp`]: [{ HostPort: String(profile.directPort) }],
    [`${profile.rconPort}/tcp`]: [{ HostIp: '127.0.0.1', HostPort: String(profile.rconPort) }],
  }
}

export function buildContainerEnv(profile: RuntimeProfile, options: {
  branch?: string
  modApiBaseUrl: string
  rconPassword?: string
  forceUpdate?: boolean
}): string[] {
  const rconPassword = profile.rconPassword || options.rconPassword || ''
  const branch = options.branch ?? profile.steamBuild || 'public'
  const modSettings = buildProfileModSettings({
    serverIniOverrides: profile.serverIniOverrides,
    mods: profile.mods,
  })
  const env = [
    `SERVERNAME=${profile.servername}`,
    `PZ_GAME_PORT=${profile.gamePort}`,
    `PZ_DIRECT_PORT=${profile.directPort}`,
    `PZ_RCON_PORT=${profile.rconPort}`,
    `PZ_RCON_PASSWORD=${rconPassword}`,
    `PZ_ADMIN_PASSWORD=${rconPassword}`,
    `PZ_STEAM_BRANCH=${branch}`,
    `PZ_MAP_NAMES=${profile.mapName}`,
    `PZ_MAX_PLAYERS=${profile.maxPlayers}`,
    `PZ_PVP=${profile.pvp ? 'true' : 'false'}`,
    `ZM_API_BASE_URL=${options.modApiBaseUrl}`,
    `ADMIN_PASSWORD=${rconPassword}`,
    `ADMIN_USERNAME=admin`,
    `DEFAULT_PORT=${profile.gamePort}`,
    `UDP_PORT=${profile.directPort}`,
    `RCON_PASSWORD=${rconPassword}`,
    `RCON_PORT=${profile.rconPort}`,
    `SERVER_NAME=${profile.servername}`,
    `GAME_VERSION=${branch}`,
    `MAP_NAMES=${profile.mapName}`,
    `MAX_PLAYERS=${profile.maxPlayers}`,
    `MAX_RAM=${process.env.PZ_MAX_RAM || '3072m'}`,
    `PUBLIC_SERVER=true`,
    `PAUSE_ON_EMPTY=true`,
    `STEAM_VAC=true`,
    `MOD_NAMES=${modSettings.modIds.join(';')}`,
    `MOD_WORKSHOP_IDS=${modSettings.workshopIds.join(';')}`,
  ]

  const iniOverrides = asStringRecord(profile.serverIniOverrides)
  if (Object.keys(iniOverrides).length > 0) {
    const overrides = Object.entries(iniOverrides)
      .filter(([key]) => key !== 'Mods' && key !== 'WorkshopItems')
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')

    if (overrides.length > 0) {
      env.push(`PZ_INI_OVERRIDES=${overrides}`)
    }
  }

  if (options.forceUpdate) {
    env.push('PZ_FORCE_UPDATE=true')
  }

  return env
}

export async function prepareGameServerRuntimeFiles(profile: RuntimeProfile, rconPassword: string): Promise<void> {
  const serverPath = join(getPzDataPath(), 'Server')
  const serverIniPath = join(serverPath, `${profile.servername}.ini`)
  const sandboxPath = join(serverPath, `${profile.servername}_SandboxVars.lua`)
  const serverIniOverrides = asStringRecord(profile.serverIniOverrides)
  const sandboxVarsOverrides = asUnknownRecord(profile.sandboxVarsOverrides)
  const modSettings = buildProfileModSettings(profile)
  const serverIni = {
    ...DEFAULT_SERVER_INI_SETTINGS,
    ...serverIniOverrides,
    DefaultPort: String(profile.gamePort),
    UDPPort: String(profile.directPort),
    Map: profile.mapName,
    MaxPlayers: String(profile.maxPlayers),
    PVP: profile.pvp ? 'true' : 'false',
    RCONPort: String(profile.rconPort),
    RCONPassword: rconPassword,
  }

  serverIni.Mods = appendEntries(serverIni.Mods, modSettings.modIds)
  serverIni.WorkshopItems = appendEntries(serverIni.WorkshopItems, modSettings.workshopIds)

  await mkdir(dirname(serverIniPath), { recursive: true })
  await writeFile(serverIniPath, serializeServerIni(serverIni), 'utf-8')

  if (Object.keys(sandboxVarsOverrides).length === 0) {
    await rm(sandboxPath, { force: true })
    return
  }

  await writeFile(sandboxPath, serializeSandboxVars(sandboxVarsOverrides), 'utf-8')
}

export function createContainerOptions(profile: RuntimeProfile, options: {
  containerName: string
  image: string
  env: string[]
  labels?: Record<string, string>
}): Dockerode.ContainerCreateOptions {
  const networkName = getGameServerNetworkName()
  const networkAlias = getGameServerNetworkAlias()
  const modSourceMount = getGameServerModSourceMount()

  if (modSourceMount && modSourceMount.includes('/') && !existsSync(modSourceMount)) {
    throw new Error(`Game server mod source mount does not exist: ${modSourceMount}`)
  }

  const binds = [
    `${getGameServerDataMountSource()}:/home/steam/Zomboid`,
    `${getGameServerLuaBridgeMountSource()}:/home/steam/Zomboid/Lua`,
    `${getGameServerServerFilesMountSource()}:/home/steam/ZomboidDedicatedServer`,
  ]

  if (modSourceMount) {
    binds.push(`${modSourceMount}:/opt/ZomboidManager-source:ro`)
  }

  const entrypointMount = process.env.GAME_SERVER_ENTRYPOINT_MOUNT
  if (entrypointMount) {
    binds.push(`${resolveMountSource(entrypointMount, entrypointMount)}:/home/steam/entrypoint.sh:ro`)
  }

  const configureScriptMount = process.env.GAME_SERVER_CONFIGURE_SCRIPT_MOUNT
  if (configureScriptMount) {
    binds.push(`${resolveMountSource(configureScriptMount, configureScriptMount)}:/home/steam/configure-server.sh:ro`)
  }

  return {
    name: options.containerName,
    Image: options.image,
    Entrypoint: ['/bin/bash', '/home/steam/entrypoint.sh'],
    Env: options.env,
    Labels: options.labels,
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
      Binds: binds,
      ExtraHosts: ['host.docker.internal:host-gateway'],
      ...getGameServerHostResourceConfig(),
      NetworkMode: networkName,
      PortBindings: createPortBindings(profile),
      RestartPolicy: { Name: 'unless-stopped' },
    },
  }
}
