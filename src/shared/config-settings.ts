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

const MONTH_OPTIONS: ConfigOption[] = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' },
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

const ZOMBIE_COUNT_OPTIONS: ConfigOption[] = [
  { value: '1', label: 'Insane' },
  { value: '2', label: 'High' },
  { value: '3', label: 'Normal' },
  { value: '4', label: 'Low' },
  { value: '5', label: 'None' },
]

const ZOMBIE_DISTRIBUTION_OPTIONS: ConfigOption[] = [
  { value: '1', label: 'Urban Focused' },
  { value: '2', label: 'Uniform' },
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

const ZOMBIE_DECOMPOSITION_OPTIONS: ConfigOption[] = [
  { value: '1', label: 'Slows + Weakens' },
  { value: '2', label: 'Slows' },
  { value: '3', label: 'Weakens' },
  { value: '4', label: 'No Effect' },
]

const ZOMBIE_SENSE_OPTIONS: ConfigOption[] = [
  { value: '1', label: 'High' },
  { value: '2', label: 'Normal' },
  { value: '3', label: 'Poor' },
]

const STEAM_SCOREBOARD_OPTIONS: ConfigOption[] = [
  { value: 'false', label: 'Hidden' },
  { value: 'true', label: 'Visible To Everyone' },
  { value: 'admin', label: 'Admins Only' },
]

const MAP_REMOTE_PLAYER_VISIBILITY_OPTIONS: ConfigOption[] = [
  { value: '1', label: 'Hidden' },
  { value: '2', label: 'Friends Only' },
  { value: '3', label: 'Everyone' },
]

const BAD_WORD_POLICY_OPTIONS: ConfigOption[] = [
  { value: '1', label: 'Ban' },
  { value: '2', label: 'Kick' },
  { value: '3', label: 'Record Violation' },
  { value: '4', label: 'Mute' },
]

function defineSetting(definition: ConfigSettingDefinition): ConfigSettingDefinition {
  return {
    persistence: 'override',
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
    ...definition,
  }
}

function booleanSetting(
  group: string,
  description: string,
  defaultValue: boolean,
  extra: Partial<ConfigSettingDefinition> = {},
): ConfigSettingDefinition {
  return defineSetting({
    group,
    description,
    rawType: 'boolean',
    control: 'switch',
    defaultValue,
    ...extra,
  })
}

function numberSetting(
  group: string,
  description: string,
  defaultValue?: number,
  extra: Partial<ConfigSettingDefinition> = {},
): ConfigSettingDefinition {
  return defineSetting({
    group,
    description,
    rawType: 'number',
    control: 'number',
    ...(defaultValue === undefined ? {} : { defaultValue }),
    ...extra,
  })
}

function textSetting(
  group: string,
  description: string,
  defaultValue?: string,
  extra: Partial<ConfigSettingDefinition> = {},
): ConfigSettingDefinition {
  return defineSetting({
    group,
    description,
    rawType: 'string',
    control: 'text',
    ...(defaultValue === undefined ? {} : { defaultValue }),
    ...extra,
  })
}

function selectSetting(
  rawType: ConfigRawType,
  group: string,
  description: string,
  defaultValue: string | number | boolean,
  options: ConfigOption[],
  extra: Partial<ConfigSettingDefinition> = {},
): ConfigSettingDefinition {
  return defineSetting({
    group,
    description,
    rawType,
    control: 'select',
    defaultValue,
    options,
    ...extra,
  })
}

export const SERVER_INI_GROUP_ORDER = [
  'Access & Visibility',
  'Chat & Identity',
  'Player Rules',
  'PvP & Safety',
  'Network & RCON',
  'World & Saves',
  'Safehouses & Factions',
  'Security',
  'Moderation & Logging',
  'Integrations',
  'Performance & Cleanup',
  'Anti-Cheat',
  'World Map',
  'Workshop & Mods',
] as const

const EXTENDED_SERVER_INI_SETTING_DEFINITIONS: Record<string, ConfigSettingDefinition> = {
  GlobalChat: booleanSetting('Chat & Identity', 'Enable or disable global chat.', true),
  ChatStreams: textSetting('Chat & Identity', 'Comma-separated list of enabled chat streams.', 's,r,a,w,y,sh,f,all', {
    label: 'Enabled Chat Streams',
  }),
  ServerWelcomeMessage: textSetting('Chat & Identity', 'Welcome message shown to players after login. Use <LINE> for new lines.', '', {
    label: 'Welcome Message',
  }),
  DisplayUserName: booleanSetting('Chat & Identity', 'Show usernames above player heads.', true, {
    label: 'Display Usernames',
  }),
  ShowFirstAndLastName: booleanSetting('Chat & Identity', 'Show character first and last names above player heads.', false, {
    label: 'Show Character Names',
  }),
  UsernameDisguises: booleanSetting('Chat & Identity', 'Allow disguised usernames for supported gameplay scenarios.', false),
  HideDisguisedUserName: booleanSetting('Chat & Identity', 'Hide the original username when a player is disguised.', false, {
    label: 'Hide Disguised Username',
  }),
  MouseOverToSeeDisplayName: booleanSetting('Chat & Identity', 'Require hovering another player to see their display name.', true, {
    label: 'Mouse Over For Display Name',
  }),
  ChatMessageCharacterLimit: numberSetting('Chat & Identity', 'Maximum characters allowed in a chat message.', 200, {
    min: 64,
    max: 1024,
  }),
  ChatMessageSlowModeTime: numberSetting('Chat & Identity', 'Cooldown between chat messages in slow mode, in seconds.', 3, {
    label: 'Chat Slow Mode Time',
    min: 1,
    max: 30,
  }),

  SpawnPoint: textSetting('Player Rules', 'Force all new players to spawn at a specific x,y,z coordinate. Use 0,0,0 to disable.', '0,0,0'),
  SpawnItems: textSetting('Player Rules', 'Comma-separated item types that new players receive on spawn.', ''),
  AllowCoop: booleanSetting('Player Rules', 'Allow co-op and split-screen players to join.', true),
  SleepAllowed: booleanSetting('Player Rules', 'Allow players to sleep when tired.', false),
  SleepNeeded: booleanSetting('Player Rules', 'Make players require sleep when tired.', false),
  KnockedDownAllowed: booleanSetting('Player Rules', 'Allow knockdown reactions in multiplayer.', false),
  SneakModeHideFromOtherPlayers: booleanSetting('Player Rules', 'Hide sneaking players from others more aggressively.', true),
  UltraSpeedDoesnotAffectToAnimals: booleanSetting('Player Rules', 'Prevent ultra-speed time acceleration from affecting animals.', false, {
    label: 'Ultra Speed Ignores Animals',
  }),
  PlayerRespawnWithSelf: booleanSetting('Player Rules', 'Allow players to respawn where they died.', false),
  PlayerRespawnWithOther: booleanSetting('Player Rules', 'Allow players to respawn at a split-screen partner location.', false),
  PlayerBumpPlayer: booleanSetting('Player Rules', 'Allow players to bump into and knock over other players.', false),

  PVPLogToolChat: booleanSetting('PvP & Safety', 'Write PvP events to the admin chat log.', true, {
    label: 'Log PvP To Admin Chat',
  }),
  PVPLogToolFile: booleanSetting('PvP & Safety', 'Write PvP events to the file log.', true, {
    label: 'Log PvP To File',
  }),
  SafetySystem: booleanSetting('PvP & Safety', 'Allow players to toggle individual PvP safety when PvP is enabled.', true),
  ShowSafety: booleanSetting('PvP & Safety', 'Show the PvP skull icon above players who disable safety.', true),
  SafetyToggleTimer: numberSetting('PvP & Safety', 'Time required to toggle PvP safety.', 2, {
    min: 0,
    max: 1000,
  }),
  SafetyCooldownTimer: numberSetting('PvP & Safety', 'Cooldown before a player can toggle PvP safety again.', 3, {
    min: 0,
    max: 1000,
  }),
  SafetyDisconnectDelay: numberSetting('PvP & Safety', 'Delay before safety changes apply after disconnecting.', 60, {
    min: 0,
    max: 60,
  }),
  PVPMeleeWhileHitReaction: booleanSetting('PvP & Safety', 'Allow follow-up melee hits while the target is in hit reaction.', false),
  HidePlayersBehindYou: booleanSetting('PvP & Safety', 'Hide players you cannot see directly, similar to zombies.', true),
  PVPMeleeDamageModifier: numberSetting('PvP & Safety', 'Damage multiplier for melee attacks in PvP.', 30, {
    label: 'PvP Melee Damage Multiplier',
    min: 0,
    max: 500,
    step: 0.1,
  }),
  PVPFirearmDamageModifier: numberSetting('PvP & Safety', 'Damage multiplier for firearm attacks in PvP.', 50, {
    label: 'PvP Firearm Damage Multiplier',
    min: 0,
    max: 500,
    step: 0.1,
  }),

  DenyLoginOnOverloadedServer: booleanSetting('Access & Visibility', 'Reject login attempts while the server is overloaded.', true),
  PublicName: textSetting('Access & Visibility', 'Public name shown in the in-game and Steam server browsers.', '', {
    label: 'Public Browser Name',
  }),
  PublicDescription: textSetting('Access & Visibility', 'Description shown in the public server browser.', '', {
    label: 'Public Browser Description',
  }),
  LoginQueueEnabled: booleanSetting('Access & Visibility', 'Enable the login queue when too many players connect at once.', false),
  LoginQueueConnectTimeout: numberSetting('Access & Visibility', 'How long players can stay in the login queue before timing out.', 60, {
    min: 20,
    max: 1200,
  }),
  server_browser_announced_ip: textSetting('Access & Visibility', 'Specific IP address to announce to the server browser.', '', {
    label: 'Announced Server IP',
  }),

  PingLimit: numberSetting('Network & RCON', 'Kick players whose ping stays above this limit. Set 0 to disable.', 0, {
    min: 0,
    max: 2147483647,
  }),
  SteamScoreboard: selectSetting('string', 'Network & RCON', 'Choose who can see Steam names and avatars in the scoreboard.', 'false', STEAM_SCOREBOARD_OPTIONS, {
    label: 'Steam Scoreboard Visibility',
  }),
  UPnP: booleanSetting('Network & RCON', 'Attempt automatic UPnP port forwarding on the gateway.', true, {
    label: 'UPnP Port Forwarding',
  }),
  VoiceEnable: booleanSetting('Network & RCON', 'Enable in-game voice chat.', true),
  VoiceMinDistance: numberSetting('Network & RCON', 'Minimum distance where voice can be heard.', 10, {
    min: 0,
    max: 100000,
    step: 0.1,
  }),
  VoiceMaxDistance: numberSetting('Network & RCON', 'Maximum distance where voice can be heard.', 100, {
    min: 0,
    max: 100000,
    step: 0.1,
  }),
  Voice3D: booleanSetting('Network & RCON', 'Enable directional 3D voice audio.', true),
  SpeedLimit: numberSetting('Network & RCON', 'Vehicle speed limit used by the server.', 70, {
    min: 10,
    max: 150,
    step: 0.1,
  }),

  SwitchZombiesOwnershipEachUpdate: booleanSetting('World & Saves', 'Reassign zombie ownership between clients every update.', false, {
    label: 'Reassign Zombie Ownership Each Update',
  }),
  ServerPlayerID: numberSetting('World & Saves', 'Server-side character identity used alongside Reset ID.', undefined, {
    label: 'Server Player ID',
  }),
  FastForwardMultiplier: numberSetting('World & Saves', 'How quickly time passes while players sleep.', 40, {
    min: 1,
    max: 100,
    step: 0.1,
  }),
  Seed: textSetting('World & Saves', 'World generation seed for the map.', '', {
    label: 'World Seed',
  }),

  SafehousePreventsLootRespawn: booleanSetting('Safehouses & Factions', 'Prevent loot respawns in claimed safehouses.', true),
  DropOffWhiteListAfterDeath: booleanSetting('Safehouses & Factions', 'Remove whitelist accounts after character death.', false),
  PlayerSafehouse: booleanSetting('Safehouses & Factions', 'Allow players to claim safehouses.', false),
  AdminSafehouse: booleanSetting('Safehouses & Factions', 'Allow admins to claim safehouses.', false),
  SafehouseAllowTrepass: booleanSetting('Safehouses & Factions', 'Allow non-members to enter safehouses.', true, {
    label: 'Allow Safehouse Trespass',
  }),
  SafehouseAllowFire: booleanSetting('Safehouses & Factions', 'Allow fire to damage safehouses.', true),
  SafehouseAllowLoot: booleanSetting('Safehouses & Factions', 'Allow non-members to loot safehouses.', true),
  SafehouseAllowRespawn: booleanSetting('Safehouses & Factions', 'Respawn players in a safehouse they belonged to.', false),
  SafehouseDaySurvivedToClaim: numberSetting('Safehouses & Factions', 'Required in-game days survived before a player can claim a safehouse.', 0),
  SafeHouseRemovalTime: numberSetting('Safehouses & Factions', 'Hours before inactive players are removed from a safehouse.', 144, {
    label: 'Safehouse Removal Time',
  }),
  SafehouseAllowNonResidential: booleanSetting('Safehouses & Factions', 'Allow claiming non-residential buildings as safehouses.', false),
  SafehouseDisableDisguises: booleanSetting('Safehouses & Factions', 'Disable disguises while inside safehouses.', true),
  MaxSafezoneSize: numberSetting('Safehouses & Factions', 'Maximum safezone size.', 20000),
  AllowDestructionBySledgehammer: booleanSetting('Safehouses & Factions', 'Allow players to destroy world objects with sledgehammers.', true),
  SledgehammerOnlyInSafehouse: booleanSetting('Safehouses & Factions', 'Restrict sledgehammer destruction to safehouses.', false),
  War: booleanSetting('Safehouses & Factions', 'Enable safehouse war mode.', true),
  WarStartDelay: numberSetting('Safehouses & Factions', 'Delay before a declared safehouse war starts.', 600, {
    min: 60,
  }),
  WarDuration: numberSetting('Safehouses & Factions', 'Duration of a safehouse war.', 3600, {
    min: 60,
  }),
  WarSafehouseHitPoints: numberSetting('Safehouses & Factions', 'Hit points allowed during safehouse war.', 3, {
    min: 0,
  }),
  DisableSafehouseWhenPlayerConnected: booleanSetting('Safehouses & Factions', 'Treat safehouses like normal houses while a member is online.', false),
  Faction: booleanSetting('Safehouses & Factions', 'Allow players to create factions.', true),
  FactionDaySurvivedToCreate: numberSetting('Safehouses & Factions', 'Required in-game days survived before creating a faction.', 0),
  FactionPlayersRequiredForTag: numberSetting('Safehouses & Factions', 'Required faction members before creating a faction tag.', 1, {
    min: 1,
  }),

  DoLuaChecksum: booleanSetting('Security', 'Kick players whose Lua files do not match the server.', false, {
    label: 'Lua Checksum Enforcement',
    searchTerms: ['lua mismatch', 'checksum'],
  }),
  MaxAccountsPerUser: numberSetting('Security', 'Maximum number of accounts a single Steam user can create.', 0, {
    min: 0,
    max: 2147483647,
  }),
  AllowNonAsciiUsername: booleanSetting('Security', 'Allow non-ASCII characters in usernames.', false),

  AnnounceDeath: booleanSetting('Moderation & Logging', 'Announce player deaths globally in chat.', false),
  AnnounceAnimalDeath: booleanSetting('Moderation & Logging', 'Announce animal deaths globally in chat.', false),
  DisableRadioStaff: booleanSetting('Moderation & Logging', 'Disable radio transmissions from staff.', false),
  DisableRadioAdmin: booleanSetting('Moderation & Logging', 'Disable radio transmissions from admins.', true),
  DisableRadioGM: booleanSetting('Moderation & Logging', 'Disable radio transmissions from game masters.', true),
  DisableRadioOverseer: booleanSetting('Moderation & Logging', 'Disable radio transmissions from overseers.', false),
  DisableRadioModerator: booleanSetting('Moderation & Logging', 'Disable radio transmissions from moderators.', false),
  DisableRadioInvisible: booleanSetting('Moderation & Logging', 'Disable radio transmissions from invisible players.', true),
  ClientCommandFilter: textSetting('Moderation & Logging', 'Semicolon-separated command patterns to exclude or include in cmd.txt.', '-vehicle.*;+vehicle.damageWindow;+vehicle.fixPart;+vehicle.installPart;+vehicle.uninstallPart', {
    label: 'Client Command Filter',
  }),
  ClientActionLogs: textSetting('Moderation & Logging', 'Semicolon-separated client actions to write to ClientActionLogs.txt.', 'ISEnterVehicle;ISExitVehicle;ISTakeEngineParts;', {
    label: 'Client Action Logs',
  }),
  PerkLogs: booleanSetting('Moderation & Logging', 'Log perk level changes to PerkLog.txt.', true, {
    label: 'Perk Logs',
  }),
  BanKickGlobalSound: booleanSetting('Moderation & Logging', 'Play a global sound when players are banned or kicked.', true),
  BadWordListFile: textSetting('Moderation & Logging', 'Path to the bad-word list file.', ''),
  GoodWordListFile: textSetting('Moderation & Logging', 'Path to the allow-list file for words that should bypass bad-word filtering.', ''),
  BadWordPolicy: selectSetting('number', 'Moderation & Logging', 'Action to take when a bad word is used in chat.', 3, BAD_WORD_POLICY_OPTIONS, {
    min: 1,
    max: 4,
  }),
  BadWordReplacement: textSetting('Moderation & Logging', 'Replacement text used when bad words are filtered.', '[HIDDEN]'),
  DisableScoreboard: booleanSetting('Moderation & Logging', 'Hide the scoreboard entirely.', false),
  HideAdminsInPlayerList: booleanSetting('Moderation & Logging', 'Hide admins from the player list.', false),

  DiscordEnable: booleanSetting('Integrations', 'Enable Discord chat integration.', false),
  DiscordToken: textSetting('Integrations', 'Discord bot token used for server integration.', '', {
    sensitive: true,
  }),
  DiscordChatChannel: textSetting('Integrations', 'Discord channel name used for chat relay.', ''),
  DiscordLogChannel: textSetting('Integrations', 'Discord channel name used for server logs.', ''),
  DiscordCommandChannel: textSetting('Integrations', 'Discord channel name used for bot commands.', ''),
  WebhookAddress: textSetting('Integrations', 'Webhook URL used for outgoing notifications.', '', {
    sensitive: true,
  }),

  NoFire: booleanSetting('Performance & Cleanup', 'Disable all fire except campfires.', false),
  ItemNumbersLimitPerContainer: numberSetting('Performance & Cleanup', 'Maximum items allowed in a container. 0 disables the limit.', 0, {
    min: 0,
    max: 9000,
  }),
  BloodSplatLifespanDays: numberSetting('Performance & Cleanup', 'Days before blood splats are cleaned up. 0 means never.', 0, {
    min: 0,
    max: 365,
  }),
  RemovePlayerCorpsesOnCorpseRemoval: booleanSetting('Performance & Cleanup', 'Remove player corpses when corpse cleanup runs.', false),
  TrashDeleteAll: booleanSetting('Performance & Cleanup', 'Allow players to use the delete-all action on bins.', false),
  CarEngineAttractionModifier: numberSetting('Performance & Cleanup', 'Scale how strongly car engines attract zombies.', 0.5, {
    min: 0,
    max: 10,
    step: 0.1,
  }),
  BackupsCount: numberSetting('Performance & Cleanup', 'How many rotating backups to keep.', 5, {
    min: 1,
    max: 300,
  }),
  BackupsOnStart: booleanSetting('Performance & Cleanup', 'Create a backup when the server starts.', true),
  BackupsOnVersionChange: booleanSetting('Performance & Cleanup', 'Create a backup when the server version changes.', true),
  BackupsPeriod: numberSetting('Performance & Cleanup', 'Backup interval in minutes. 0 disables periodic backups.', 0, {
    min: 0,
    max: 1500,
  }),
  DisableVehicleTowing: booleanSetting('Performance & Cleanup', 'Disable towing vehicles.', false),
  DisableTrailerTowing: booleanSetting('Performance & Cleanup', 'Disable towing trailers.', false),
  DisableBurntTowing: booleanSetting('Performance & Cleanup', 'Disable towing burnt vehicles.', false),
  MultiplayerStatisticsPeriod: numberSetting('Performance & Cleanup', 'How often multiplayer statistics are updated. 0 disables them.', 1, {
    min: 0,
    max: 10,
  }),
  MaxPacketsPerSecond: numberSetting('Performance & Cleanup', 'Maximum packets per second the server accepts from a client.', 300, {
    min: 100,
    max: 1000,
  }),
  UsePhysicsHitReaction: booleanSetting('Performance & Cleanup', 'Use physics-based hit reactions.', false),

  AntiCheatSafety: numberSetting('Anti-Cheat', 'Anti-cheat level for safety checks.', 4, { min: 0, max: 4 }),
  AntiCheatMovement: numberSetting('Anti-Cheat', 'Anti-cheat level for movement checks.', 4, { min: 0, max: 4 }),
  AntiCheatHit: numberSetting('Anti-Cheat', 'Anti-cheat level for hit validation.', 4, { min: 0, max: 4 }),
  AntiCheatPacket: numberSetting('Anti-Cheat', 'Anti-cheat level for packet validation.', 4, { min: 0, max: 4 }),
  AntiCheatPermission: numberSetting('Anti-Cheat', 'Anti-cheat level for permission checks.', 4, { min: 0, max: 4 }),
  AntiCheatXP: numberSetting('Anti-Cheat', 'Anti-cheat level for XP validation.', 4, { min: 0, max: 4 }),
  AntiCheatFire: numberSetting('Anti-Cheat', 'Anti-cheat level for fire checks.', 4, { min: 0, max: 4 }),
  AntiCheatSafeHouse: numberSetting('Anti-Cheat', 'Anti-cheat level for safehouse checks.', 4, { min: 0, max: 4 }),
  AntiCheatRecipe: numberSetting('Anti-Cheat', 'Anti-cheat level for recipe validation.', 4, { min: 0, max: 4 }),
  AntiCheatPlayer: numberSetting('Anti-Cheat', 'Anti-cheat level for player validation.', 4, { min: 0, max: 4 }),
  AntiCheatChecksum: numberSetting('Anti-Cheat', 'Anti-cheat level for checksum validation.', 4, { min: 0, max: 4 }),
  AntiCheatItem: numberSetting('Anti-Cheat', 'Anti-cheat level for item validation.', 4, { min: 0, max: 4 }),
  AntiCheatServerCustomization: numberSetting('Anti-Cheat', 'Anti-cheat level for server customization checks.', 4, { min: 0, max: 4 }),

  MapRemotePlayerVisibility: selectSetting('number', 'World Map', 'Choose who can see remote players on the in-game map.', 1, MAP_REMOTE_PLAYER_VISIBILITY_OPTIONS, {
    label: 'Remote Player Map Visibility',
    min: 1,
    max: 3,
  }),
}

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
    searchTerms: ['admin password', 'remote console'],
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
  ...EXTENDED_SERVER_INI_SETTING_DEFINITIONS,
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
  StartYear: defineSetting({
    label: 'Start Year',
    group: 'World Time',
    description: 'Sandbox year code for when the apocalypse begins. Use the advanced raw value if you need the exact underlying year index.',
    rawType: 'number',
    control: 'number',
    defaultValue: 1,
    min: 1,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
    searchTerms: ['starting year', 'world start year'],
  }),
  StartMonth: defineSetting({
    label: 'Start Month',
    group: 'World Time',
    description: 'Calendar month when the apocalypse starts.',
    rawType: 'number',
    control: 'select',
    defaultValue: 7,
    options: MONTH_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
    searchTerms: ['starting month', 'july', 'calendar month'],
  }),
  StartDay: defineSetting({
    label: 'Start Day',
    group: 'World Time',
    description: 'Day of the month when the world begins.',
    rawType: 'number',
    control: 'number',
    defaultValue: 9,
    min: 1,
    max: 31,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
    searchTerms: ['starting day', 'calendar day'],
  }),
  Zombies: defineSetting({
    label: 'Zombie Count Preset',
    group: 'Zombie Population',
    description: 'Preset that controls the overall zombie count before the detailed population multipliers apply.',
    rawType: 'number',
    control: 'select',
    defaultValue: 3,
    options: ZOMBIE_COUNT_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
    searchTerms: ['overall zombie count', 'spawn rate', 'insane', 'none'],
  }),
  Distribution: defineSetting({
    label: 'Zombie Distribution',
    group: 'Zombie Population',
    description: 'Choose whether zombies cluster in towns or spread uniformly across the map.',
    rawType: 'number',
    control: 'select',
    defaultValue: 1,
    options: ZOMBIE_DISTRIBUTION_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
    searchTerms: ['urban focused', 'uniform distribution'],
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
  'ZombieConfig.PopulationStartMultiplier': defineSetting({
    label: 'Starting Population Multiplier',
    group: 'Zombie Population',
    description: 'Population multiplier applied on the first day before the peak ramp begins.',
    rawType: 'number',
    control: 'number',
    defaultValue: 1,
    min: 0,
    max: 4,
    step: 0.1,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
    searchTerms: ['day 1 population', 'initial population'],
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
  'ZombieLore.Decomp': defineSetting({
    label: 'Zombie Decomposition',
    group: 'Zombie Behavior',
    description: 'How decomposition weakens or slows zombies over time.',
    rawType: 'number',
    control: 'select',
    defaultValue: 1,
    options: ZOMBIE_DECOMPOSITION_OPTIONS,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
    searchTerms: ['decomposition', 'decay'],
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
  WaterShut: defineSetting({
    label: 'Water Shutoff Preset',
    group: 'Climate & Utilities',
    description: 'Sandbox preset code for when water shuts off. Use Water Shutoff Delay for exact day control.',
    rawType: 'number',
    control: 'number',
    defaultValue: 2,
    min: 1,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
    searchTerms: ['water shutoff preset', 'water shutoff timing'],
  }),
  ElecShut: defineSetting({
    label: 'Electricity Shutoff Preset',
    group: 'Climate & Utilities',
    description: 'Sandbox preset code for when electricity shuts off. Use Electricity Shutoff Delay for exact day control.',
    rawType: 'number',
    control: 'number',
    defaultValue: 2,
    min: 1,
    docsUrl: PZ_SERVER_SETTINGS_WIKI_URL,
    searchTerms: ['electricity shutoff preset', 'power shutoff timing'],
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