export type ConfigDomain = 'server-ini' | 'sandbox'
export type ConfigRawType = 'string' | 'number' | 'boolean'
export type ConfigControl = 'text' | 'number' | 'switch' | 'select' | 'list'
export type ConfigPersistence = 'override' | 'profile-field' | 'managed'
export type ManagedSettingTarget = 'mods'
export type ServerProfileEditableField = 'gamePort' | 'directPort' | 'rconPort' | 'rconPassword' | 'mapName' | 'maxPlayers' | 'pvp'

export interface ConfigOption {
  value: string
  label: string
  hint?: string
}

export interface ConfigSettingDefinition {
  label?: string
  group: string
  description: string
  rawType: ConfigRawType
  control: ConfigControl
  defaultValue?: string | number | boolean
  options?: ConfigOption[]
  min?: number
  max?: number
  step?: number
  docsUrl?: string
  searchTerms?: string[]
  persistence?: ConfigPersistence
  profileField?: ServerProfileEditableField
  managedTarget?: ManagedSettingTarget
  sensitive?: boolean
}

export interface GroupedConfigEntry {
  key: string
  value: string
  definition?: ConfigSettingDefinition
}

export interface GroupedConfigSection {
  group: string
  entries: GroupedConfigEntry[]
}

export const PZ_SERVER_SETTINGS_WIKI_URL = 'https://pzwiki.net/wiki/Server_settings'

const COMMON_MAP_OPTIONS: ConfigOption[] = [
  { value: 'Muldraugh, KY', label: 'Muldraugh, KY' },
  { value: 'Riverside, KY', label: 'Riverside, KY' },
  { value: 'Rosewood, KY', label: 'Rosewood, KY' },
  { value: 'West Point, KY', label: 'West Point, KY' },
]

const VERY_RARE_TO_ABUNDANT_OPTIONS: ConfigOption[] = [
  { value: '1', label: 'Extremely Rare' },
  { value: '2', label: 'Rare' },
  { value: '3', label: 'Normal' },
  { value: '4', label: 'Common' },
  { value: '5', label: 'Abundant' },
]

const VERY_LOW_TO_VERY_HIGH_OPTIONS: ConfigOption[] = [
  { value: '1', label: 'Very Low' },
  { value: '2', label: 'Low' },
  { value: '3', label: 'Normal' },
  { value: '4', label: 'High' },
  { value: '5', label: 'Very High' },
]

const VERY_FAST_TO_VERY_SLOW_OPTIONS: ConfigOption[] = [
  { value: '1', label: 'Very Fast' },
  { value: '2', label: 'Fast' },
  { value: '3', label: 'Normal' },
  { value: '4', label: 'Slow' },
  { value: '5', label: 'Very Slow' },
]

const NEVER_TO_VERY_OFTEN_OPTIONS: ConfigOption[] = [
  { value: '1', label: 'Never' },
  { value: '2', label: 'Extremely Rare' },
  { value: '3', label: 'Rare' },
  { value: '4', label: 'Sometimes' },
  { value: '5', label: 'Often' },
  { value: '6', label: 'Very Often' },
]

const DAY_LENGTH_OPTIONS: ConfigOption[] = [
  { value: '1', label: '15 minutes' },
  { value: '2', label: '30 minutes' },
  { value: '3', label: '1 hour' },
  { value: '4', label: '2 hours' },
  { value: '5', label: '3 hours' },
  { value: '6', label: '4 hours' },
  { value: '7', label: '5 hours' },
  { value: '8', label: '12 hours' },
  { value: '9', label: 'Real-time' },
]

const TEMPERATURE_OPTIONS: ConfigOption[] = [
  { value: '1', label: 'Very Cold' },
  { value: '2', label: 'Cold' },
  { value: '3', label: 'Normal' },
  { value: '4', label: 'Hot' },
  { value: '5', label: 'Very Hot' },
]

const RAIN_OPTIONS: ConfigOption[] = [
  { value: '1', label: 'Very Dry' },
  { value: '2', label: 'Dry' },
  { value: '3', label: 'Normal' },
  { value: '4', label: 'Rainy' },
  { value: '5', label: 'Very Rainy' },
]

const EROSION_OPTIONS: ConfigOption[] = [
  { value: '1', label: 'Very Fast (20 days)' },
  { value: '2', label: 'Fast (50 days)' },
  { value: '3', label: 'Normal (100 days)' },
  { value: '4', label: 'Slow (200 days)' },
  { value: '5', label: 'Very Slow (500 days)' },
]

const LOOT_RESPAWN_OPTIONS: ConfigOption[] = [
  { value: '1', label: 'Never' },
  { value: '2', label: 'Every Day' },
  { value: '3', label: 'Every Week' },
  { value: '4', label: 'Every Month' },
  { value: '5', label: 'Every Two Months' },
]

const ZOMBIE_SPEED_OPTIONS: ConfigOption[] = [
  { value: '1', label: 'Sprinters' },
  { value: '2', label: 'Fast Shamblers' },
  { value: '3', label: 'Shamblers' },
  { value: '4', label: 'Random' },
]

const ZOMBIE_STRENGTH_OPTIONS: ConfigOption[] = [
  { value: '1', label: 'Superhuman' },
  { value: '2', label: 'Normal' },
  { value: '3', label: 'Weak' },
]

const ZOMBIE_TOUGHNESS_OPTIONS: ConfigOption[] = [
  { value: '1', label: 'Tough' },
  { value: '2', label: 'Normal' },
  { value: '3', label: 'Fragile' },
]

const ZOMBIE_TRANSMISSION_OPTIONS: ConfigOption[] = [
  { value: '1', label: 'Blood + Saliva' },
  { value: '2', label: 'Saliva Only' },
  { value: '3', label: 'Everyone Is Infected' },
  { value: '4', label: 'None' },
]

const INFECTION_TIMING_OPTIONS: ConfigOption[] = [
  { value: '1', label: 'Instant' },
  { value: '2', label: 'Minutes' },
  { value: '3', label: 'Hours' },
  { value: '4', label: 'Days' },
  { value: '5', label: 'One Week' },
  { value: '6', label: 'One to Two Weeks' },
]

const ZOMBIE_COGNITION_OPTIONS: ConfigOption[] = [
  { value: '1', label: 'Navigate + Use Doors' },
  { value: '2', label: 'Navigate' },
  { value: '3', label: 'Basic Navigation' },
]

const ZOMBIE_MEMORY_OPTIONS: ConfigOption[] = [
  { value: '1', label: 'Long' },
  { value: '2', label: 'Normal' },
  { value: '3', label: 'Short' },
  { value: '4', label: 'None' },
]

const ZOMBIE_SENSE_OPTIONS: ConfigOption[] = [
  { value: '1', label: 'High' },
  { value: '2', label: 'Normal' },
  { value: '3', label: 'Poor' },
]

function defineSetting(definition: ConfigSettingDefinition): ConfigSettingDefinition {
  return {
    persistence: 'override',
    ...definition,
  }
}

export const SERVER_INI_GROUP_ORDER = [
  'Access & Visibility',
  'Player Rules',
  'Network & RCON',
  'World & Saves',
  'Security',
  'World Map',
  'Workshop & Mods',
] as const

export const SERVER_INI_SETTING_DEFINITIONS: Record<string, ConfigSettingDefinition> = {
  Public: defineSetting({
    label: 'Public Listing',
    group: 'Access & Visibility',
    description: 'Show this server in the public browser.',
    rawType: 'boolean',
    control: 'switch',
    defaultValue: true,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  Open: defineSetting({
    label: 'Open Server',
    group: 'Access & Visibility',
    description: 'Allow new players to join without being pre-whitelisted.',
    rawType: 'boolean',
    control: 'switch',
    defaultValue: true,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  Password: defineSetting({
    group: 'Access & Visibility',
    description: 'Optional password players must enter to join.',
    rawType: 'string',
    control: 'text',
    defaultValue: '',
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
    sensitive: true,
  }),
  AutoCreateUserInWhiteList: defineSetting({
    label: 'Auto-Whitelist Players',
    group: 'Player Rules',
    description: 'Automatically create whitelist entries when a new account joins.',
    rawType: 'boolean',
    control: 'switch',
    defaultValue: true,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
    searchTerms: ['whitelist', 'auto create user'],
  }),
  MaxPlayers: defineSetting({
    label: 'Max Players',
    group: 'Player Rules',
    description: 'Maximum number of concurrent players allowed on this profile.',
    rawType: 'number',
    control: 'number',
    defaultValue: 16,
    min: 1,
    max: 128,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
    persistence: 'profile-field',
    profileField: 'maxPlayers',
  }),
  PVP: defineSetting({
    label: 'PvP',
    group: 'Player Rules',
    description: 'Allow players to damage each other on this profile.',
    rawType: 'boolean',
    control: 'switch',
    defaultValue: true,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
    persistence: 'profile-field',
    profileField: 'pvp',
    searchTerms: ['player versus player'],
  }),
  DefaultPort: defineSetting({
    label: 'Game Port',
    group: 'Network & RCON',
    description: 'Primary port players connect to for the game server.',
    rawType: 'number',
    control: 'number',
    defaultValue: 16261,
    min: 1024,
    max: 65535,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
    persistence: 'profile-field',
    profileField: 'gamePort',
  }),
  UDPPort: defineSetting({
    label: 'Direct Connection Port',
    group: 'Network & RCON',
    description: 'Secondary UDP port used for direct traffic.',
    rawType: 'number',
    control: 'number',
    defaultValue: 16262,
    min: 1024,
    max: 65535,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
    persistence: 'profile-field',
    profileField: 'directPort',
  }),
  RCONPort: defineSetting({
    label: 'RCON Port',
    group: 'Network & RCON',
    description: 'Port used for remote console access.',
    rawType: 'number',
    control: 'number',
    defaultValue: 27015,
    min: 1024,
    max: 65535,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
    persistence: 'profile-field',
    profileField: 'rconPort',
  }),
  RCONPassword: defineSetting({
    label: 'RCON Password',
    group: 'Network & RCON',
    description: 'Password required for remote console connections.',
    rawType: 'string',
    control: 'text',
    defaultValue: '',
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
    persistence: 'profile-field',
    profileField: 'rconPassword',
    sensitive: true,
  }),
  PauseEmpty: defineSetting({
    label: 'Pause When Empty',
    group: 'World & Saves',
    description: 'Pause world simulation when no players are online.',
    rawType: 'boolean',
    control: 'switch',
    defaultValue: true,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  AutoSave: defineSetting({
    label: 'Auto Save',
    group: 'World & Saves',
    description: 'Automatically save the world at a fixed interval.',
    rawType: 'boolean',
    control: 'switch',
    defaultValue: true,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  SaveWorldEveryMinutes: defineSetting({
    label: 'Auto Save Interval',
    group: 'World & Saves',
    description: 'Minutes between automatic world saves.',
    rawType: 'number',
    control: 'number',
    defaultValue: 15,
    min: 1,
    max: 240,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  ResetID: defineSetting({
    label: 'Reset ID',
    group: 'World & Saves',
    description: 'Incrementing this forces a world reset on the next restart.',
    rawType: 'number',
    control: 'number',
    defaultValue: 0,
    min: 0,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  SteamVAC: defineSetting({
    label: 'Steam VAC',
    group: 'Security',
    description: 'Enable Valve Anti-Cheat checks for connecting players.',
    rawType: 'boolean',
    control: 'switch',
    defaultValue: true,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  Map: defineSetting({
    label: 'Map Rotation',
    group: 'World Map',
    description: 'Primary map name or semicolon-separated map rotation string.',
    rawType: 'string',
    control: 'select',
    defaultValue: 'Muldraugh, KY',
    options: COMMON_MAP_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
    persistence: 'profile-field',
    profileField: 'mapName',
    searchTerms: ['map name', 'spawn map', 'world map'],
  }),
  Mods: defineSetting({
    label: 'Active Mod IDs',
    group: 'Workshop & Mods',
    description: 'Managed on the mods page so workshop items and mod IDs stay in sync.',
    rawType: 'string',
    control: 'list',
    defaultValue: '',
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
    persistence: 'managed',
    managedTarget: 'mods',
  }),
  WorkshopItems: defineSetting({
    label: 'Workshop Item IDs',
    group: 'Workshop & Mods',
    description: 'Managed on the mods page so Steam workshop downloads stay in sync.',
    rawType: 'string',
    control: 'list',
    defaultValue: '',
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
    persistence: 'managed',
    managedTarget: 'mods',
  }),
}

export const SANDBOX_GROUP_ORDER = [
  'World Time',
  'Zombie Population',
  'Zombie Respawn',
  'Zombie Behavior',
  'Food & Loot',
  'Skill Multipliers',
  'Climate & Utilities',
] as const

export const SANDBOX_SETTING_DEFINITIONS: Record<string, ConfigSettingDefinition> = {
  DayLength: defineSetting({
    label: 'Day Length',
    group: 'World Time',
    description: 'Length of a full in-game day in real time. The raw value is a sandbox code, not a simple hour count.',
    rawType: 'number',
    control: 'select',
    defaultValue: 3,
    options: DAY_LENGTH_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
    searchTerms: ['day duration', '1 hour', '2 hours', 'time multiplier'],
  }),
  'ZombieConfig.PopulationMultiplier': defineSetting({
    label: 'Population Multiplier',
    group: 'Zombie Population',
    description: 'Overall zombie population multiplier across the world.',
    rawType: 'number',
    control: 'number',
    defaultValue: 1,
    min: 0,
    max: 4,
    step: 0.1,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  'ZombieConfig.PopulationPeakMultiplier': defineSetting({
    label: 'Peak Population Multiplier',
    group: 'Zombie Population',
    description: 'Population multiplier applied on the peak day.',
    rawType: 'number',
    control: 'number',
    defaultValue: 1.5,
    min: 0,
    max: 4,
    step: 0.1,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  'ZombieConfig.PopulationPeakDay': defineSetting({
    label: 'Peak Population Day',
    group: 'Zombie Population',
    description: 'In-game day when zombie population reaches its peak.',
    rawType: 'number',
    control: 'number',
    defaultValue: 28,
    min: 1,
    max: 365,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  'ZombieConfig.RespawnHours': defineSetting({
    label: 'Respawn Delay',
    group: 'Zombie Respawn',
    description: 'Real-time hours that must pass before cleared cells can respawn zombies.',
    rawType: 'number',
    control: 'number',
    defaultValue: 72,
    min: 0,
    max: 8760,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
    searchTerms: ['respawn delay', 'zombie respawn'],
  }),
  'ZombieConfig.RespawnUnseenHours': defineSetting({
    label: 'Respawn Unseen Hours',
    group: 'Zombie Respawn',
    description: 'Hours a chunk must stay unseen before respawn is allowed there.',
    rawType: 'number',
    control: 'number',
    defaultValue: 16,
    min: 0,
    max: 8760,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  'ZombieConfig.RespawnMultiplier': defineSetting({
    label: 'Respawn Multiplier',
    group: 'Zombie Respawn',
    description: 'Fraction of the target population restored each respawn cycle.',
    rawType: 'number',
    control: 'number',
    defaultValue: 0.1,
    min: 0,
    max: 1,
    step: 0.05,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  'ZombieConfig.RedistributeHours': defineSetting({
    label: 'Redistribute Hours',
    group: 'Zombie Respawn',
    description: 'Hours between zombie redistribution passes inside a cell.',
    rawType: 'number',
    control: 'number',
    defaultValue: 12,
    min: 0,
    max: 8760,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  'ZombieLore.Speed': defineSetting({
    label: 'Zombie Speed',
    group: 'Zombie Behavior',
    description: 'How quickly zombies move when pursuing players.',
    rawType: 'number',
    control: 'select',
    defaultValue: 3,
    options: ZOMBIE_SPEED_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  'ZombieLore.Strength': defineSetting({
    label: 'Zombie Strength',
    group: 'Zombie Behavior',
    description: 'How hard zombies hit and how forcefully they damage structures.',
    rawType: 'number',
    control: 'select',
    defaultValue: 2,
    options: ZOMBIE_STRENGTH_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  'ZombieLore.Toughness': defineSetting({
    label: 'Zombie Toughness',
    group: 'Zombie Behavior',
    description: 'How much damage a zombie can absorb before dying.',
    rawType: 'number',
    control: 'select',
    defaultValue: 2,
    options: ZOMBIE_TOUGHNESS_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  'ZombieLore.Transmission': defineSetting({
    label: 'Transmission Mode',
    group: 'Zombie Behavior',
    description: 'How the zombie infection spreads to players.',
    rawType: 'number',
    control: 'select',
    defaultValue: 1,
    options: ZOMBIE_TRANSMISSION_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  'ZombieLore.Mortality': defineSetting({
    label: 'Infection Mortality',
    group: 'Zombie Behavior',
    description: 'How quickly infection kills a player once they are infected.',
    rawType: 'number',
    control: 'select',
    defaultValue: 6,
    options: INFECTION_TIMING_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  'ZombieLore.Reanimate': defineSetting({
    label: 'Reanimation Delay',
    group: 'Zombie Behavior',
    description: 'How long it takes dead bodies to reanimate after death.',
    rawType: 'number',
    control: 'select',
    defaultValue: 3,
    options: INFECTION_TIMING_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  'ZombieLore.Cognition': defineSetting({
    label: 'Zombie Cognition',
    group: 'Zombie Behavior',
    description: 'How well zombies navigate and interact with doors and obstacles.',
    rawType: 'number',
    control: 'select',
    defaultValue: 2,
    options: ZOMBIE_COGNITION_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  'ZombieLore.Memory': defineSetting({
    label: 'Zombie Memory',
    group: 'Zombie Behavior',
    description: 'How long zombies remember seeing a target before losing interest.',
    rawType: 'number',
    control: 'select',
    defaultValue: 2,
    options: ZOMBIE_MEMORY_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  'ZombieLore.Sight': defineSetting({
    label: 'Zombie Sight',
    group: 'Zombie Behavior',
    description: 'How easily zombies can spot players at a distance.',
    rawType: 'number',
    control: 'select',
    defaultValue: 2,
    options: ZOMBIE_SENSE_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  'ZombieLore.Hearing': defineSetting({
    label: 'Zombie Hearing',
    group: 'Zombie Behavior',
    description: 'How strongly zombies react to sound cues.',
    rawType: 'number',
    control: 'select',
    defaultValue: 2,
    options: ZOMBIE_SENSE_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  'ZombieLore.Smell': defineSetting({
    label: 'Zombie Smell',
    group: 'Zombie Behavior',
    description: 'How sensitive zombies are to scent and blood trails.',
    rawType: 'number',
    control: 'select',
    defaultValue: 2,
    options: ZOMBIE_SENSE_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  FoodLoot: defineSetting({
    label: 'Food Loot',
    group: 'Food & Loot',
    description: 'Overall abundance of food found in containers.',
    rawType: 'number',
    control: 'select',
    defaultValue: 3,
    options: VERY_RARE_TO_ABUNDANT_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  WeaponLoot: defineSetting({
    label: 'Weapon Loot',
    group: 'Food & Loot',
    description: 'Overall abundance of weapon loot found in containers.',
    rawType: 'number',
    control: 'select',
    defaultValue: 3,
    options: VERY_RARE_TO_ABUNDANT_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  OtherLoot: defineSetting({
    label: 'Other Loot',
    group: 'Food & Loot',
    description: 'Overall abundance of non-food, non-weapon loot.',
    rawType: 'number',
    control: 'select',
    defaultValue: 3,
    options: VERY_RARE_TO_ABUNDANT_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  NatureAbundance: defineSetting({
    label: 'Nature Abundance',
    group: 'Food & Loot',
    description: 'Abundance of foraging, fishing, and trapping resources.',
    rawType: 'number',
    control: 'select',
    defaultValue: 3,
    options: VERY_RARE_TO_ABUNDANT_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  Farming: defineSetting({
    label: 'Crop Growth Speed',
    group: 'Food & Loot',
    description: 'How quickly crops grow from planted to harvestable.',
    rawType: 'number',
    control: 'select',
    defaultValue: 3,
    options: VERY_FAST_TO_VERY_SLOW_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
    searchTerms: ['farming speed', 'plant growth'],
  }),
  FoodRotSpeed: defineSetting({
    label: 'Food Rot Speed',
    group: 'Food & Loot',
    description: 'How quickly perishable food spoils.',
    rawType: 'number',
    control: 'select',
    defaultValue: 3,
    options: VERY_FAST_TO_VERY_SLOW_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  FridgeFactor: defineSetting({
    label: 'Fridge Effectiveness',
    group: 'Food & Loot',
    description: 'How strongly refrigeration slows food spoilage.',
    rawType: 'number',
    control: 'select',
    defaultValue: 3,
    options: VERY_LOW_TO_VERY_HIGH_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  LootRespawn: defineSetting({
    label: 'Loot Respawn',
    group: 'Food & Loot',
    description: 'How frequently containers refill after being looted.',
    rawType: 'number',
    control: 'select',
    defaultValue: 1,
    options: LOOT_RESPAWN_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  Alarm: defineSetting({
    label: 'House Alarms',
    group: 'Food & Loot',
    description: 'Frequency of house alarms triggering when players enter buildings.',
    rawType: 'number',
    control: 'select',
    defaultValue: 6,
    options: NEVER_TO_VERY_OFTEN_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  LockedHouses: defineSetting({
    label: 'Locked Houses',
    group: 'Food & Loot',
    description: 'Frequency of residential doors being locked.',
    rawType: 'number',
    control: 'select',
    defaultValue: 6,
    options: NEVER_TO_VERY_OFTEN_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  XpMultiplier: defineSetting({
    label: 'XP Multiplier',
    group: 'Skill Multipliers',
    description: 'Global multiplier applied to skill experience gain.',
    rawType: 'number',
    control: 'number',
    defaultValue: 1,
    min: 0.01,
    max: 1000,
    step: 0.05,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
    searchTerms: ['skill multiplier', 'xp', 'experience'],
  }),
  Temperature: defineSetting({
    label: 'Temperature',
    group: 'Climate & Utilities',
    description: 'Overall world temperature bias.',
    rawType: 'number',
    control: 'select',
    defaultValue: 3,
    options: TEMPERATURE_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  Rain: defineSetting({
    label: 'Rain Frequency',
    group: 'Climate & Utilities',
    description: 'How often and how heavily it rains.',
    rawType: 'number',
    control: 'select',
    defaultValue: 3,
    options: RAIN_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  ErosionSpeed: defineSetting({
    label: 'Erosion Speed',
    group: 'Climate & Utilities',
    description: 'How quickly nature reclaims roads, buildings, and yards.',
    rawType: 'number',
    control: 'select',
    defaultValue: 3,
    options: EROSION_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  WaterShutModifier: defineSetting({
    label: 'Water Shutoff Delay',
    group: 'Climate & Utilities',
    description: 'Days before water shuts off. Use -1 to shut it off immediately.',
    rawType: 'number',
    control: 'number',
    defaultValue: 14,
    min: -1,
    max: 3650,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
  ElecShutModifier: defineSetting({
    label: 'Electricity Shutoff Delay',
    group: 'Climate & Utilities',
    description: 'Days before electricity shuts off. Use -1 to shut it off immediately.',
    rawType: 'number',
    control: 'number',
    defaultValue: 14,
    min: -1,
    max: 3650,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
  }),
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

export function getConfigDefinitions(domain: ConfigDomain): Record<string, ConfigSettingDefinition> {
  return domain === 'server-ini'
    ? SERVER_INI_SETTING_DEFINITIONS
    : SANDBOX_SETTING_DEFINITIONS
}

export function getConfigDefinition(domain: ConfigDomain, key: string): ConfigSettingDefinition | undefined {
  return getConfigDefinitions(domain)[key]
}

export function getConfigGroupOrder(domain: ConfigDomain): readonly string[] {
  return domain === 'server-ini'
    ? SERVER_INI_GROUP_ORDER
    : SANDBOX_GROUP_ORDER
}

export function humanizeConfigKey(key: string): string {
  const tail = key.split('.').pop() ?? key
  return tail
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/_/g, ' ')
    .trim()
}

export function serializeConfigValue(value: unknown): string {
  if (typeof value === 'boolean') {
    return value ? 'true' : 'false'
  }

  if (typeof value === 'number') {
    return Number.isFinite(value) ? String(value) : ''
  }

  if (typeof value === 'string') {
    return value
  }

  return value == null ? '' : String(value)
}

export function inferConfigRawType(value: unknown): ConfigRawType {
  if (typeof value === 'boolean') {
    return 'boolean'
  }

  if (typeof value === 'number') {
    return 'number'
  }

  return 'string'
}

export function flattenConfigRecord(value: Record<string, unknown>, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}

  for (const [key, innerValue] of Object.entries(value)) {
    const nextKey = prefix ? `${prefix}.${key}` : key
    if (isPlainObject(innerValue)) {
      Object.assign(result, flattenConfigRecord(innerValue, nextKey))
      continue
    }

    result[nextKey] = serializeConfigValue(innerValue)
  }

  return result
}

export function expandDotNotationRecord(values: Record<string, unknown>): Record<string, unknown> {
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

export function getDefaultRawValue(definition?: ConfigSettingDefinition): string | null {
  if (!definition || definition.defaultValue === undefined) {
    return null
  }

  return serializeConfigValue(definition.defaultValue)
}

export function isDefaultRawValue(definition: ConfigSettingDefinition | undefined, rawValue: string): boolean {
  const defaultRawValue = getDefaultRawValue(definition)
  return defaultRawValue !== null && rawValue === defaultRawValue
}

export function parseRawConfigValue(
  rawValue: string,
  definition?: ConfigSettingDefinition,
  fallbackType: ConfigRawType = 'string',
): string | number | boolean {
  const rawType = definition?.rawType ?? fallbackType
  const normalizedValue = rawValue.trim()

  if (rawType === 'boolean') {
    if (normalizedValue === 'true' || normalizedValue === '1') {
      return true
    }

    if (normalizedValue === 'false' || normalizedValue === '0') {
      return false
    }

    throw new Error('Expected a boolean raw value of true or false')
  }

  if (rawType === 'number') {
    if (!normalizedValue) {
      throw new Error('Expected a numeric raw value')
    }

    const parsedValue = Number(normalizedValue)
    if (!Number.isFinite(parsedValue)) {
      throw new Error('Expected a numeric raw value')
    }

    return parsedValue
  }

  return rawValue
}

export function buildEditorDisplayValues(
  domain: ConfigDomain,
  currentValues: Record<string, string>,
): Record<string, string> {
  const definitions = getConfigDefinitions(domain)
  const keys = new Set([...Object.keys(definitions), ...Object.keys(currentValues)])
  const result: Record<string, string> = {}

  for (const key of keys) {
    result[key] = currentValues[key] ?? getDefaultRawValue(definitions[key]) ?? ''
  }

  return result
}

export function groupConfigEntries(
  domain: ConfigDomain,
  values: Record<string, string>,
): GroupedConfigSection[] {
  const definitions = getConfigDefinitions(domain)
  const groups = new Map<string, GroupedConfigEntry[]>()

  for (const groupName of getConfigGroupOrder(domain)) {
    groups.set(groupName, [])
  }

  for (const [key, value] of Object.entries(values)) {
    const definition = definitions[key]
    const groupName = definition?.group ?? 'Other'
    const entries = groups.get(groupName) ?? []
    entries.push({ key, value, definition })
    groups.set(groupName, entries)
  }

  const sortedEntries = (entries: GroupedConfigEntry[]) => entries.sort((left, right) => {
    const leftLabel = left.definition?.label ?? humanizeConfigKey(left.key)
    const rightLabel = right.definition?.label ?? humanizeConfigKey(right.key)
    return leftLabel.localeCompare(rightLabel)
  })

  const result: GroupedConfigSection[] = []

  for (const groupName of getConfigGroupOrder(domain)) {
    const entries = groups.get(groupName)
    if (!entries || entries.length === 0) {
      continue
    }

    result.push({ group: groupName, entries: sortedEntries(entries) })
  }

  const otherEntries = groups.get('Other')
  if (otherEntries && otherEntries.length > 0) {
    result.push({ group: 'Other', entries: sortedEntries(otherEntries) })
  }

  return result
}

export function collectConfigTypeHints(
  value: Record<string, unknown>,
  prefix = '',
): Record<string, ConfigRawType> {
  const result: Record<string, ConfigRawType> = {}

  for (const [key, innerValue] of Object.entries(value)) {
    const nextKey = prefix ? `${prefix}.${key}` : key
    if (isPlainObject(innerValue)) {
      Object.assign(result, collectConfigTypeHints(innerValue, nextKey))
      continue
    }

    result[nextKey] = inferConfigRawType(innerValue)
  }

  return result
}