import * as prismaClient from '@prisma/client'
import * as v from 'valibot'

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
  type TelemetryEventRecord,
} from '../../utils/mod-telemetry'
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

  const result = await prisma.$transaction(async (transaction) => {
    const [
      existingPlayers,
      enabledLegacyRules,
      enabledActionRules,
      enabledWorkflows,
      activeWorkflowRuns,
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
    ])

    const existingPlayersByUsername = new Map(existingPlayers.map(player => [player.username, player]))
    const seenUsernames = new Set<string>()
    const playerIdsByUsername = new Map<string, string>()
    const createdEvents: TelemetryEventRecord[] = []
    const workflowRunMap = buildWorkflowRunMap(activeWorkflowRuns)
    let moneyGrantsCreated = 0
    let xpGrantsCreated = 0

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
        const plan = evaluateWorkflowTransition(workflowLike, existingRun ? toWorkflowRunLike(existingRun) : null, createdEvent)

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

      for (const actionRule of enabledActionRules) {
        const plan = buildActionRulePlan(actionRule, {
          kind: TriggerSourceKind.EVENT,
          key: createdEvent.eventKey,
          quantity: createdEvent.quantity,
          metadata: createdEvent.metadata,
        })

        if (!plan) {
          continue
        }

        if (plan.moneyAmount > 0) {
          const uniqueKey = `${actionRule.id}:${createdEvent.id}:money`
          const existingGrant = await transaction.rewardGrant.findUnique({ where: { uniqueKey } })
          if (!existingGrant) {
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

          if (award.category) {
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
      }
    }

    for (const completedWorkflow of completedWorkflowTriggers) {
      for (const actionRule of enabledActionRules) {
        const plan = buildActionRulePlan(actionRule, {
          kind: TriggerSourceKind.WORKFLOW,
          key: completedWorkflow.ruleKey,
          quantity: 1,
          metadata: completedWorkflow.metadata,
        })

        if (!plan) {
          continue
        }

        if (plan.moneyAmount > 0) {
          const uniqueKey = `${actionRule.id}:${completedWorkflow.runId}:money`
          const existingGrant = await transaction.rewardGrant.findUnique({ where: { uniqueKey } })
          if (!existingGrant) {
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

          if (award.category) {
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
      }
    }

    await transaction.serverProfile.update({
      where: { id: profile.id },
      data: {
        lastTelemetryAt: occurredAt,
        lastGameState: body.gameState ?? undefined,
      },
    })

    return {
      playersProcessed: body.players.length,
      eventsCreated: createdEvents.length,
      moneyGrantsCreated,
      xpGrantsCreated,
      workflowCompletions: completedWorkflowTriggers.length,
    }
  })

  return {
    ok: true,
    profileId: profile.id,
    ...result,
  }
})