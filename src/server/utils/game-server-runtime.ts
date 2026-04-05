import { rm } from 'node:fs/promises'
import { join } from 'node:path'

import { writeSandboxVars, writeServerIni } from './config-parser'
import { getPzDataPath } from './runtime-paths'

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

export interface GameServerRuntimeConfigSource {
  servername: string
  gamePort: number
  directPort: number
  rconPort: number
  mapName: string
  maxPlayers: number
  pvp: boolean
  serverIniOverrides?: Record<string, string>
  sandboxVarsOverrides?: Record<string, unknown>
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

export function buildServerIniSettings(
  profile: GameServerRuntimeConfigSource,
  rconPassword: string,
): Record<string, string> {
  const settings: Record<string, string> = {
    ...DEFAULT_SERVER_INI_SETTINGS,
    ...(profile.serverIniOverrides ?? {}),
    DefaultPort: String(profile.gamePort),
    UDPPort: String(profile.directPort),
    Map: profile.mapName,
    MaxPlayers: String(profile.maxPlayers),
    PVP: profile.pvp ? 'true' : 'false',
    RCONPort: String(profile.rconPort),
    RCONPassword: rconPassword,
    DoLuaChecksum: 'false',
  }

  settings.Mods = appendSemicolonValue(settings.Mods, ZOMBOID_MANAGER_MOD_ID)
  settings.WorkshopItems = appendSemicolonValue(settings.WorkshopItems, ZOMBOID_MANAGER_WORKSHOP_ID)

  return settings
}

export function buildSandboxVarsSettings(
  profile: GameServerRuntimeConfigSource,
): Record<string, unknown> {
  return {
    ...(profile.sandboxVarsOverrides ?? {}),
  }
}

export async function prepareGameServerRuntimeFiles(
  profile: GameServerRuntimeConfigSource,
  rconPassword: string,
): Promise<void> {
  const serverIni = buildServerIniSettings(profile, rconPassword)
  writeServerIni(profile.servername, serverIni)

  const sandboxVars = buildSandboxVarsSettings(profile)
  const sandboxPath = join(getPzDataPath(), 'Server', `${profile.servername}_SandboxVars.lua`)

  if (Object.keys(sandboxVars).length === 0) {
    await rm(sandboxPath, { force: true })
    return
  }

  writeSandboxVars(profile.servername, sandboxVars)
}
