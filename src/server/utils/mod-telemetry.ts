import * as prismaClient from '@prisma/client'
import type {
  ActionRule,
  RewardRule,
  ServerPlayer,
  WorkflowDefinition,
  WorkflowRun,
  WorkflowStep,
} from '@prisma/client'

import { TelemetryEventKeys } from './telemetry-config'

const { RewardTriggerType, TelemetryEventType, WorkflowRunStatus } = prismaClient

export interface InventoryItemPayload {
  fullType: string
  count: number
  equipped?: boolean
  container?: string
}

export interface TelemetryPlayerPayload {
  username: string
  x?: number
  y?: number
  z?: number
  isDead?: boolean
  isGhost?: boolean
  zombieKills?: number
  hoursSurvived?: number
  profession?: string | null
  skills?: Record<string, number>
  inventory?: InventoryItemPayload[]
}

export interface DerivedTelemetryEvent {
  playerUsername?: string
  type: prismaClient.TelemetryEventType | null
  eventKey: string
  quantity: number
  occurredAt: Date
  metadata?: Record<string, unknown>
}

export interface TelemetryEventRecord {
  id: string
  playerId: string | null
  type: prismaClient.TelemetryEventType | null
  eventKey: string
  quantity: number
  metadata: Record<string, unknown> | null
  occurredAt: Date
}

export interface RewardGrantCandidate {
  amount: number
  reason: string
  uniqueKey: string
  metadata?: Record<string, unknown>
}

export interface ActionRulePlan {
  moneyAmount: number
  xpAwards: Array<{
    category?: string
    amount: number
  }>
  reason: string
  metadata?: Record<string, unknown>
}

export interface WorkflowDefinitionLike {
  id: string
  key: string
  name: string
  steps: WorkflowStepLike[]
}

export interface WorkflowStepLike {
  id: string
  stepOrder: number
  eventKey: string
  withinSeconds: number | null
  matchConfig?: unknown
}

export interface WorkflowRunLike {
  id: string
  workflowId: string
  playerId: string | null
  status: prismaClient.WorkflowRunStatus
  currentStep: number
  lastMatchedAt: Date | null
  expiresAt: Date | null
}

export interface WorkflowTransitionPlan {
  expireRunId?: string
  createRun?: {
    workflowId: string
    playerId: string | null
    status: prismaClient.WorkflowRunStatus
    currentStep: number
    startedAt: Date
    lastMatchedAt: Date
    expiresAt: Date | null
    completedAt: Date | null
    context?: Record<string, unknown>
  }
  updateRun?: {
    runId: string
    status: prismaClient.WorkflowRunStatus
    currentStep: number
    lastMatchedAt: Date
    expiresAt: Date | null
    completedAt: Date | null
    context?: Record<string, unknown>
  }
  completed?: {
    workflowId: string
    workflowKey: string
    playerId: string | null
    metadata?: Record<string, unknown>
  }
}

export interface PlayerStateLike {
  username: string
  isOnline: boolean
  isDead: boolean
  zombieKills: number
  skills?: Record<string, number> | null
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function normalizeSkills(skills?: Record<string, number> | null): Record<string, number> {
  if (!skills) {
    return {}
  }

  return Object.entries(skills).reduce<Record<string, number>>((acc, [skill, level]) => {
    if (typeof level === 'number' && Number.isFinite(level) && level > 0) {
      acc[skill] = Math.floor(level)
    }
    return acc
  }, {})
}

export function getPreviousPlayerState(player: ServerPlayer): PlayerStateLike {
  return {
    username: player.username,
    isOnline: player.isOnline,
    isDead: player.isDead,
    zombieKills: player.zombieKills,
    skills: normalizeSkills((player.skills as Record<string, number> | null | undefined) ?? undefined),
  }
}

export function getLegacyTelemetryType(eventKey: string): prismaClient.TelemetryEventType | null {
  switch (eventKey) {
    case TelemetryEventKeys.SESSION_STARTED:
      return TelemetryEventType.SESSION_STARTED
    case TelemetryEventKeys.SESSION_ENDED:
      return TelemetryEventType.SESSION_ENDED
    case TelemetryEventKeys.PLAYER_DIED:
      return TelemetryEventType.PLAYER_DIED
    case TelemetryEventKeys.ZOMBIE_KILL:
      return TelemetryEventType.ZOMBIE_KILL
    case TelemetryEventKeys.PVP_KILL:
      return TelemetryEventType.PVP_KILL
    case TelemetryEventKeys.SKILL_LEVEL_UP:
      return TelemetryEventType.SKILL_LEVEL_UP
    case TelemetryEventKeys.ITEM_FOUND:
      return TelemetryEventType.ITEM_FOUND
    case TelemetryEventKeys.BUILD_ACTION:
      return TelemetryEventType.BUILD_ACTION
    default:
      return null
  }
}

export function derivePlayerEvents(
  previous: PlayerStateLike | null,
  current: TelemetryPlayerPayload,
  occurredAt: Date,
): DerivedTelemetryEvent[] {
  const events: DerivedTelemetryEvent[] = []
  const normalizedCurrentSkills = normalizeSkills(current.skills)

  if (!previous || !previous.isOnline) {
    events.push({
      playerUsername: current.username,
      type: TelemetryEventType.SESSION_STARTED,
      eventKey: TelemetryEventKeys.SESSION_STARTED,
      quantity: 1,
      occurredAt,
    })
  }

  const previousZombieKills = previous?.zombieKills ?? 0
  const currentZombieKills = Math.max(0, Math.floor(current.zombieKills ?? previousZombieKills))
  if (currentZombieKills > previousZombieKills) {
    events.push({
      playerUsername: current.username,
      type: TelemetryEventType.ZOMBIE_KILL,
      eventKey: TelemetryEventKeys.ZOMBIE_KILL,
      quantity: currentZombieKills - previousZombieKills,
      occurredAt,
      metadata: {
        from: previousZombieKills,
        to: currentZombieKills,
      },
    })
  }

  const previousSkills = normalizeSkills(previous?.skills)
  for (const [skill, currentLevel] of Object.entries(normalizedCurrentSkills)) {
    const previousLevel = previousSkills[skill] ?? 0
    if (currentLevel > previousLevel) {
      events.push({
        playerUsername: current.username,
        type: TelemetryEventType.SKILL_LEVEL_UP,
        eventKey: TelemetryEventKeys.SKILL_LEVEL_UP,
        quantity: currentLevel - previousLevel,
        occurredAt,
        metadata: {
          skill,
          fromLevel: previousLevel,
          toLevel: currentLevel,
        },
      })
    }
  }

  if (previous && !previous.isDead && Boolean(current.isDead)) {
    events.push({
      playerUsername: current.username,
      type: TelemetryEventType.PLAYER_DIED,
      eventKey: TelemetryEventKeys.PLAYER_DIED,
      quantity: 1,
      occurredAt,
    })
  }

  return events
}

export function deriveOfflineEvents(
  previousPlayers: PlayerStateLike[],
  seenUsernames: Set<string>,
  occurredAt: Date,
): DerivedTelemetryEvent[] {
  return previousPlayers
    .filter(player => player.isOnline && !seenUsernames.has(player.username))
    .map(player => ({
      playerUsername: player.username,
      type: TelemetryEventType.SESSION_ENDED,
      eventKey: TelemetryEventKeys.SESSION_ENDED,
      quantity: 1,
      occurredAt,
    }))
}

function getRuleConfig(rule: RewardRule | ActionRule): Record<string, unknown> {
  if ('config' in rule) {
    return asRecord(rule.config)
  }

  return asRecord(rule.triggerConfig)
}

function matchesMetadataFilter(filterValue: unknown, actualValue: unknown): boolean {
  if (Array.isArray(filterValue)) {
    return filterValue.some(candidate => matchesMetadataFilter(candidate, actualValue))
  }

  if (typeof filterValue === 'object' && filterValue && !Array.isArray(filterValue)) {
    if (!actualValue || typeof actualValue !== 'object' || Array.isArray(actualValue)) {
      return false
    }

    return Object.entries(filterValue as Record<string, unknown>).every(([key, value]) => {
      return matchesMetadataFilter(value, (actualValue as Record<string, unknown>)[key])
    })
  }

  return filterValue === actualValue
}

function matchesConfigMetadata(config: Record<string, unknown>, metadata: Record<string, unknown> | null): boolean {
  const filter = config.metadata
  if (!filter) {
    return true
  }

  return matchesMetadataFilter(filter, metadata ?? {})
}

function getRuleMultiplier(config: Record<string, unknown>, quantity: number): number {
  return config.multiplyByQuantity === false ? 1 : Math.max(1, quantity)
}

export function buildRewardGrantCandidate(
  rule: RewardRule,
  event: {
    id: string
    type: prismaClient.TelemetryEventType | null
    eventKey?: string
    quantity: number
    metadata: Record<string, unknown> | null
  },
): RewardGrantCandidate | null {
  const config = getRuleConfig(rule)
  const effectiveType = event.type ?? getLegacyTelemetryType(event.eventKey ?? '')
  let amount = 0
  let reason = rule.name

  if (rule.triggerType === RewardTriggerType.ZOMBIE_KILL && effectiveType === TelemetryEventType.ZOMBIE_KILL) {
    amount = rule.rewardAmount * Math.max(1, event.quantity)
    reason = `${rule.name}: ${event.quantity} zombie kill(s)`
  }

  if (rule.triggerType === RewardTriggerType.PVP_KILL && effectiveType === TelemetryEventType.PVP_KILL) {
    amount = rule.rewardAmount * Math.max(1, event.quantity)
    reason = `${rule.name}: ${event.quantity} PvP kill(s)`
  }

  if (rule.triggerType === RewardTriggerType.SKILL_LEVEL_UP && effectiveType === TelemetryEventType.SKILL_LEVEL_UP) {
    const allowedSkills = Array.isArray(config.skills)
      ? config.skills.filter((value): value is string => typeof value === 'string')
      : []
    const eventSkill = typeof event.metadata?.skill === 'string' ? event.metadata.skill : null
    if (allowedSkills.length > 0 && (!eventSkill || !allowedSkills.includes(eventSkill))) {
      return null
    }

    amount = rule.rewardAmount * Math.max(1, event.quantity)
    reason = eventSkill
      ? `${rule.name}: ${eventSkill} +${event.quantity}`
      : `${rule.name}: ${event.quantity} skill level(s)`
  }

  if (rule.triggerType === RewardTriggerType.ITEM_FOUND && effectiveType === TelemetryEventType.ITEM_FOUND) {
    const allowedItems = Array.isArray(config.itemTypes)
      ? config.itemTypes.filter((value): value is string => typeof value === 'string')
      : []
    const eventItemType = typeof event.metadata?.itemType === 'string' ? event.metadata.itemType : null
    if (allowedItems.length > 0 && (!eventItemType || !allowedItems.includes(eventItemType))) {
      return null
    }

    amount = rule.rewardAmount * Math.max(1, event.quantity)
    reason = eventItemType
      ? `${rule.name}: ${eventItemType} x${event.quantity}`
      : `${rule.name}: ${event.quantity} item(s) found`
  }

  if (rule.triggerType === RewardTriggerType.BUILD_ACTION && effectiveType === TelemetryEventType.BUILD_ACTION) {
    const allowedActions = Array.isArray(config.actions)
      ? config.actions.filter((value): value is string => typeof value === 'string')
      : []
    const eventAction = typeof event.metadata?.action === 'string' ? event.metadata.action : null
    if (allowedActions.length > 0 && (!eventAction || !allowedActions.includes(eventAction))) {
      return null
    }

    amount = rule.rewardAmount * Math.max(1, event.quantity)
    reason = eventAction
      ? `${rule.name}: ${eventAction}`
      : `${rule.name}: build action`
  }

  if (amount <= 0) {
    return null
  }

  return {
    amount,
    reason,
    uniqueKey: `${rule.id}:${event.id}`,
    metadata: event.metadata ?? undefined,
  }
}

export function buildActionRulePlan(
  rule: ActionRule,
  trigger: {
    kind: prismaClient.TriggerSourceKind
    key: string
    quantity: number
    metadata: Record<string, unknown> | null
  },
): ActionRulePlan | null {
  if (rule.triggerKind !== trigger.kind || rule.triggerKey !== trigger.key) {
    return null
  }

  const config = getRuleConfig(rule)
  if (!matchesConfigMetadata(config, trigger.metadata)) {
    return null
  }

  const multiplier = getRuleMultiplier(config, trigger.quantity)
  const moneyAmount = Math.max(0, rule.moneyAmount) * multiplier
  const xpAwards: ActionRulePlan['xpAwards'] = []

  if (rule.xpAmount > 0) {
    xpAwards.push({ amount: rule.xpAmount * multiplier })
  }

  if (rule.xpCategory && rule.xpCategoryAmount > 0) {
    xpAwards.push({
      category: rule.xpCategory,
      amount: rule.xpCategoryAmount * multiplier,
    })
  }

  if (moneyAmount <= 0 && xpAwards.length === 0) {
    return null
  }

  return {
    moneyAmount,
    xpAwards,
    reason: rule.name,
    metadata: trigger.metadata ?? undefined,
  }
}

function normalizeWorkflowSteps(steps: WorkflowStepLike[]): WorkflowStepLike[] {
  return [...steps].sort((left, right) => left.stepOrder - right.stepOrder)
}

function stepMatchesEvent(step: WorkflowStepLike, event: TelemetryEventRecord): boolean {
  return step.eventKey === event.eventKey && matchesConfigMetadata(asRecord(step.matchConfig), event.metadata)
}

function buildRunContext(event: TelemetryEventRecord): Record<string, unknown> {
  return {
    lastEventKey: event.eventKey,
    lastEventAt: event.occurredAt.toISOString(),
    lastEventMetadata: event.metadata ?? undefined,
  }
}

function getNextExpiry(steps: WorkflowStepLike[], matchedStepOrder: number, occurredAt: Date): Date | null {
  const nextStep = steps.find(step => step.stepOrder === matchedStepOrder + 1)
  if (!nextStep?.withinSeconds || nextStep.withinSeconds <= 0) {
    return null
  }

  return new Date(occurredAt.getTime() + nextStep.withinSeconds * 1000)
}

export function evaluateWorkflowTransition(
  workflow: WorkflowDefinitionLike,
  run: WorkflowRunLike | null,
  event: TelemetryEventRecord,
): WorkflowTransitionPlan | null {
  if (!event.playerId) {
    return null
  }

  const steps = normalizeWorkflowSteps(workflow.steps)
  if (steps.length === 0) {
    return null
  }

  let activeRun = run
  const transition: WorkflowTransitionPlan = {}

  if (activeRun?.status === WorkflowRunStatus.ACTIVE && activeRun.expiresAt && activeRun.expiresAt.getTime() < event.occurredAt.getTime()) {
    transition.expireRunId = activeRun.id
    activeRun = null
  }

  if (activeRun?.status === WorkflowRunStatus.ACTIVE) {
    const expectedStep = steps.find(step => step.stepOrder === activeRun.currentStep + 1)
    if (expectedStep && stepMatchesEvent(expectedStep, event)) {
      if (expectedStep.withinSeconds && activeRun.lastMatchedAt) {
        const deltaSeconds = (event.occurredAt.getTime() - activeRun.lastMatchedAt.getTime()) / 1000
        if (deltaSeconds > expectedStep.withinSeconds) {
          return transition.expireRunId ? transition : null
        }
      }

      const expiresAt = getNextExpiry(steps, expectedStep.stepOrder, event.occurredAt)
      const isFinalStep = expectedStep.stepOrder === steps[steps.length - 1]?.stepOrder

      transition.updateRun = {
        runId: activeRun.id,
        status: isFinalStep ? WorkflowRunStatus.COMPLETED : WorkflowRunStatus.ACTIVE,
        currentStep: expectedStep.stepOrder,
        lastMatchedAt: event.occurredAt,
        expiresAt,
        completedAt: isFinalStep ? event.occurredAt : null,
        context: buildRunContext(event),
      }

      if (isFinalStep) {
        transition.completed = {
          workflowId: workflow.id,
          workflowKey: workflow.key,
          playerId: event.playerId,
          metadata: event.metadata ?? undefined,
        }
      }

      return transition
    }
  }

  const firstStep = steps[0]
  if (!firstStep || !stepMatchesEvent(firstStep, event)) {
    return transition.expireRunId ? transition : null
  }

  const expiresAt = getNextExpiry(steps, firstStep.stepOrder, event.occurredAt)
  const isFinalStep = firstStep.stepOrder === steps[steps.length - 1]?.stepOrder
  transition.createRun = {
    workflowId: workflow.id,
    playerId: event.playerId,
    status: isFinalStep ? WorkflowRunStatus.COMPLETED : WorkflowRunStatus.ACTIVE,
    currentStep: firstStep.stepOrder,
    startedAt: event.occurredAt,
    lastMatchedAt: event.occurredAt,
    expiresAt,
    completedAt: isFinalStep ? event.occurredAt : null,
    context: buildRunContext(event),
  }

  if (isFinalStep) {
    transition.completed = {
      workflowId: workflow.id,
      workflowKey: workflow.key,
      playerId: event.playerId,
      metadata: event.metadata ?? undefined,
    }
  }

  return transition
}

export function toWorkflowDefinitionLike(
  workflow: WorkflowDefinition & { steps: WorkflowStep[] },
): WorkflowDefinitionLike {
  return {
    id: workflow.id,
    key: workflow.key,
    name: workflow.name,
    steps: workflow.steps.map(step => ({
      id: step.id,
      stepOrder: step.stepOrder,
      eventKey: step.eventKey,
      withinSeconds: step.withinSeconds,
      matchConfig: step.matchConfig,
    })),
  }
}

export function toWorkflowRunLike(run: WorkflowRun): WorkflowRunLike {
  return {
    id: run.id,
    workflowId: run.workflowId,
    playerId: run.playerId,
    status: run.status,
    currentStep: run.currentStep,
    lastMatchedAt: run.lastMatchedAt,
    expiresAt: run.expiresAt,
  }
}