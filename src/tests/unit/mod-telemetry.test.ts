import {
  RewardTriggerType,
  TelemetryEventType,
  TriggerSourceKind,
  WorkflowRunStatus,
} from '@prisma/client'
import type { ActionRule } from '@prisma/client'
import { describe, expect, it } from 'vitest'

import {
  buildActionRulePlan,
  buildRewardGrantCandidate,
  deriveOfflineEvents,
  derivePlayerEvents,
  evaluateWorkflowTransition,
} from '../../server/utils/mod-telemetry'
import { TelemetryEventKeys } from '../../server/utils/telemetry-config'
import {
  automationRuntimeFlagMutationKey,
  automationRuntimeInGameXpGrantKey,
  automationRuntimeItemGrantKey,
  automationRuntimePredicateKey,
} from '../../shared/telemetry-automation-runtime'

describe('derivePlayerEvents', () => {
  it('creates session, zombie kill, and skill events from snapshot deltas', () => {
    const events = derivePlayerEvents(null, {
      username: 'Alice',
      zombieKills: 3,
      skills: {
        Carpentry: 2,
      },
    }, new Date('2026-04-04T12:00:00Z'))

    expect(events.map(event => event.type)).toEqual([
      TelemetryEventType.SESSION_STARTED,
      TelemetryEventType.ZOMBIE_KILL,
      TelemetryEventType.SKILL_LEVEL_UP,
    ])
    expect(events[1]?.quantity).toBe(3)
    expect(events[1]?.eventKey).toBe(TelemetryEventKeys.ZOMBIE_KILL)
    expect(events[2]?.metadata).toEqual({
      skill: 'Carpentry',
      fromLevel: 0,
      toLevel: 2,
    })
  })

  it('creates a death event when a player transitions to dead', () => {
    const events = derivePlayerEvents({
      username: 'Alice',
      isOnline: true,
      isDead: false,
      zombieKills: 10,
      skills: {},
    }, {
      username: 'Alice',
      isDead: true,
      zombieKills: 10,
      skills: {},
    }, new Date('2026-04-04T12:00:00Z'))

    expect(events.map(event => event.type)).toContain(TelemetryEventType.PLAYER_DIED)
  })
})

describe('deriveOfflineEvents', () => {
  it('creates session ended events for players missing from the current snapshot', () => {
    const events = deriveOfflineEvents([
      { username: 'Alice', isOnline: true, isDead: false, zombieKills: 0, skills: {} },
      { username: 'Bob', isOnline: false, isDead: false, zombieKills: 0, skills: {} },
    ], new Set(['Bob']), new Date('2026-04-04T12:00:00Z'))

    expect(events).toHaveLength(1)
    expect(events[0]?.type).toBe(TelemetryEventType.SESSION_ENDED)
    expect(events[0]?.eventKey).toBe(TelemetryEventKeys.SESSION_ENDED)
    expect(events[0]?.playerUsername).toBe('Alice')
  })
})

describe('buildRewardGrantCandidate', () => {
  it('matches zombie kill rules and multiplies by quantity', () => {
    const candidate = buildRewardGrantCandidate({
      id: 'rule-zombie',
      profileId: 'profile-1',
      name: 'Zombie reward',
      triggerType: RewardTriggerType.ZOMBIE_KILL,
      rewardAmount: 50,
      isEnabled: true,
      triggerConfig: null,
      createdAt: new Date('2026-04-04T12:00:00Z'),
      updatedAt: new Date('2026-04-04T12:00:00Z'),
    }, {
      id: 'event-1',
      type: TelemetryEventType.ZOMBIE_KILL,
      eventKey: TelemetryEventKeys.ZOMBIE_KILL,
      quantity: 4,
      metadata: null,
    })

    expect(candidate).toEqual({
      amount: 200,
      reason: 'Zombie reward: 4 zombie kill(s)',
      uniqueKey: 'rule-zombie:event-1',
      metadata: undefined,
    })
  })

  it('honors skill filters for skill level rewards', () => {
    const candidate = buildRewardGrantCandidate({
      id: 'rule-skill',
      profileId: 'profile-1',
      name: 'Skill reward',
      triggerType: RewardTriggerType.SKILL_LEVEL_UP,
      rewardAmount: 500,
      isEnabled: true,
      triggerConfig: { skills: ['Carpentry'] },
      createdAt: new Date('2026-04-04T12:00:00Z'),
      updatedAt: new Date('2026-04-04T12:00:00Z'),
    }, {
      id: 'event-2',
      type: TelemetryEventType.SKILL_LEVEL_UP,
      eventKey: TelemetryEventKeys.SKILL_LEVEL_UP,
      quantity: 1,
      metadata: { skill: 'Cooking' },
    })

    expect(candidate).toBeNull()
  })

  it('matches item found rewards when the item type is allowed', () => {
    const candidate = buildRewardGrantCandidate({
      id: 'rule-item',
      profileId: 'profile-1',
      name: 'Rare loot reward',
      triggerType: RewardTriggerType.ITEM_FOUND,
      rewardAmount: 10000,
      isEnabled: true,
      triggerConfig: { itemTypes: ['Base.Katana'] },
      createdAt: new Date('2026-04-04T12:00:00Z'),
      updatedAt: new Date('2026-04-04T12:00:00Z'),
    }, {
      id: 'event-3',
      type: TelemetryEventType.ITEM_FOUND,
      eventKey: TelemetryEventKeys.ITEM_FOUND,
      quantity: 1,
      metadata: { itemType: 'Base.Katana' },
    })

    expect(candidate).toEqual({
      amount: 10000,
      reason: 'Rare loot reward: Base.Katana x1',
      uniqueKey: 'rule-item:event-3',
      metadata: { itemType: 'Base.Katana' },
    })
  })
})

describe('buildActionRulePlan', () => {
  const baseRule: ActionRule = {
    id: 'action-1',
    profileId: 'profile-1',
    name: 'Combat XP and cash',
    triggerKind: TriggerSourceKind.EVENT,
    triggerKey: TelemetryEventKeys.ZOMBIE_KILL,
    isEnabled: true,
    moneyAmount: 50,
    xpAmount: 0,
    xpCategory: 'combat',
    xpCategoryAmount: 10,
    config: { multiplyByQuantity: true },
    createdAt: new Date('2026-04-04T12:00:00Z'),
    updatedAt: new Date('2026-04-04T12:00:00Z'),
  }

  it('builds money and category xp awards from an event trigger', () => {
    const plan = buildActionRulePlan(baseRule, {
      kind: TriggerSourceKind.EVENT,
      key: TelemetryEventKeys.ZOMBIE_KILL,
      quantity: 3,
      metadata: null,
    })

    expect(plan).toEqual({
      moneyAmount: 150,
      xpAwards: [{ category: 'combat', amount: 30 }],
      reason: 'Combat XP and cash',
      metadata: undefined,
    })
  })

  it('applies metadata filters to action rules', () => {
    const plan = buildActionRulePlan({
      ...baseRule,
      triggerKey: TelemetryEventKeys.ITEM_FOUND,
      config: { metadata: { itemType: ['Base.Katana'] } },
    }, {
      kind: TriggerSourceKind.EVENT,
      key: TelemetryEventKeys.ITEM_FOUND,
      quantity: 1,
      metadata: { itemType: 'Base.Hammer' },
    })

    expect(plan).toBeNull()
  })

  it('builds server setting mutations from action config even without reward amounts', () => {
    const plan = buildActionRulePlan({
      ...baseRule,
      triggerKey: TelemetryEventKeys.ITEM_FOUND,
      moneyAmount: 0,
      xpAmount: 0,
      xpCategoryAmount: 0,
      config: {
        serverSettings: {
          PVP: true,
          SafetySystem: false,
        },
        serverSettingsApplyMode: 'restart-server',
      },
    }, {
      kind: TriggerSourceKind.EVENT,
      key: TelemetryEventKeys.ITEM_FOUND,
      quantity: 1,
      metadata: { itemType: 'Base.Flag' },
    })

    expect(plan).toEqual({
      moneyAmount: 0,
      xpAwards: [],
      serverSettings: {
        settings: {
          PVP: 'true',
          SafetySystem: 'false',
        },
        applyMode: 'restart-server',
      },
      reason: 'Combat XP and cash',
      metadata: { itemType: 'Base.Flag' },
    })
  })

  it('builds direct item and in-game XP grants from compiled action config', () => {
    const plan = buildActionRulePlan({
      ...baseRule,
      name: 'Loot and XP',
      triggerKey: TelemetryEventKeys.ITEM_FOUND,
      moneyAmount: 0,
      xpAmount: 0,
      xpCategory: null,
      xpCategoryAmount: 0,
      config: {
        multiplyByQuantity: true,
        [automationRuntimeItemGrantKey]: {
          itemId: 'Base.Katana',
          quantity: 1,
        },
        [automationRuntimeInGameXpGrantKey]: {
          skillKey: 'Axe',
          amount: 3,
        },
      },
    }, {
      kind: TriggerSourceKind.EVENT,
      key: TelemetryEventKeys.ITEM_FOUND,
      quantity: 2,
      metadata: { itemType: 'Base.Key1' },
    })

    expect(plan).toEqual({
      moneyAmount: 0,
      xpAwards: [],
      itemGrants: [{
        itemId: 'Base.Katana',
        quantity: 2,
      }],
      inGameXpGrants: [{
        skillKey: 'Axe',
        amount: 6,
      }],
      reason: 'Loot and XP',
      metadata: { itemType: 'Base.Key1' },
    })
  })

  it('builds multiple item grants from a compiled named loot table payout', () => {
    const plan = buildActionRulePlan({
      ...baseRule,
      name: 'Bundle payout',
      triggerKey: TelemetryEventKeys.ITEM_FOUND,
      moneyAmount: 0,
      xpAmount: 0,
      xpCategory: null,
      xpCategoryAmount: 0,
      config: {
        multiplyByQuantity: true,
        [automationRuntimeItemGrantKey]: [
          {
            itemId: 'Base.Bat',
            quantity: 1,
          },
          {
            itemId: 'Base.NailsBox',
            quantity: 3,
          },
        ],
      },
    }, {
      kind: TriggerSourceKind.EVENT,
      key: TelemetryEventKeys.ITEM_FOUND,
      quantity: 2,
      metadata: { itemType: 'Base.Key1' },
    })

    expect(plan).toEqual({
      moneyAmount: 0,
      xpAwards: [],
      itemGrants: [
        {
          itemId: 'Base.Bat',
          quantity: 2,
        },
        {
          itemId: 'Base.NailsBox',
          quantity: 6,
        },
      ],
      reason: 'Bundle payout',
      metadata: { itemType: 'Base.Key1' },
    })
  })

  it('evaluates compiled predicates and returns flag mutations for generated rules', () => {
    const plan = buildActionRulePlan({
      ...baseRule,
      name: 'Unlock objective',
      triggerKind: TriggerSourceKind.WORKFLOW,
      triggerKey: 'automation.graph.graph-1.trigger.trigger-1',
      moneyAmount: 0,
      xpAmount: 0,
      xpCategory: null,
      xpCategoryAmount: 0,
      config: {
        [automationRuntimePredicateKey]: {
          kind: 'group',
          combinator: 'all',
          children: [{
            kind: 'check',
            source: 'flag',
            path: 'objective.unlocked',
            operator: 'isFalse',
            value: '',
            valueType: 'boolean',
          }],
        },
        [automationRuntimeFlagMutationKey]: {
          operation: 'set',
          targetScope: 'server',
          flagKey: 'objective.unlocked',
        },
      },
    }, {
      kind: TriggerSourceKind.WORKFLOW,
      key: 'automation.graph.graph-1.trigger.trigger-1',
      quantity: 1,
      metadata: { itemType: 'Base.Key1' },
      evaluationContext: {
        event: { key: TelemetryEventKeys.ITEM_FOUND },
        player: {},
        playerStat: {},
        item: { fullType: 'Base.Key1' },
        flag: { objective: { unlocked: false } },
        server: {},
      },
    })

    expect(plan).toEqual({
      moneyAmount: 0,
      xpAwards: [],
      flagMutation: {
        operation: 'set',
        targetScope: 'server',
        flagKey: 'objective.unlocked',
      },
      reason: 'Unlock objective',
      metadata: { itemType: 'Base.Key1' },
    })
  })

  it('rejects generated rules when compiled predicates do not match the evaluation context', () => {
    const plan = buildActionRulePlan({
      ...baseRule,
      triggerKey: TelemetryEventKeys.ITEM_FOUND,
      moneyAmount: 0,
      xpAmount: 0,
      xpCategory: null,
      xpCategoryAmount: 0,
      config: {
        [automationRuntimePredicateKey]: {
          kind: 'check',
          source: 'item',
          path: 'fullType',
          operator: 'equals',
          value: 'Base.Key1',
          valueType: 'string',
        },
        [automationRuntimeFlagMutationKey]: {
          operation: 'set',
          targetScope: 'player',
          flagKey: 'reward.key-found',
        },
      },
    }, {
      kind: TriggerSourceKind.EVENT,
      key: TelemetryEventKeys.ITEM_FOUND,
      quantity: 1,
      metadata: { itemType: 'Base.Hammer' },
      evaluationContext: {
        event: { key: TelemetryEventKeys.ITEM_FOUND },
        player: {},
        playerStat: {},
        item: { fullType: 'Base.Hammer' },
        flag: {},
        server: {},
      },
    })

    expect(plan).toBeNull()
  })
})

describe('evaluateWorkflowTransition', () => {
  const workflow = {
    id: 'workflow-1',
    key: 'capture-chain',
    name: 'Capture chain',
    steps: [
      {
        id: 'step-1',
        stepOrder: 1,
        eventKey: 'objective.flag.alpha',
        withinSeconds: null,
      },
      {
        id: 'step-2',
        stepOrder: 2,
        eventKey: 'objective.flag.bravo',
        withinSeconds: 30,
      },
    ],
  }

  it('starts a workflow run when the first step matches', () => {
    const plan = evaluateWorkflowTransition(workflow, null, {
      id: 'event-1',
      playerId: 'player-1',
      type: null,
      eventKey: 'objective.flag.alpha',
      quantity: 1,
      metadata: { flag: 'alpha' },
      occurredAt: new Date('2026-04-04T12:00:00Z'),
    })

    expect(plan?.createRun).toMatchObject({
      workflowId: 'workflow-1',
      playerId: 'player-1',
      status: WorkflowRunStatus.ACTIVE,
      currentStep: 1,
    })
    expect(plan?.completed).toBeUndefined()
  })

  it('completes a workflow when the next step happens within the window', () => {
    const plan = evaluateWorkflowTransition(workflow, {
      id: 'run-1',
      workflowId: 'workflow-1',
      playerId: 'player-1',
      status: WorkflowRunStatus.ACTIVE,
      currentStep: 1,
      lastMatchedAt: new Date('2026-04-04T12:00:00Z'),
      expiresAt: new Date('2026-04-04T12:00:30Z'),
    }, {
      id: 'event-2',
      playerId: 'player-1',
      type: null,
      eventKey: 'objective.flag.bravo',
      quantity: 1,
      metadata: { flag: 'bravo' },
      occurredAt: new Date('2026-04-04T12:00:10Z'),
    })

    expect(plan?.updateRun).toMatchObject({
      runId: 'run-1',
      status: WorkflowRunStatus.COMPLETED,
      currentStep: 2,
    })
    expect(plan?.completed).toEqual({
      workflowId: 'workflow-1',
      workflowKey: 'capture-chain',
      playerId: 'player-1',
      eventKey: 'objective.flag.bravo',
      quantity: 1,
      metadata: { flag: 'bravo' },
    })
  })

  it('evaluates compiled match config for workflow steps', () => {
    const plan = evaluateWorkflowTransition({
      ...workflow,
      steps: [{
        id: 'step-1',
        stepOrder: 1,
        eventKey: TelemetryEventKeys.ITEM_FOUND,
        withinSeconds: null,
        matchConfig: {
          [automationRuntimePredicateKey]: {
            kind: 'check',
            source: 'item',
            path: 'fullType',
            operator: 'equals',
            value: 'Base.Key1',
            valueType: 'string',
          },
        },
      }],
    }, null, {
      id: 'event-compiled-1',
      playerId: 'player-1',
      type: null,
      eventKey: TelemetryEventKeys.ITEM_FOUND,
      quantity: 1,
      metadata: { itemType: 'Base.Key1' },
      occurredAt: new Date('2026-04-04T12:00:00Z'),
    }, {
      event: { key: TelemetryEventKeys.ITEM_FOUND },
      player: {},
      playerStat: {},
      item: { fullType: 'Base.Key1' },
      flag: {},
      server: {},
    })

    expect(plan?.createRun).toMatchObject({
      workflowId: 'workflow-1',
      playerId: 'player-1',
      status: WorkflowRunStatus.COMPLETED,
      currentStep: 1,
    })
    expect(plan?.completed).toMatchObject({
      workflowKey: 'capture-chain',
      eventKey: TelemetryEventKeys.ITEM_FOUND,
      quantity: 1,
    })
  })

  it('expires a run if the next step arrives too late', () => {
    const plan = evaluateWorkflowTransition(workflow, {
      id: 'run-1',
      workflowId: 'workflow-1',
      playerId: 'player-1',
      status: WorkflowRunStatus.ACTIVE,
      currentStep: 1,
      lastMatchedAt: new Date('2026-04-04T12:00:00Z'),
      expiresAt: new Date('2026-04-04T12:00:30Z'),
    }, {
      id: 'event-3',
      playerId: 'player-1',
      type: null,
      eventKey: 'objective.flag.bravo',
      quantity: 1,
      metadata: null,
      occurredAt: new Date('2026-04-04T12:01:00Z'),
    })

    expect(plan?.expireRunId).toBe('run-1')
    expect(plan?.updateRun).toBeUndefined()
    expect(plan?.completed).toBeUndefined()
  })
})