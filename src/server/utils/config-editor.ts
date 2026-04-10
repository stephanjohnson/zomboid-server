import { collectConfigTypeHints, expandDotNotationRecord, getConfigDefinition, isDefaultRawValue, parseRawConfigValue } from '../../shared/config-settings'
import { buildProfileModSettings } from './game-server-runtime'
import { getProfileServerIniOverrides } from './profile-runtime-config'

type ConfigEditorProfile = {
  gamePort: number
  directPort: number
  rconPort: number
  rconPassword: string
  mapName: string
  maxPlayers: number
  pvp: boolean
  serverIniOverrides: unknown
  mods?: {
    workshopId: string
    modName: string
    isEnabled?: boolean | null
  }[]
}

export interface ServerIniProfileUpdate {
  gamePort?: number
  directPort?: number
  rconPort?: number
  rconPassword?: string
  mapName?: string
  maxPlayers?: number
  pvp?: boolean
}

export interface ServerIniEditorMutation {
  profileData: ServerIniProfileUpdate
  overrideSettings: Record<string, string> | null
  changedKeys: string[]
}

export function buildServerIniEditorSettings(profile: ConfigEditorProfile): Record<string, string> {
  const modSettings = buildProfileModSettings(profile)

  return {
    ...getProfileServerIniOverrides(profile),
    DefaultPort: String(profile.gamePort),
    UDPPort: String(profile.directPort),
    RCONPort: String(profile.rconPort),
    RCONPassword: profile.rconPassword ?? '',
    Map: profile.mapName,
    MaxPlayers: String(profile.maxPlayers),
    PVP: profile.pvp ? 'true' : 'false',
    Mods: modSettings.modIds.join(';'),
    WorkshopItems: modSettings.workshopIds.join(';'),
  }
}

function parseIntegerSetting(key: string, rawValue: string): number {
  const parsedValue = Number.parseInt(rawValue, 10)
  if (!Number.isFinite(parsedValue)) {
    throw new Error(`${key} must be a whole number`) 
  }

  return parsedValue
}

function parseBooleanSetting(key: string, rawValue: string): boolean {
  const normalizedValue = rawValue.trim().toLowerCase()
  if (normalizedValue === 'true' || normalizedValue === '1') {
    return true
  }

  if (normalizedValue === 'false' || normalizedValue === '0') {
    return false
  }

  throw new Error(`${key} must be true or false`)
}

export function splitServerIniEditorSettings(settings: Record<string, string>): {
  profileData: ServerIniProfileUpdate
  overrideSettings: Record<string, string>
} {
  const profileData: ServerIniProfileUpdate = {}
  const overrideSettings: Record<string, string> = {}

  for (const [key, rawValue] of Object.entries(settings)) {
    const definition = getConfigDefinition('server-ini', key)

    if (definition?.persistence === 'managed') {
      continue
    }

    if (definition?.persistence === 'profile-field') {
      switch (definition.profileField) {
        case 'gamePort':
          profileData.gamePort = parseIntegerSetting(key, rawValue)
          break
        case 'directPort':
          profileData.directPort = parseIntegerSetting(key, rawValue)
          break
        case 'rconPort':
          profileData.rconPort = parseIntegerSetting(key, rawValue)
          break
        case 'rconPassword':
          profileData.rconPassword = rawValue
          break
        case 'mapName':
          profileData.mapName = rawValue
          break
        case 'maxPlayers':
          profileData.maxPlayers = parseIntegerSetting(key, rawValue)
          break
        case 'pvp':
          profileData.pvp = parseBooleanSetting(key, rawValue)
          break
      }

      continue
    }

    if (isDefaultRawValue(definition, rawValue)) {
      continue
    }

    overrideSettings[key] = rawValue
  }

  return { profileData, overrideSettings }
}

function normalizeServerIniPatchValue(value: unknown): string | null {
  if (typeof value === 'string') {
    return value
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }

  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  return null
}

export function buildServerIniEditorMutation(
  profile: ConfigEditorProfile,
  patch: Record<string, unknown>,
): ServerIniEditorMutation | null {
  const normalizedPatch = Object.fromEntries(
    Object.entries(patch).flatMap(([key, value]) => {
      const normalizedValue = normalizeServerIniPatchValue(value)
      return normalizedValue == null ? [] : [[key, normalizedValue]]
    }),
  )

  if (Object.keys(normalizedPatch).length === 0) {
    return null
  }

  const currentSettings = buildServerIniEditorSettings(profile)
  const changedKeys = Object.entries(normalizedPatch)
    .filter(([key, value]) => currentSettings[key] !== value)
    .map(([key]) => key)

  if (changedKeys.length === 0) {
    return null
  }

  const splitSettings = splitServerIniEditorSettings({
    ...currentSettings,
    ...normalizedPatch,
  })

  return {
    profileData: splitSettings.profileData,
    overrideSettings: Object.keys(splitSettings.overrideSettings).length > 0
      ? splitSettings.overrideSettings
      : null,
    changedKeys,
  }
}

export function normalizeSandboxEditorSettings(
  settings: Record<string, string>,
  currentSettings: Record<string, unknown>,
): Record<string, unknown> {
  const typeHints = collectConfigTypeHints(currentSettings)
  const nextSettings: Record<string, unknown> = {}

  for (const [key, rawValue] of Object.entries(settings)) {
    const definition = getConfigDefinition('sandbox', key)

    if (definition && isDefaultRawValue(definition, rawValue)) {
      continue
    }

    const fallbackType = typeHints[key] ?? 'string'
    nextSettings[key] = parseRawConfigValue(rawValue, definition, fallbackType)
  }

  return expandDotNotationRecord(nextSettings)
}