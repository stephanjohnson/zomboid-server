import type { TelemetryListener } from '@prisma/client'

export const TelemetryEventKeys = {
  SESSION_STARTED: 'pz.session.started',
  SESSION_ENDED: 'pz.session.ended',
  PLAYER_DIED: 'pz.player.died',
  ZOMBIE_KILL: 'pz.zombie.kill',
  PVP_KILL: 'pz.pvp.kill',
  SKILL_LEVEL_UP: 'pz.skill.level_up',
  ITEM_FOUND: 'pz.item.found',
  BUILD_ACTION: 'pz.build.action',
} as const

export const TelemetryAdapterKeys = {
  PLAYER_SNAPSHOT: 'pz.player_snapshot',
  PVP_KILL_TRACKER: 'pz.pvp_kill_tracker',
  ITEM_FOUND: 'pz.item_found',
  BUILD_ACTION: 'pz.build_action',
} as const

export interface DefaultTelemetryListener {
  adapterKey: string
  name: string
  eventKey?: string
  isEnabled?: boolean
  config?: Record<string, unknown>
}

export interface DefaultActionRule {
  name: string
  triggerKind: 'EVENT' | 'WORKFLOW'
  triggerKey: string
  moneyAmount?: number
  xpAmount?: number
  xpCategory?: string
  xpCategoryAmount?: number
  config?: Record<string, unknown>
}

export const defaultTelemetryListeners: DefaultTelemetryListener[] = [
  {
    adapterKey: TelemetryAdapterKeys.PLAYER_SNAPSHOT,
    name: 'Player snapshot polling',
    isEnabled: true,
    config: {
      snapshotIntervalMinutes: 12,
      inventoryIntervalMinutes: 48,
      gameStateIntervalMinutes: 24,
      refreshSeconds: 60,
    },
  },
  {
    adapterKey: TelemetryAdapterKeys.PVP_KILL_TRACKER,
    name: 'PvP kill tracker',
    eventKey: TelemetryEventKeys.PVP_KILL,
    isEnabled: true,
  },
  {
    adapterKey: TelemetryAdapterKeys.ITEM_FOUND,
    name: 'Item found events',
    eventKey: TelemetryEventKeys.ITEM_FOUND,
    isEnabled: true,
  },
  {
    adapterKey: TelemetryAdapterKeys.BUILD_ACTION,
    name: 'Build action events',
    eventKey: TelemetryEventKeys.BUILD_ACTION,
    isEnabled: true,
    config: {
      actions: ['build'],
    },
  },
]

export const defaultActionRules: DefaultActionRule[] = [
  {
    name: 'Zombie kill reward',
    triggerKind: 'EVENT',
    triggerKey: TelemetryEventKeys.ZOMBIE_KILL,
    moneyAmount: 50,
    xpCategory: 'combat',
    xpCategoryAmount: 10,
    config: {
      multiplyByQuantity: true,
    },
  },
  {
    name: 'PvP kill reward',
    triggerKind: 'EVENT',
    triggerKey: TelemetryEventKeys.PVP_KILL,
    moneyAmount: 1000,
    xpCategory: 'combat',
    xpCategoryAmount: 250,
  },
  {
    name: 'Skill level reward',
    triggerKind: 'EVENT',
    triggerKey: TelemetryEventKeys.SKILL_LEVEL_UP,
    moneyAmount: 500,
    xpCategory: 'survival',
    xpCategoryAmount: 50,
    config: {
      multiplyByQuantity: true,
    },
  },
]

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function getNumber(config: Record<string, unknown>, key: string, fallback: number): number {
  const value = config[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

export function buildCompiledModConfig(listeners: TelemetryListener[]) {
  const listenerMap = new Map(listeners.map(listener => [listener.adapterKey, listener]))
  const snapshotConfig = asObject(listenerMap.get(TelemetryAdapterKeys.PLAYER_SNAPSHOT)?.config)

  return {
    fetchedAt: new Date().toISOString(),
    refreshSeconds: getNumber(snapshotConfig, 'refreshSeconds', 60),
    listeners: {
      [TelemetryAdapterKeys.PLAYER_SNAPSHOT]: {
        enabled: listenerMap.get(TelemetryAdapterKeys.PLAYER_SNAPSHOT)?.isEnabled ?? true,
        snapshotIntervalMinutes: getNumber(snapshotConfig, 'snapshotIntervalMinutes', 12),
        inventoryIntervalMinutes: getNumber(snapshotConfig, 'inventoryIntervalMinutes', 48),
        gameStateIntervalMinutes: getNumber(snapshotConfig, 'gameStateIntervalMinutes', 24),
      },
      [TelemetryAdapterKeys.PVP_KILL_TRACKER]: {
        enabled: listenerMap.get(TelemetryAdapterKeys.PVP_KILL_TRACKER)?.isEnabled ?? true,
      },
      [TelemetryAdapterKeys.ITEM_FOUND]: {
        enabled: listenerMap.get(TelemetryAdapterKeys.ITEM_FOUND)?.isEnabled ?? true,
        config: asObject(listenerMap.get(TelemetryAdapterKeys.ITEM_FOUND)?.config),
      },
      [TelemetryAdapterKeys.BUILD_ACTION]: {
        enabled: listenerMap.get(TelemetryAdapterKeys.BUILD_ACTION)?.isEnabled ?? true,
        config: asObject(listenerMap.get(TelemetryAdapterKeys.BUILD_ACTION)?.config),
      },
    },
  }
}