import { rm } from 'node:fs/promises'
import { join } from 'node:path'

import { writeSandboxVars, writeServerIni } from './config-parser'
import { getPzDataPath } from './runtime-paths'

const ZOMBOID_MANAGER_MOD_ID = 'ZomboidManager'
const ZOMBOID_MANAGER_WORKSHOP_ID = '3685323705'

interface RuntimeProfileModEntry {
  workshopId: string
  modName: string
  isEnabled?: boolean | null
}

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
  rconPassword?: string
  mapName: string
  maxPlayers: number
  pvp: boolean
  serverIniOverrides?: Record<string, string>
  sandboxVarsOverrides?: Record<string, unknown>
  mods?: RuntimeProfileModEntry[]
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

export function stripManagedModOverrides(overrides: Record<string, string> | undefined): Record<string, string> {
  if (!overrides) {
    return {}
  }

  return Object.fromEntries(
    Object.entries(overrides).filter(([key]) => key !== 'Mods' && key !== 'WorkshopItems'),
  )
}

export function buildProfileModSettings(profile: {
  serverIniOverrides?: Record<string, string>
  mods?: RuntimeProfileModEntry[]
}): {
  modIds: string[]
  workshopIds: string[]
} {
  const modIds = splitSemicolonValue(profile.serverIniOverrides?.Mods)
  const workshopIds = splitSemicolonValue(profile.serverIniOverrides?.WorkshopItems)

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

export function buildServerIniSettings(
  profile: GameServerRuntimeConfigSource,
  rconPassword: string,
): Record<string, string> {
  const modSettings = buildProfileModSettings(profile)
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

  settings.Mods = appendEntries(settings.Mods, modSettings.modIds)
  settings.WorkshopItems = appendEntries(settings.WorkshopItems, modSettings.workshopIds)

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
