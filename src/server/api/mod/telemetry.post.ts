import * as prismaClient from '@prisma/client'
import * as v from 'valibot'

import {
  buildAutomationRuntimeState,
  getAutomationRuntimeExecutionOrder,
  getAutomationRuntimeFlags,
  mergeAutomationRuntimeFlags,
  setAutomationRuntimeFlag,
  unsetAutomationRuntimeFlag,
  type AutomationRuntimeFlagMutation,
} from '../../../shared/telemetry-automation-runtime'
import {
  buildActionRulePlan,
  buildRewardGrantCandidate,
  deriveOfflineEvents,
  derivePlayerEvents,
  evaluateWorkflowTransition,
  getLegacyTelemetryType,
  getPreviousPlayerState,
  toWorkflowDefinitionLike,
  toWorkflowRunLike,
  type AutomationRuleEvaluationContext,
  type ActionRulePlan,
  type TelemetryEventRecord,
} from '../../utils/mod-telemetry'
import { buildServerIniEditorMutation } from '../../utils/config-editor'
import { reconcileGameContainer } from '../../utils/docker'
import { logger } from '../../utils/logger'
import { getProfileSandboxVarsOverrides, getProfileServerIniOverrides } from '../../utils/profile-runtime-config'
import { sendRconCommand } from '../../utils/rcon'
import { TelemetryEventKeys } from '../../utils/telemetry-config'

const { TriggerSourceKind, WorkflowRunStatus } = prismaClient

const InventoryItemSchema = v.object({
  fullType: v.pipe(v.string(), v.minLength(1)),
  count: v.optional(v.pipe(v.number(), v.minValue(1)), 1),
  equipped: v.optional(v.boolean()),
  container: v.optional(v.string()),
})

const PlayerSchema = v.object({
  username: v.pipe(v.string(), v.trim(), v.minLength(1)),
  x: v.optional(v.number()),
  y: v.optional(v.number()),
  z: v.optional(v.number()),
  isDead: v.optional(v.boolean()),
  isGhost: v.optional(v.boolean()),
  zombieKills: v.optional(v.pipe(v.number(), v.minValue(0))),
  hoursSurvived: v.optional(v.pipe(v.number(), v.minValue(0))),
  profession: v.optional(v.nullable(v.string())),
  skills: v.optional(v.record(v.string(), v.number())),
  inventory: v.optional(v.array(InventoryItemSchema)),
})

const PvpKillSchema = v.object({
  killer: v.pipe(v.string(), v.trim(), v.minLength(1)),
  victim: v.pipe(v.string(), v.trim(), v.minLength(1)),
  weapon: v.optional(v.string()),
  killerX: v.optional(v.number()),
  killerY: v.optional(v.number()),
  victimX: v.optional(v.number()),
  victimY: v.optional(v.number()),
  occurredAt: v.optional(v.string()),
})

const GameStateSchema = v.object({
  time: v.optional(v.record(v.string(), v.unknown())),
  season: v.optional(v.string()),
  weather: v.optional(v.record(v.string(), v.unknown())),
  gameVersion: v.optional(v.string()),
})

const LegacyRawEventTypeSchema = v.picklist([
  'ITEM_FOUND',
  'BUILD_ACTION',
])

const RawEventSchema = v.object({
  type: v.optional(LegacyRawEventTypeSchema),
  eventKey: v.optional(v.pipe(v.string(), v.trim(), v.minLength(1))),
  username: v.pipe(v.string(), v.trim(), v.minLength(1)),
  quantity: v.optional(v.pipe(v.number(), v.minValue(1)), 1),
  occurredAt: v.optional(v.string()),
  metadata: v.optional(v.record(v.string(), v.unknown())),
})

const TelemetryUploadSchema = v.object({
  serverName: v.optional(v.string()),
  capturedAt: v.optional(v.string()),
  players: v.optional(v.array(PlayerSchema), []),
  pvpKills: v.optional(v.array(PvpKillSchema), []),
  events: v.optional(v.array(RawEventSchema), []),
  gameState: v.optional(GameStateSchema),
})

function parseOccurredAt(value?: string): Date {
  if (!value) {
    return new Date()
  }

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) {
    return new Date()
  }

  return parsed
}

function resolveRawEventKey(rawEvent: { type?: string, eventKey?: string }): string | null {
  if (rawEvent.eventKey) {
    return rawEvent.eventKey
  }

  if (rawEvent.type === 'ITEM_FOUND') {
    return TelemetryEventKeys.ITEM_FOUND
  }

  if (rawEvent.type === 'BUILD_ACTION') {
    return TelemetryEventKeys.BUILD_ACTION
  }

  return null
}

function buildWorkflowRunMap(runs: prismaClient.WorkflowRun[]) {
  return new Map(runs.map(run => [`${run.workflowId}:${run.playerId ?? 'unknown'}`, run]))
}

interface PendingServerSettingsUpdate {
  settings: Record<string, string>
  applyMode: 'persist-only' | 'restart-server'
  reasons: string[]
}

type AutomationEffectType = 'ITEM_GRANT' | 'INGAME_XP_GRANT'

interface PendingAutomationExecution {
  executionId: string
  effectType: AutomationEffectType
  playerId: string
  command: string | null
}

function mergePendingServerSettingsUpdate(
  pending: PendingServerSettingsUpdate | null,
  serverSettings: NonNullable<ActionRulePlan['serverSettings']>,
  reason: string,
): PendingServerSettingsUpdate {
  return {
    settings: {
      ...(pending?.settings ?? {}),
      ...serverSettings.settings,
    },
    applyMode: pending?.applyMode === 'restart-server' || serverSettings.applyMode === 'restart-server'
      ? 'restart-server'
      : 'persist-only',
    reasons: pending?.reasons.includes(reason)
      ? pending.reasons
      : [...(pending?.reasons ?? []), reason],
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function escapeRconArgument(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')
}

function buildAddItemCommand(playerUsername: string, itemId: string, quantity: number): string {
  return `additem "${escapeRconArgument(playerUsername)}" "${escapeRconArgument(itemId)}" ${Math.max(1, Math.floor(quantity))}`
}

function buildAddXpCommand(playerUsername: string, skillKey: string, amount: number): string {
  return `addxp "${escapeRconArgument(playerUsername)}" ${skillKey}=${Math.max(1, Math.floor(amount))} -true`
}

function sortActionRules<T extends { name: string, config: unknown }>(rules: T[]): T[] {
  return [...rules].sort((left, right) => {
    const leftOrder = getAutomationRuntimeExecutionOrder(left.config)
    const rightOrder = getAutomationRuntimeExecutionOrder(right.config)

    if (leftOrder == null && rightOrder == null) {
      return left.name.localeCompare(right.name)
    }

    if (leftOrder == null) {
      return 1
    }

    if (rightOrder == null) {
      return -1
    }

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder
    }

    return left.name.localeCompare(right.name)
  })
}

function getDistanceMeters(metadata: Record<string, unknown>): number | null {
  const killerX = typeof metadata.killerX === 'number' ? metadata.killerX : null
  const killerY = typeof metadata.killerY === 'number' ? metadata.killerY : null
  const victimX = typeof metadata.victimX === 'number' ? metadata.victimX : null
  const victimY = typeof metadata.victimY === 'number' ? metadata.victimY : null

  if (killerX == null || killerY == null || victimX == null || victimY == null) {
    return null
  }

  return Math.hypot(victimX - killerX, victimY - killerY)
}

function buildItemContext(quantity: number, metadata: Record<string, unknown>): Record<string, unknown> {
  const itemType = typeof metadata.itemType === 'string'
    ? metadata.itemType
    : typeof metadata.fullType === 'string'
      ? metadata.fullType
      : ''

  return {
    ...metadata,
    fullType: itemType || undefined,
    quantity: typeof metadata.quantity === 'number' ? metadata.quantity : quantity,
    count: typeof metadata.count === 'number' ? metadata.count : quantity,
  }
}

function buildEventContext(eventKey: string, quantity: number, metadata: Record<string, unknown>): Record<string, unknown> {
  const distanceMeters = getDistanceMeters(metadata)

  return {
    key: eventKey,
    eventKey,
    quantity,
    ...metadata,
    distanceMeters: distanceMeters ?? metadata.distanceMeters,
    skill: typeof metadata.skill === 'string'
      ? {
          key: metadata.skill,
          level: typeof metadata.toLevel === 'number' ? metadata.toLevel : undefined,
          previousLevel: typeof metadata.fromLevel === 'number' ? metadata.fromLevel : undefined,
        }
      : undefined,
    victim: typeof metadata.victim === 'string'
      ? {
          username: metadata.victim,
          x: typeof metadata.victimX === 'number' ? metadata.victimX : undefined,
          y: typeof metadata.victimY === 'number' ? metadata.victimY : undefined,
        }
      : undefined,
    weapon: typeof metadata.weapon === 'string'
      ? {
          type: metadata.weapon,
        }
      : undefined,
  }
}

function buildPlayerContext(player: prismaClient.ServerPlayer | null): Record<string, unknown> {
  if (!player) {
    return {}
  }

  return {
    id: player.id,
    username: player.username,
    steamId: player.steamId ?? undefined,
    displayName: player.displayName ?? undefined,
    profession: player.profession ?? undefined,
    x: player.x ?? undefined,
    y: player.y ?? undefined,
    z: player.z ?? undefined,
  }
}

function buildPlayerStatContext(
  player: prismaClient.ServerPlayer | null,
  wallet: { balance: number, totalEarned: number, totalSpent: number } | null,
  totalXp: number,
  categories: Record<string, number>,
): Record<string, unknown> {
  if (!player) {
    return {}
  }

  return {
    kills: {
      zombies: player.zombieKills,
      players: player.playerKills,
    },
    hoursSurvived: player.hoursSurvived,
    skills: asRecord(player.skills),
    wallet: {
      balance: wallet?.balance ?? 0,
      totalEarned: wallet?.totalEarned ?? 0,
      totalSpent: wallet?.totalSpent ?? 0,
    },
    xp: {
      total: totalXp,
      categories,
    },
  }
}

function buildServerContext(
  profile: prismaClient.ServerProfile,
  gameState: Record<string, unknown>,
  playerCount: number,
  serverFlags: Record<string, unknown>,
): Record<string, unknown> {
  return {
    id: profile.id,
    name: profile.name,
    servername: profile.servername,
    steamBuild: profile.steamBuild,
    playerCount,
    gameState,
    season: typeof gameState.season === 'string' ? gameState.season : undefined,
    weather: asRecord(gameState.weather),
    flags: serverFlags,
  }
}

function applyFlagMutation(
  mutation: AutomationRuntimeFlagMutation,
  playerId: string | null,
  currentPlayerFlagsById: Map<string, Record<string, unknown>>,
  currentServerFlags: Record<string, unknown>,
  dirtyPlayerIds: Set<string>,
): Record<string, unknown> {
  if (mutation.targetScope === 'server') {
    return mutation.operation === 'set'
      ? setAutomationRuntimeFlag(currentServerFlags, mutation.flagKey, true)
      : unsetAutomationRuntimeFlag(currentServerFlags, mutation.flagKey)
  }

  if (!playerId) {
    return currentServerFlags
  }

  const nextPlayerFlags = mutation.operation === 'set'
    ? setAutomationRuntimeFlag(currentPlayerFlagsById.get(playerId) ?? {}, mutation.flagKey, true)
    : unsetAutomationRuntimeFlag(currentPlayerFlagsById.get(playerId) ?? {}, mutation.flagKey)

  currentPlayerFlagsById.set(playerId, nextPlayerFlags)
  dirtyPlayerIds.add(playerId)
  return currentServerFlags
}

export default defineEventHandler(async (event) => {
  const body = await readValidatedBody(event, v.parser(TelemetryUploadSchema))
  const occurredAt = parseOccurredAt(body.capturedAt)

  const profile = body.serverName
    ? await prisma.serverProfile.findFirst({
        where: {
          OR: [
            { servername: body.serverName },
            { name: body.serverName },
          ],
        },
      })
    : await prisma.serverProfile.findFirst({ where: { isActive: true } })

  if (!profile) {
    throw createError({ statusCode: 404, message: 'No matching server profile found for telemetry upload' })
  }

  const { pendingAutomationExecutions, ...result } = await prisma.$transaction(async (transaction) => {
    const [
      existingPlayers,
      enabledLegacyRules,
      enabledActionRules,
      enabledWorkflows,
      activeWorkflowRuns,
      playerWallets,
      playerXpBalances,
      playerXpCategoryBalances,
    ] = await Promise.all([
      transaction.serverPlayer.findMany({ where: { profileId: profile.id } }),
      transaction.rewardRule.findMany({ where: { profileId: profile.id, isEnabled: true } }),
      transaction.actionRule.findMany({ where: { profileId: profile.id, isEnabled: true } }),
      transaction.workflowDefinition.findMany({
        where: { profileId: profile.id, isEnabled: true },
        include: { steps: { orderBy: { stepOrder: 'asc' } } },
      }),
      transaction.workflowRun.findMany({
        where: { profileId: profile.id, status: WorkflowRunStatus.ACTIVE },
      }),
      transaction.playerWallet.findMany({
        where: { player: { profileId: profile.id } },
      }),
      transaction.playerXpBalance.findMany({
        where: { player: { profileId: profile.id } },
      }),
      transaction.playerXpCategoryBalance.findMany({
        where: { player: { profileId: profile.id } },
      }),
    ])

    const existingPlayersByUsername = new Map(existingPlayers.map(player => [player.username, player]))
    const currentPlayersById = new Map(existingPlayers.map(player => [player.id, player]))
    const sortedActionRules = sortActionRules(enabledActionRules)
    const currentWalletsByPlayerId = new Map(playerWallets.map(wallet => [wallet.playerId, {
      balance: wallet.balance,
      totalEarned: wallet.totalEarned,
      totalSpent: wallet.totalSpent,
    }]))
    const currentXpTotalsByPlayerId = new Map(playerXpBalances.map(balance => [balance.playerId, balance.totalXp]))
    const currentXpCategoriesByPlayerId = playerXpCategoryBalances.reduce<Map<string, Map<string, number>>>((acc, balance) => {
      const categories = acc.get(balance.playerId) ?? new Map<string, number>()
      categories.set(balance.category, balance.totalXp)
      acc.set(balance.playerId, categories)
      return acc
    }, new Map())
    const currentPlayerFlagsById = new Map(existingPlayers.map(player => [player.id, getAutomationRuntimeFlags(player.automationState)]))
    let currentServerFlags = getAutomationRuntimeFlags(profile.automationState)
    const dirtyPlayerFlagIds = new Set<string>()
    let serverFlagsDirty = false
    const currentGameState = asRecord(body.gameState ?? profile.lastGameState)
    const seenUsernames = new Set<string>()
    const playerIdsByUsername = new Map<string, string>()
    const createdEvents: TelemetryEventRecord[] = []
    const workflowRunMap = buildWorkflowRunMap(activeWorkflowRuns)
    let moneyGrantsCreated = 0
    let xpGrantsCreated = 0
    let itemGrantsQueued = 0
    let inGameXpGrantsQueued = 0
    let pendingServerSettingsUpdate: PendingServerSettingsUpdate | null = null
    const pendingAutomationExecutions: PendingAutomationExecution[] = []

    const buildEvaluationContext = (
      playerId: string | null,
      eventKey: string,
      quantity: number,
      metadata: Record<string, unknown> | null,
    ): AutomationRuleEvaluationContext => {
      const player = playerId ? currentPlayersById.get(playerId) ?? null : null
      const playerWallet = playerId ? currentWalletsByPlayerId.get(playerId) ?? null : null
      const totalXp = playerId ? currentXpTotalsByPlayerId.get(playerId) ?? 0 : 0
      const xpCategories = playerId
        ? Object.fromEntries(currentXpCategoriesByPlayerId.get(playerId)?.entries() ?? [])
        : {}
      const playerFlags = playerId ? currentPlayerFlagsById.get(playerId) ?? {} : {}
      const metadataRecord = metadata ?? {}
      const onlinePlayerCount = Array.from(currentPlayersById.values()).filter(currentPlayer => currentPlayer.isOnline).length

      return {
        event: buildEventContext(eventKey, quantity, metadataRecord),
        player: buildPlayerContext(player),
        playerStat: buildPlayerStatContext(player, playerWallet, totalXp, xpCategories),
        item: buildItemContext(quantity, metadataRecord),
        flag: mergeAutomationRuntimeFlags(playerFlags, currentServerFlags),
        server: buildServerContext(profile, currentGameState, onlinePlayerCount, currentServerFlags),
      }
    }

    const stageAutomationExecution = async (params: {
      uniqueKey: string
      playerId: string
      actionRuleId: string
      sourceEventId?: string
      workflowRunId?: string
      effectType: AutomationEffectType
      reason: string
      metadata: Record<string, unknown> | null
      buildCommand: (playerUsername: string) => string
    }) => {
      const existingExecution = await transaction.automationActionExecution.findUnique({
        where: { uniqueKey: params.uniqueKey },
      })

      if (existingExecution?.status === 'COMPLETED') {
        return false
      }

      const persistedExecution = existingExecution
        ? await transaction.automationActionExecution.update({
            where: { id: existingExecution.id },
            data: {
              playerId: params.playerId,
              actionRuleId: params.actionRuleId,
              sourceEventId: params.sourceEventId ?? null,
              workflowRunId: params.workflowRunId ?? null,
              effectType: params.effectType,
              status: 'PENDING',
              reason: params.reason,
              metadata: params.metadata,
              error: null,
              executedAt: null,
            },
          })
        : await transaction.automationActionExecution.create({
            data: {
              profileId: profile.id,
              playerId: params.playerId,
              actionRuleId: params.actionRuleId,
              sourceEventId: params.sourceEventId ?? null,
              workflowRunId: params.workflowRunId ?? null,
              effectType: params.effectType,
              uniqueKey: params.uniqueKey,
              status: 'PENDING',
              reason: params.reason,
              metadata: params.metadata,
            },
          })

      const playerUsername = currentPlayersById.get(params.playerId)?.username?.trim() || null
      pendingAutomationExecutions.push({
        executionId: persistedExecution.id,
        effectType: params.effectType,
        playerId: params.playerId,
        command: playerUsername ? params.buildCommand(playerUsername) : null,
      })

      return true
    }

    for (const player of body.players) {
      seenUsernames.add(player.username)

      const previous = existingPlayersByUsername.get(player.username) ?? null
      const playerRecord = await transaction.serverPlayer.upsert({
        where: {
          profileId_username: {
            profileId: profile.id,
            username: player.username,
          },
        },
        update: {
          isOnline: true,
          isDead: Boolean(player.isDead),
          isGhost: Boolean(player.isGhost),
          x: player.x,
          y: player.y,
          z: typeof player.z === 'number' ? Math.floor(player.z) : null,
          zombieKills: Math.max(0, Math.floor(player.zombieKills ?? previous?.zombieKills ?? 0)),
          hoursSurvived: Math.max(0, player.hoursSurvived ?? previous?.hoursSurvived ?? 0),
          profession: player.profession ?? previous?.profession ?? null,
          skills: player.skills ?? previous?.skills ?? null,
          inventory: player.inventory ?? previous?.inventory ?? null,
          lastSeenAt: occurredAt,
          lastTelemetryAt: occurredAt,
        },
        create: {
          profileId: profile.id,
          username: player.username,
          isOnline: true,
          isDead: Boolean(player.isDead),
          isGhost: Boolean(player.isGhost),
          x: player.x,
          y: player.y,
          z: typeof player.z === 'number' ? Math.floor(player.z) : null,
          zombieKills: Math.max(0, Math.floor(player.zombieKills ?? 0)),
          hoursSurvived: Math.max(0, player.hoursSurvived ?? 0),
          profession: player.profession ?? null,
          skills: player.skills,
          inventory: player.inventory,
          firstSeenAt: occurredAt,
          lastSeenAt: occurredAt,
          lastTelemetryAt: occurredAt,
        },
      })

      existingPlayersByUsername.set(player.username, playerRecord)
      currentPlayersById.set(playerRecord.id, playerRecord)
      currentPlayerFlagsById.set(playerRecord.id, getAutomationRuntimeFlags(playerRecord.automationState))
      playerIdsByUsername.set(player.username, playerRecord.id)

      await transaction.playerSnapshot.create({
        data: {
          profileId: profile.id,
          playerId: playerRecord.id,
          capturedAt: occurredAt,
          isOnline: true,
          isDead: Boolean(player.isDead),
          isGhost: Boolean(player.isGhost),
          x: player.x,
          y: player.y,
          z: typeof player.z === 'number' ? Math.floor(player.z) : null,
          zombieKills: Math.max(0, Math.floor(player.zombieKills ?? 0)),
          playerKills: previous?.playerKills ?? 0,
          hoursSurvived: Math.max(0, player.hoursSurvived ?? 0),
          profession: player.profession ?? null,
          skills: player.skills,
          inventory: player.inventory,
          raw: player,
        },
      })

      const derivedEvents = derivePlayerEvents(previous ? getPreviousPlayerState(previous) : null, player, occurredAt)
      for (const derivedEvent of derivedEvents) {
        const created = await transaction.playerTelemetryEvent.create({
          data: {
            profileId: profile.id,
            playerId: playerRecord.id,
            type: derivedEvent.type,
            eventKey: derivedEvent.eventKey,
            quantity: derivedEvent.quantity,
            occurredAt: derivedEvent.occurredAt,
            metadata: derivedEvent.metadata,
          },
        })

        createdEvents.push({
          id: created.id,
          playerId: created.playerId,
          type: created.type,
          eventKey: created.eventKey,
          quantity: created.quantity,
          metadata: (created.metadata as Record<string, unknown> | null) ?? null,
          occurredAt: created.occurredAt,
        })
      }
    }

    const offlineEvents = deriveOfflineEvents(existingPlayers.map(getPreviousPlayerState), seenUsernames, occurredAt)
    for (const offlineEvent of offlineEvents) {
      const playerId = offlineEvent.playerUsername
        ? playerIdsByUsername.get(offlineEvent.playerUsername) ?? existingPlayersByUsername.get(offlineEvent.playerUsername)?.id
        : null

      if (offlineEvent.playerUsername) {
        await transaction.serverPlayer.update({
          where: {
            profileId_username: {
              profileId: profile.id,
              username: offlineEvent.playerUsername,
            },
          },
          data: {
            isOnline: false,
            lastSeenAt: occurredAt,
            lastTelemetryAt: occurredAt,
          },
        })

        const existingPlayer = existingPlayersByUsername.get(offlineEvent.playerUsername)
        if (existingPlayer) {
          const nextPlayer = {
            ...existingPlayer,
            isOnline: false,
            lastSeenAt: occurredAt,
            lastTelemetryAt: occurredAt,
          }

          existingPlayersByUsername.set(offlineEvent.playerUsername, nextPlayer)
          currentPlayersById.set(existingPlayer.id, nextPlayer)
        }
      }

      if (playerId) {
        const created = await transaction.playerTelemetryEvent.create({
          data: {
            profileId: profile.id,
            playerId,
            type: offlineEvent.type,
            eventKey: offlineEvent.eventKey,
            quantity: offlineEvent.quantity,
            occurredAt: offlineEvent.occurredAt,
          },
        })

        createdEvents.push({
          id: created.id,
          playerId: created.playerId,
          type: created.type,
          eventKey: created.eventKey,
          quantity: created.quantity,
          metadata: null,
          occurredAt: created.occurredAt,
        })
      }
    }

    for (const kill of body.pvpKills) {
      const killer = existingPlayersByUsername.get(kill.killer)
        ?? (kill.killer ? await transaction.serverPlayer.upsert({
          where: {
            profileId_username: {
              profileId: profile.id,
              username: kill.killer,
            },
          },
          update: {
            isOnline: true,
            lastSeenAt: occurredAt,
            lastTelemetryAt: occurredAt,
            playerKills: { increment: 1 },
          },
          create: {
            profileId: profile.id,
            username: kill.killer,
            isOnline: true,
            playerKills: 1,
            firstSeenAt: occurredAt,
            lastSeenAt: occurredAt,
            lastTelemetryAt: occurredAt,
          },
        }) : null)

      if (!killer) {
        continue
      }

      existingPlayersByUsername.set(kill.killer, killer)
      currentPlayersById.set(killer.id, killer)
      currentPlayerFlagsById.set(killer.id, getAutomationRuntimeFlags(killer.automationState))
      const killOccurredAt = parseOccurredAt(kill.occurredAt)
      const created = await transaction.playerTelemetryEvent.create({
        data: {
          profileId: profile.id,
          playerId: killer.id,
          type: getLegacyTelemetryType(TelemetryEventKeys.PVP_KILL),
          eventKey: TelemetryEventKeys.PVP_KILL,
          quantity: 1,
          occurredAt: killOccurredAt,
          metadata: {
            victim: kill.victim,
            weapon: kill.weapon,
            killerX: kill.killerX,
            killerY: kill.killerY,
            victimX: kill.victimX,
            victimY: kill.victimY,
          },
        },
      })

      createdEvents.push({
        id: created.id,
        playerId: created.playerId,
        type: created.type,
        eventKey: created.eventKey,
        quantity: created.quantity,
        metadata: (created.metadata as Record<string, unknown> | null) ?? null,
        occurredAt: created.occurredAt,
      })
    }

    for (const rawEvent of body.events) {
      const eventKey = resolveRawEventKey(rawEvent)
      if (!eventKey) {
        continue
      }

      const playerRecord = existingPlayersByUsername.get(rawEvent.username)
        ?? await transaction.serverPlayer.upsert({
          where: {
            profileId_username: {
              profileId: profile.id,
              username: rawEvent.username,
            },
          },
          update: {
            lastSeenAt: occurredAt,
            lastTelemetryAt: occurredAt,
          },
          create: {
            profileId: profile.id,
            username: rawEvent.username,
            lastSeenAt: occurredAt,
            lastTelemetryAt: occurredAt,
          },
        })

      existingPlayersByUsername.set(rawEvent.username, playerRecord)
      currentPlayersById.set(playerRecord.id, playerRecord)
      currentPlayerFlagsById.set(playerRecord.id, getAutomationRuntimeFlags(playerRecord.automationState))
      playerIdsByUsername.set(rawEvent.username, playerRecord.id)

      const created = await transaction.playerTelemetryEvent.create({
        data: {
          profileId: profile.id,
          playerId: playerRecord.id,
          type: getLegacyTelemetryType(eventKey),
          eventKey,
          quantity: Math.max(1, Math.floor(rawEvent.quantity ?? 1)),
          occurredAt: parseOccurredAt(rawEvent.occurredAt),
          metadata: rawEvent.metadata,
        },
      })

      createdEvents.push({
        id: created.id,
        playerId: created.playerId,
        type: created.type,
        eventKey: created.eventKey,
        quantity: created.quantity,
        metadata: (created.metadata as Record<string, unknown> | null) ?? null,
        occurredAt: created.occurredAt,
      })
    }

    const completedWorkflowTriggers: Array<{
      ruleKey: string
      playerId: string
      runId: string
      eventKey: string
      quantity: number
      metadata: Record<string, unknown> | null
    }> = []

    for (const createdEvent of createdEvents) {
      if (!createdEvent.playerId) {
        continue
      }

      for (const workflow of enabledWorkflows) {
        const workflowLike = toWorkflowDefinitionLike(workflow)
        const runKey = `${workflow.id}:${createdEvent.playerId}`
        const existingRun = workflowRunMap.get(runKey) ?? null
        const plan = evaluateWorkflowTransition(
          workflowLike,
          existingRun ? toWorkflowRunLike(existingRun) : null,
          createdEvent,
          buildEvaluationContext(createdEvent.playerId, createdEvent.eventKey, createdEvent.quantity, createdEvent.metadata),
        )

        if (!plan) {
          continue
        }

        if (plan.expireRunId) {
          await transaction.workflowRun.update({
            where: { id: plan.expireRunId },
            data: {
              status: WorkflowRunStatus.EXPIRED,
              completedAt: createdEvent.occurredAt,
            },
          })
          workflowRunMap.delete(runKey)
        }

        let completedRunId: string | null = null
        if (plan.createRun) {
          const createdRun = await transaction.workflowRun.create({
            data: {
              workflowId: workflow.id,
              profileId: profile.id,
              playerId: plan.createRun.playerId,
              status: plan.createRun.status,
              currentStep: plan.createRun.currentStep,
              context: plan.createRun.context,
              startedAt: plan.createRun.startedAt,
              lastMatchedAt: plan.createRun.lastMatchedAt,
              expiresAt: plan.createRun.expiresAt,
              completedAt: plan.createRun.completedAt,
            },
          })

          completedRunId = plan.createRun.status === WorkflowRunStatus.COMPLETED ? createdRun.id : null
          if (createdRun.status === WorkflowRunStatus.ACTIVE) {
            workflowRunMap.set(runKey, createdRun)
          }
        }

        if (plan.updateRun) {
          const updatedRun = await transaction.workflowRun.update({
            where: { id: plan.updateRun.runId },
            data: {
              status: plan.updateRun.status,
              currentStep: plan.updateRun.currentStep,
              lastMatchedAt: plan.updateRun.lastMatchedAt,
              expiresAt: plan.updateRun.expiresAt,
              completedAt: plan.updateRun.completedAt,
              context: plan.updateRun.context,
            },
          })

          completedRunId = updatedRun.status === WorkflowRunStatus.COMPLETED ? updatedRun.id : completedRunId
          if (updatedRun.status === WorkflowRunStatus.ACTIVE) {
            workflowRunMap.set(runKey, updatedRun)
          } else {
            workflowRunMap.delete(runKey)
          }
        }

        if (plan.completed && plan.completed.playerId && completedRunId) {
          completedWorkflowTriggers.push({
            ruleKey: plan.completed.workflowKey,
            playerId: plan.completed.playerId,
            runId: completedRunId,
            eventKey: plan.completed.eventKey,
            quantity: plan.completed.quantity,
            metadata: plan.completed.metadata ?? null,
          })
        }
      }
    }

    for (const createdEvent of createdEvents) {
      if (!createdEvent.playerId) {
        continue
      }

      for (const legacyRule of enabledLegacyRules) {
        const candidate = buildRewardGrantCandidate(legacyRule, createdEvent)
        if (!candidate) {
          continue
        }

        const existingGrant = await transaction.rewardGrant.findUnique({
          where: { uniqueKey: candidate.uniqueKey },
        })
        if (existingGrant) {
          continue
        }

        const existingWallet = currentWalletsByPlayerId.get(createdEvent.playerId) ?? {
          balance: 0,
          totalEarned: 0,
          totalSpent: 0,
        }

        await transaction.playerWallet.upsert({
          where: { playerId: createdEvent.playerId },
          update: {
            balance: { increment: candidate.amount },
            totalEarned: { increment: candidate.amount },
          },
          create: {
            playerId: createdEvent.playerId,
            balance: candidate.amount,
            totalEarned: candidate.amount,
          },
        })

        currentWalletsByPlayerId.set(createdEvent.playerId, {
          balance: existingWallet.balance + candidate.amount,
          totalEarned: existingWallet.totalEarned + candidate.amount,
          totalSpent: existingWallet.totalSpent,
        })

        await transaction.rewardGrant.create({
          data: {
            profileId: profile.id,
            playerId: createdEvent.playerId,
            ruleId: legacyRule.id,
            sourceEventId: createdEvent.id,
            uniqueKey: candidate.uniqueKey,
            amount: candidate.amount,
            reason: candidate.reason,
            metadata: candidate.metadata,
            grantedAt: createdEvent.occurredAt,
          },
        })

        moneyGrantsCreated = moneyGrantsCreated + 1
      }

      for (const actionRule of sortedActionRules) {
        const plan = buildActionRulePlan(actionRule, {
          kind: TriggerSourceKind.EVENT,
          key: createdEvent.eventKey,
          quantity: createdEvent.quantity,
          metadata: createdEvent.metadata,
          evaluationContext: buildEvaluationContext(createdEvent.playerId, createdEvent.eventKey, createdEvent.quantity, createdEvent.metadata),
        })

        if (!plan) {
          continue
        }

        if (plan.flagMutation) {
          const nextServerFlags = applyFlagMutation(
            plan.flagMutation,
            createdEvent.playerId,
            currentPlayerFlagsById,
            currentServerFlags,
            dirtyPlayerFlagIds,
          )

          if (nextServerFlags !== currentServerFlags) {
            currentServerFlags = nextServerFlags
            serverFlagsDirty = true
          }
        }

        if (plan.serverSettings) {
          pendingServerSettingsUpdate = mergePendingServerSettingsUpdate(
            pendingServerSettingsUpdate,
            plan.serverSettings,
            plan.reason,
          )
        }

        if (plan.moneyAmount > 0) {
          const uniqueKey = `${actionRule.id}:${createdEvent.id}:money`
          const existingGrant = await transaction.rewardGrant.findUnique({ where: { uniqueKey } })
          if (!existingGrant) {
            const existingWallet = currentWalletsByPlayerId.get(createdEvent.playerId) ?? {
              balance: 0,
              totalEarned: 0,
              totalSpent: 0,
            }

            await transaction.playerWallet.upsert({
              where: { playerId: createdEvent.playerId },
              update: {
                balance: { increment: plan.moneyAmount },
                totalEarned: { increment: plan.moneyAmount },
              },
              create: {
                playerId: createdEvent.playerId,
                balance: plan.moneyAmount,
                totalEarned: plan.moneyAmount,
              },
            })

            currentWalletsByPlayerId.set(createdEvent.playerId, {
              balance: existingWallet.balance + plan.moneyAmount,
              totalEarned: existingWallet.totalEarned + plan.moneyAmount,
              totalSpent: existingWallet.totalSpent,
            })

            await transaction.rewardGrant.create({
              data: {
                profileId: profile.id,
                playerId: createdEvent.playerId,
                actionRuleId: actionRule.id,
                sourceEventId: createdEvent.id,
                uniqueKey,
                amount: plan.moneyAmount,
                reason: plan.reason,
                metadata: plan.metadata,
                grantedAt: createdEvent.occurredAt,
              },
            })

            moneyGrantsCreated = moneyGrantsCreated + 1
          }
        }

        for (const award of plan.xpAwards) {
          const uniqueKey = `${actionRule.id}:${createdEvent.id}:xp:${award.category ?? 'total'}`
          const existingGrant = await transaction.xpGrant.findUnique({ where: { uniqueKey } })
          if (existingGrant) {
            continue
          }

          await transaction.playerXpBalance.upsert({
            where: { playerId: createdEvent.playerId },
            update: { totalXp: { increment: award.amount } },
            create: {
              playerId: createdEvent.playerId,
              totalXp: award.amount,
            },
          })

          currentXpTotalsByPlayerId.set(
            createdEvent.playerId,
            (currentXpTotalsByPlayerId.get(createdEvent.playerId) ?? 0) + award.amount,
          )

          if (award.category) {
            const categories = currentXpCategoriesByPlayerId.get(createdEvent.playerId) ?? new Map<string, number>()

            await transaction.playerXpCategoryBalance.upsert({
              where: {
                playerId_category: {
                  playerId: createdEvent.playerId,
                  category: award.category,
                },
              },
              update: { totalXp: { increment: award.amount } },
              create: {
                playerId: createdEvent.playerId,
                category: award.category,
                totalXp: award.amount,
              },
            })

            categories.set(award.category, (categories.get(award.category) ?? 0) + award.amount)
            currentXpCategoriesByPlayerId.set(createdEvent.playerId, categories)
          }

          await transaction.xpGrant.create({
            data: {
              profileId: profile.id,
              playerId: createdEvent.playerId,
              actionRuleId: actionRule.id,
              sourceEventId: createdEvent.id,
              uniqueKey,
              category: award.category,
              amount: award.amount,
              reason: plan.reason,
              metadata: plan.metadata,
              grantedAt: createdEvent.occurredAt,
            },
          })

          xpGrantsCreated = xpGrantsCreated + 1
        }

        for (const itemGrant of plan.itemGrants ?? []) {
          const staged = await stageAutomationExecution({
            uniqueKey: `${actionRule.id}:${createdEvent.id}:item:${itemGrant.itemId}`,
            playerId: createdEvent.playerId,
            actionRuleId: actionRule.id,
            sourceEventId: createdEvent.id,
            effectType: 'ITEM_GRANT',
            reason: plan.reason,
            metadata: {
              ...(plan.metadata ?? {}),
              itemId: itemGrant.itemId,
              quantity: itemGrant.quantity,
            },
            buildCommand: playerUsername => buildAddItemCommand(playerUsername, itemGrant.itemId, itemGrant.quantity),
          })

          if (staged) {
            itemGrantsQueued = itemGrantsQueued + 1
          }
        }

        for (const xpGrant of plan.inGameXpGrants ?? []) {
          const staged = await stageAutomationExecution({
            uniqueKey: `${actionRule.id}:${createdEvent.id}:ingame-xp:${xpGrant.skillKey}`,
            playerId: createdEvent.playerId,
            actionRuleId: actionRule.id,
            sourceEventId: createdEvent.id,
            effectType: 'INGAME_XP_GRANT',
            reason: plan.reason,
            metadata: {
              ...(plan.metadata ?? {}),
              skillKey: xpGrant.skillKey,
              amount: xpGrant.amount,
            },
            buildCommand: playerUsername => buildAddXpCommand(playerUsername, xpGrant.skillKey, xpGrant.amount),
          })

          if (staged) {
            inGameXpGrantsQueued = inGameXpGrantsQueued + 1
          }
        }
      }
    }

    for (const completedWorkflow of completedWorkflowTriggers) {
      for (const actionRule of sortedActionRules) {
        const plan = buildActionRulePlan(actionRule, {
          kind: TriggerSourceKind.WORKFLOW,
          key: completedWorkflow.ruleKey,
          quantity: completedWorkflow.quantity,
          metadata: completedWorkflow.metadata,
          evaluationContext: buildEvaluationContext(
            completedWorkflow.playerId,
            completedWorkflow.eventKey,
            completedWorkflow.quantity,
            completedWorkflow.metadata,
          ),
        })

        if (!plan) {
          continue
        }

        if (plan.flagMutation) {
          const nextServerFlags = applyFlagMutation(
            plan.flagMutation,
            completedWorkflow.playerId,
            currentPlayerFlagsById,
            currentServerFlags,
            dirtyPlayerFlagIds,
          )

          if (nextServerFlags !== currentServerFlags) {
            currentServerFlags = nextServerFlags
            serverFlagsDirty = true
          }
        }

        if (plan.serverSettings) {
          pendingServerSettingsUpdate = mergePendingServerSettingsUpdate(
            pendingServerSettingsUpdate,
            plan.serverSettings,
            plan.reason,
          )
        }

        if (plan.moneyAmount > 0) {
          const uniqueKey = `${actionRule.id}:${completedWorkflow.runId}:money`
          const existingGrant = await transaction.rewardGrant.findUnique({ where: { uniqueKey } })
          if (!existingGrant) {
            const existingWallet = currentWalletsByPlayerId.get(completedWorkflow.playerId) ?? {
              balance: 0,
              totalEarned: 0,
              totalSpent: 0,
            }

            await transaction.playerWallet.upsert({
              where: { playerId: completedWorkflow.playerId },
              update: {
                balance: { increment: plan.moneyAmount },
                totalEarned: { increment: plan.moneyAmount },
              },
              create: {
                playerId: completedWorkflow.playerId,
                balance: plan.moneyAmount,
                totalEarned: plan.moneyAmount,
              },
            })

            currentWalletsByPlayerId.set(completedWorkflow.playerId, {
              balance: existingWallet.balance + plan.moneyAmount,
              totalEarned: existingWallet.totalEarned + plan.moneyAmount,
              totalSpent: existingWallet.totalSpent,
            })

            await transaction.rewardGrant.create({
              data: {
                profileId: profile.id,
                playerId: completedWorkflow.playerId,
                actionRuleId: actionRule.id,
                uniqueKey,
                amount: plan.moneyAmount,
                reason: plan.reason,
                metadata: plan.metadata,
                grantedAt: occurredAt,
              },
            })

            moneyGrantsCreated = moneyGrantsCreated + 1
          }
        }

        for (const award of plan.xpAwards) {
          const uniqueKey = `${actionRule.id}:${completedWorkflow.runId}:xp:${award.category ?? 'total'}`
          const existingGrant = await transaction.xpGrant.findUnique({ where: { uniqueKey } })
          if (existingGrant) {
            continue
          }

          await transaction.playerXpBalance.upsert({
            where: { playerId: completedWorkflow.playerId },
            update: { totalXp: { increment: award.amount } },
            create: {
              playerId: completedWorkflow.playerId,
              totalXp: award.amount,
            },
          })

          currentXpTotalsByPlayerId.set(
            completedWorkflow.playerId,
            (currentXpTotalsByPlayerId.get(completedWorkflow.playerId) ?? 0) + award.amount,
          )

          if (award.category) {
            const categories = currentXpCategoriesByPlayerId.get(completedWorkflow.playerId) ?? new Map<string, number>()

            await transaction.playerXpCategoryBalance.upsert({
              where: {
                playerId_category: {
                  playerId: completedWorkflow.playerId,
                  category: award.category,
                },
              },
              update: { totalXp: { increment: award.amount } },
              create: {
                playerId: completedWorkflow.playerId,
                category: award.category,
                totalXp: award.amount,
              },
            })

            categories.set(award.category, (categories.get(award.category) ?? 0) + award.amount)
            currentXpCategoriesByPlayerId.set(completedWorkflow.playerId, categories)
          }

          await transaction.xpGrant.create({
            data: {
              profileId: profile.id,
              playerId: completedWorkflow.playerId,
              actionRuleId: actionRule.id,
              workflowRunId: completedWorkflow.runId,
              uniqueKey,
              category: award.category,
              amount: award.amount,
              reason: plan.reason,
              metadata: plan.metadata,
              grantedAt: occurredAt,
            },
          })

          xpGrantsCreated = xpGrantsCreated + 1
        }

        for (const itemGrant of plan.itemGrants ?? []) {
          const staged = await stageAutomationExecution({
            uniqueKey: `${actionRule.id}:${completedWorkflow.runId}:item:${itemGrant.itemId}`,
            playerId: completedWorkflow.playerId,
            actionRuleId: actionRule.id,
            workflowRunId: completedWorkflow.runId,
            effectType: 'ITEM_GRANT',
            reason: plan.reason,
            metadata: {
              ...(plan.metadata ?? {}),
              itemId: itemGrant.itemId,
              quantity: itemGrant.quantity,
            },
            buildCommand: playerUsername => buildAddItemCommand(playerUsername, itemGrant.itemId, itemGrant.quantity),
          })

          if (staged) {
            itemGrantsQueued = itemGrantsQueued + 1
          }
        }

        for (const xpGrant of plan.inGameXpGrants ?? []) {
          const staged = await stageAutomationExecution({
            uniqueKey: `${actionRule.id}:${completedWorkflow.runId}:ingame-xp:${xpGrant.skillKey}`,
            playerId: completedWorkflow.playerId,
            actionRuleId: actionRule.id,
            workflowRunId: completedWorkflow.runId,
            effectType: 'INGAME_XP_GRANT',
            reason: plan.reason,
            metadata: {
              ...(plan.metadata ?? {}),
              skillKey: xpGrant.skillKey,
              amount: xpGrant.amount,
            },
            buildCommand: playerUsername => buildAddXpCommand(playerUsername, xpGrant.skillKey, xpGrant.amount),
          })

          if (staged) {
            inGameXpGrantsQueued = inGameXpGrantsQueued + 1
          }
        }
      }
    }

    if (dirtyPlayerFlagIds.size > 0) {
      await Promise.all(
        Array.from(dirtyPlayerFlagIds).map(playerId => transaction.serverPlayer.update({
          where: { id: playerId },
          data: {
            automationState: buildAutomationRuntimeState(currentPlayerFlagsById.get(playerId) ?? {}),
          },
        })),
      )
    }

    const serverSettingsMutation = pendingServerSettingsUpdate
      ? buildServerIniEditorMutation(profile, pendingServerSettingsUpdate.settings)
      : null

    await transaction.serverProfile.update({
      where: { id: profile.id },
      data: {
        ...(serverSettingsMutation
          ? {
              ...serverSettingsMutation.profileData,
              serverIniOverrides: serverSettingsMutation.overrideSettings,
            }
          : {}),
        ...(serverFlagsDirty
          ? {
              automationState: buildAutomationRuntimeState(currentServerFlags),
            }
          : {}),
        lastTelemetryAt: occurredAt,
        lastGameState: body.gameState ?? undefined,
      },
    })

    if (serverSettingsMutation && pendingServerSettingsUpdate) {
      await transaction.auditLog.create({
        data: {
          action: 'config.server_ini.automation.update',
          target: profile.id,
          details: {
            changedKeys: serverSettingsMutation.changedKeys,
            applyMode: pendingServerSettingsUpdate.applyMode,
            reasons: pendingServerSettingsUpdate.reasons,
          },
        },
      })
    }

    return {
      pendingAutomationExecutions,
      playersProcessed: body.players.length,
      eventsCreated: createdEvents.length,
      moneyGrantsCreated,
      xpGrantsCreated,
      itemGrantsQueued,
      inGameXpGrantsQueued,
      workflowCompletions: completedWorkflowTriggers.length,
      serverSettingsChanged: serverSettingsMutation?.changedKeys.length ?? 0,
      restartRequested: Boolean(serverSettingsMutation && pendingServerSettingsUpdate?.applyMode === 'restart-server'),
    }
  })

  let itemGrantsCompleted = 0
  let inGameXpGrantsCompleted = 0
  let automationExecutionsFailed = 0

  for (const pendingExecution of pendingAutomationExecutions) {
    const markFailed = async (message: string) => {
      automationExecutionsFailed = automationExecutionsFailed + 1

      try {
        await prisma.automationActionExecution.update({
          where: { id: pendingExecution.executionId },
          data: {
            status: 'FAILED',
            error: message,
          },
        })
      }
      catch (updateError) {
        logger.error({ updateError, executionId: pendingExecution.executionId }, 'Failed to record automation execution failure')
      }
    }

    if (!pendingExecution.command) {
      await markFailed('Player username unavailable for automation reward delivery')
      continue
    }

    try {
      await sendRconCommand(pendingExecution.command)
      await prisma.automationActionExecution.update({
        where: { id: pendingExecution.executionId },
        data: {
          status: 'COMPLETED',
          error: null,
          executedAt: new Date(),
        },
      })

      if (pendingExecution.effectType === 'ITEM_GRANT') {
        itemGrantsCompleted = itemGrantsCompleted + 1
      } else {
        inGameXpGrantsCompleted = inGameXpGrantsCompleted + 1
      }
    }
    catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown automation reward delivery error'
      logger.error({ error, executionId: pendingExecution.executionId, effectType: pendingExecution.effectType, playerId: pendingExecution.playerId }, 'Automation reward delivery failed')
      await markFailed(message)
    }
  }

  if (result.restartRequested) {
    try {
      try {
        await sendRconCommand('servermsg "Automation updated server settings. Restarting server..."')
        await sendRconCommand('save')
      }
      catch {
        // RCON may not be available during an automation-driven restart.
      }

      const config = useRuntimeConfig()
      const updatedProfile = await prisma.serverProfile.findUnique({
        where: { id: profile.id },
        include: { mods: { where: { isEnabled: true }, orderBy: { order: 'asc' } } },
      })

      if (updatedProfile) {
        await reconcileGameContainer({
          servername: updatedProfile.servername,
          gamePort: updatedProfile.gamePort,
          directPort: updatedProfile.directPort,
          rconPort: updatedProfile.rconPort,
          rconPassword: updatedProfile.rconPassword || config.pzRconPassword,
          steamBuild: updatedProfile.steamBuild,
          mapName: updatedProfile.mapName,
          maxPlayers: updatedProfile.maxPlayers,
          pvp: updatedProfile.pvp,
          serverIniOverrides: getProfileServerIniOverrides(updatedProfile),
          sandboxVarsOverrides: getProfileSandboxVarsOverrides(updatedProfile),
          mods: updatedProfile.mods,
        })
      }
    }
    catch (error) {
      logger.error({ error, profileId: profile.id }, 'Telemetry processed, but automation-driven server setting restart failed')
    }
  }

  return {
    ok: true,
    profileId: profile.id,
    ...result,
    itemGrantsCompleted,
    inGameXpGrantsCompleted,
    automationExecutionsFailed,
  }
})