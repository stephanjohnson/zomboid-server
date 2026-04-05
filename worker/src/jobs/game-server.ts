import type { ServerProfile } from '@prisma/client'
import type Dockerode from 'dockerode'
import { existsSync } from 'node:fs'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, resolve } from 'node:path'

const ZOMBOID_MANAGER_MOD_ID = 'ZomboidManager'
const ZOMBOID_MANAGER_WORKSHOP_ID = '3685323705'

const DEFAULT_SERVER_INI_SETTINGS: Record<string, string> = {
  ResetID: '0',
  Map: 'Muldraugh, KY',
  Mods: '',
  WorkshopItems: '',
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

function serializeServerIni(data: Record<string, string>): string {
  return Object.entries(data)
    .map(([key, value]) => `${key}=${value}`)
    .join('\n')
}

function serializeSandboxVars(data: Record<string, unknown>): string {
  const lines = ['SandboxVars = {']

  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      lines.push(`    ${key} = "${value}",`)
    }
    else {
      lines.push(`    ${key} = ${value},`)
    }
  }

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

function createPortBindings(profile: ServerProfile): NonNullable<Dockerode.ContainerCreateOptions['HostConfig']>['PortBindings'] {
  return {
    [`${profile.gamePort}/udp`]: [{ HostPort: String(profile.gamePort) }],
    [`${profile.directPort}/udp`]: [{ HostPort: String(profile.directPort) }],
    [`${profile.rconPort}/tcp`]: [{ HostIp: '127.0.0.1', HostPort: String(profile.rconPort) }],
  }
}

export function buildContainerEnv(profile: ServerProfile, options: {
  branch?: string
  modApiBaseUrl: string
  rconPassword?: string
  forceUpdate?: boolean
}): string[] {
  const rconPassword = profile.rconPassword || options.rconPassword || ''
  const env = [
    `SERVERNAME=${profile.servername}`,
    `PZ_GAME_PORT=${profile.gamePort}`,
    `PZ_DIRECT_PORT=${profile.directPort}`,
    `PZ_RCON_PORT=${profile.rconPort}`,
    `PZ_RCON_PASSWORD=${rconPassword}`,
    `PZ_ADMIN_PASSWORD=${rconPassword}`,
    `PZ_STEAM_BRANCH=${options.branch ?? profile.steamBuild || 'public'}`,
    `PZ_MAP_NAMES=${profile.mapName}`,
    `PZ_MAX_PLAYERS=${profile.maxPlayers}`,
    `PZ_PVP=${profile.pvp ? 'true' : 'false'}`,
    `ZM_API_BASE_URL=${options.modApiBaseUrl}`,
  ]

  const iniOverrides = asStringRecord(profile.serverIniOverrides)
  if (Object.keys(iniOverrides).length > 0) {
    const overrides = Object.entries(iniOverrides)
      .map(([key, value]) => `${key}=${value}`)
      .join('\n')
    env.push(`PZ_INI_OVERRIDES=${overrides}`)
  }

  if (options.forceUpdate) {
    env.push('PZ_FORCE_UPDATE=true')
  }

  return env
}

export async function prepareGameServerRuntimeFiles(profile: ServerProfile, rconPassword: string): Promise<void> {
  const serverPath = join(getPzDataPath(), 'Server')
  const serverIniPath = join(serverPath, `${profile.servername}.ini`)
  const sandboxPath = join(serverPath, `${profile.servername}_SandboxVars.lua`)
  const serverIniOverrides = asStringRecord(profile.serverIniOverrides)
  const sandboxVarsOverrides = asUnknownRecord(profile.sandboxVarsOverrides)
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
    DoLuaChecksum: 'false',
  }

  serverIni.Mods = appendSemicolonValue(serverIni.Mods, ZOMBOID_MANAGER_MOD_ID)
  serverIni.WorkshopItems = appendSemicolonValue(serverIni.WorkshopItems, ZOMBOID_MANAGER_WORKSHOP_ID)

  await mkdir(dirname(serverIniPath), { recursive: true })
  await writeFile(serverIniPath, serializeServerIni(serverIni), 'utf-8')

  if (Object.keys(sandboxVarsOverrides).length === 0) {
    await rm(sandboxPath, { force: true })
    return
  }

  await writeFile(sandboxPath, serializeSandboxVars(sandboxVarsOverrides), 'utf-8')
}

export function createContainerOptions(profile: ServerProfile, options: {
  containerName: string
  image: string
  env: string[]
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
    `${getGameServerServerFilesMountSource()}:/home/steam/pzserver`,
  ]

  if (modSourceMount) {
    binds.push(`${modSourceMount}:/opt/ZomboidManager-source:ro`)
  }

  return {
    name: options.containerName,
    Image: options.image,
    Env: options.env,
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
      NetworkMode: networkName,
      PortBindings: createPortBindings(profile),
      RestartPolicy: { Name: 'unless-stopped' },
    },
  }
}
