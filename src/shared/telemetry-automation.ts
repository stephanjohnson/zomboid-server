export const automationStudioVersion = 1 as const

export const automationNodeTypes = ['trigger', 'condition', 'action'] as const
export const automationExecutionScopes = ['player', 'server'] as const
export const automationConditionSources = ['event', 'player', 'playerStat', 'item', 'flag', 'server'] as const
export const automationConditionOperators = [
  'equals',
  'notEquals',
  'gt',
  'gte',
  'lt',
  'lte',
  'contains',
  'matches',
  'exists',
  'notExists',
  'isTrue',
  'isFalse',
] as const
export const automationValueTypes = ['string', 'number', 'boolean'] as const
export const automationActionKinds = [
  'assignLoot',
  'assignInGameXp',
  'assignPzmXp',
  'assignCashReward',
  'setFlag',
  'unsetFlag',
] as const
export const automationConditionCombinators = ['all', 'any'] as const
export const automationBlueprintKeys = ['blank-rule', 'first-pickup-bonus', 'zombie-kill-reward', 'pvp-bounty'] as const

export type AutomationNodeType = (typeof automationNodeTypes)[number]
export type AutomationExecutionScope = (typeof automationExecutionScopes)[number]
export type AutomationConditionSource = (typeof automationConditionSources)[number]
export type AutomationConditionOperator = (typeof automationConditionOperators)[number]
export type AutomationValueType = (typeof automationValueTypes)[number]
export type AutomationActionKind = (typeof automationActionKinds)[number]
export type AutomationConditionCombinator = (typeof automationConditionCombinators)[number]
export type AutomationBlueprintKey = (typeof automationBlueprintKeys)[number]

export interface AutomationCanvasPosition {
  x: number
  y: number
}

export interface AutomationPredicate {
  id: string
  source: AutomationConditionSource
  path: string
  operator: AutomationConditionOperator
  value: string
  valueType: AutomationValueType
}

export interface AutomationTriggerNodeData {
  eventKey: string
  scope: AutomationExecutionScope
  dedupeKey: string
  cooldownSeconds: number | null
  filters: AutomationPredicate[]
  notes: string
}

export interface AutomationConditionNodeData {
  combinator: AutomationConditionCombinator
  checks: AutomationPredicate[]
  notes: string
}

export interface AutomationActionNodeData {
  actionKind: AutomationActionKind
  targetScope: AutomationExecutionScope
  amount: number | null
  itemId: string
  lootTableId: string
  quantity: number | null
  skillKey: string
  xpCategory: string
  flagKey: string
  notes: string
}

interface AutomationNodeBase<TType extends AutomationNodeType, TData> {
  id: string
  type: TType
  label: string
  position: AutomationCanvasPosition
  data: TData
}

export type AutomationTriggerNode = AutomationNodeBase<'trigger', AutomationTriggerNodeData>
export type AutomationConditionNode = AutomationNodeBase<'condition', AutomationConditionNodeData>
export type AutomationActionNode = AutomationNodeBase<'action', AutomationActionNodeData>
export type AutomationStudioNode = AutomationTriggerNode | AutomationConditionNode | AutomationActionNode

export interface AutomationStudioEdge {
  id: string
  source: string
  target: string
  sourceHandle?: string | null
  targetHandle?: string | null
  label?: string
  animated?: boolean
}

export interface AutomationStudioGraph {
  id: string
  name: string
  description: string
  isEnabled: boolean
  nodes: AutomationStudioNode[]
  edges: AutomationStudioEdge[]
}

export interface AutomationStudioDocument {
  version: typeof automationStudioVersion
  graphs: AutomationStudioGraph[]
}

export interface AutomationEventOption {
  key: string
  label: string
  description: string
  scope: AutomationExecutionScope
  context: string[]
}

export interface AutomationConditionSourceOption {
  key: AutomationConditionSource
  label: string
  description: string
  examples: string[]
}

export interface AutomationOperatorOption {
  key: AutomationConditionOperator
  label: string
  description: string
}

export interface AutomationActionOption {
  key: AutomationActionKind
  label: string
  description: string
}

export interface AutomationBlueprintOption {
  key: AutomationBlueprintKey
  title: string
  description: string
}

export const automationEventOptions: ReadonlyArray<AutomationEventOption> = [
  {
    key: 'pz.item.found',
    label: 'Item Pickup',
    description: 'Runs when a player pickup or item discovery event is emitted by the telemetry bridge.',
    scope: 'player',
    context: ['player.id', 'player.username', 'player.stats.totalItemsFound', 'item.fullType', 'item.displayName', 'item.category', 'item.quantity'],
  },
  {
    key: 'pz.zombie.kill',
    label: 'Zombie Kill',
    description: 'Runs when a player kills one or more zombies.',
    scope: 'player',
    context: ['player.id', 'player.username', 'player.stats.totalZombieKills', 'kill.count', 'weapon.type', 'weapon.category'],
  },
  {
    key: 'pz.pvp.kill',
    label: 'Player Kill',
    description: 'Runs when one player kills another player.',
    scope: 'player',
    context: ['player.id', 'player.username', 'victim.id', 'victim.username', 'weapon.type', 'distanceMeters'],
  },
  {
    key: 'pz.skill.level_up',
    label: 'Skill Level Up',
    description: 'Runs when a tracked in-game skill levels up.',
    scope: 'player',
    context: ['player.id', 'player.username', 'skill.key', 'skill.level', 'skill.previousLevel'],
  },
  {
    key: 'pz.build.action',
    label: 'Build Action',
    description: 'Runs for tracked build or construction actions.',
    scope: 'player',
    context: ['player.id', 'player.username', 'build.action', 'build.tile', 'build.materials'],
  },
  {
    key: 'pz.player.died',
    label: 'Player Death',
    description: 'Runs when a tracked player dies.',
    scope: 'player',
    context: ['player.id', 'player.username', 'death.cause', 'death.location.x', 'death.location.y'],
  },
  {
    key: 'pz.session.started',
    label: 'Session Started',
    description: 'Runs when the telemetry session starts for the profile or server.',
    scope: 'server',
    context: ['server.name', 'server.build', 'session.startedAt'],
  },
  {
    key: 'pz.session.ended',
    label: 'Session Ended',
    description: 'Runs when the telemetry session ends for the profile or server.',
    scope: 'server',
    context: ['server.name', 'session.startedAt', 'session.endedAt', 'session.durationSeconds'],
  },
]

export const automationConditionSourceOptions: ReadonlyArray<AutomationConditionSourceOption> = [
  {
    key: 'event',
    label: 'Event Payload',
    description: 'Read properties that came directly from the trigger event.',
    examples: ['item.fullType', 'kill.count', 'victim.username'],
  },
  {
    key: 'player',
    label: 'Player Profile',
    description: 'Read identity and profile data about the triggering player.',
    examples: ['id', 'username', 'steamId'],
  },
  {
    key: 'playerStat',
    label: 'Player Stats',
    description: 'Read live or cached progression stats for the triggering player.',
    examples: ['skills.axe.level', 'wallet.balance', 'kills.zombies'],
  },
  {
    key: 'item',
    label: 'Item Data',
    description: 'Read the active item payload when the event includes one.',
    examples: ['fullType', 'category', 'weight'],
  },
  {
    key: 'flag',
    label: 'Flag State',
    description: 'Check player or server flags that have already been set by another rule.',
    examples: ['reward.first-axe', 'world.halloween-event'],
  },
  {
    key: 'server',
    label: 'Server State',
    description: 'Read profile-wide or live server state values.',
    examples: ['playerCount', 'weather', 'profile.name'],
  },
]

export const automationOperatorOptions: ReadonlyArray<AutomationOperatorOption> = [
  { key: 'equals', label: 'Equals', description: 'Exact equality check.' },
  { key: 'notEquals', label: 'Does Not Equal', description: 'Exact inequality check.' },
  { key: 'gt', label: 'Greater Than', description: 'Numeric comparison.' },
  { key: 'gte', label: 'Greater Than or Equal', description: 'Numeric comparison.' },
  { key: 'lt', label: 'Less Than', description: 'Numeric comparison.' },
  { key: 'lte', label: 'Less Than or Equal', description: 'Numeric comparison.' },
  { key: 'contains', label: 'Contains', description: 'Substring or array membership match.' },
  { key: 'matches', label: 'Matches Pattern', description: 'Pattern or regex style comparison.' },
  { key: 'exists', label: 'Exists', description: 'Checks that the value exists.' },
  { key: 'notExists', label: 'Does Not Exist', description: 'Checks that the value is missing.' },
  { key: 'isTrue', label: 'Is True', description: 'Boolean truthiness check.' },
  { key: 'isFalse', label: 'Is False', description: 'Boolean falsiness check.' },
]

export const automationActionOptions: ReadonlyArray<AutomationActionOption> = [
  {
    key: 'assignLoot',
    label: 'Assign Loot',
    description: 'Grant a direct item or named loot table payout.',
  },
  {
    key: 'assignInGameXp',
    label: 'Assign In-Game XP',
    description: 'Grant vanilla Project Zomboid XP to a named skill.',
  },
  {
    key: 'assignPzmXp',
    label: 'Assign PZM XP',
    description: 'Grant profile XP or category XP tracked by this dashboard.',
  },
  {
    key: 'assignCashReward',
    label: 'Assign Cash Reward',
    description: 'Grant wallet currency or credit to the triggering target.',
  },
  {
    key: 'setFlag',
    label: 'Set Flag',
    description: 'Mark a player or server flag so later rules can branch on it.',
  },
  {
    key: 'unsetFlag',
    label: 'Unset Flag',
    description: 'Clear a player or server flag when a rule should re-open.',
  },
]

export const automationBlueprintOptions: ReadonlyArray<AutomationBlueprintOption> = [
  {
    key: 'blank-rule',
    title: 'Blank Rule',
    description: 'Start from a trigger, a gate, and one action so the canvas is ready to edit immediately.',
  },
  {
    key: 'first-pickup-bonus',
    title: 'First Pickup Bonus',
    description: 'Reward the first time a player grabs a specific item, then set a player flag so repeats stop.',
  },
  {
    key: 'zombie-kill-reward',
    title: 'Zombie Kill Reward',
    description: 'Turn a zombie kill into cash and PZM XP with room for stat-based gates.',
  },
  {
    key: 'pvp-bounty',
    title: 'PvP Bounty',
    description: 'Grant a larger payout for player kills and branch based on the killer or victim state.',
  },
]

function createAutomationId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

export function createAutomationPredicate(overrides: Partial<AutomationPredicate> = {}): AutomationPredicate {
  return {
    id: overrides.id ?? createAutomationId('check'),
    source: overrides.source ?? 'event',
    path: overrides.path ?? 'player.id',
    operator: overrides.operator ?? 'exists',
    value: overrides.value ?? '',
    valueType: overrides.valueType ?? 'string',
  }
}

export function createAutomationTriggerNode(overrides: Partial<AutomationTriggerNode> = {}): AutomationTriggerNode {
  return {
    id: overrides.id ?? createAutomationId('trigger'),
    type: 'trigger',
    label: overrides.label ?? 'Trigger',
    position: overrides.position ?? { x: 80, y: 120 },
    data: {
      eventKey: overrides.data?.eventKey ?? 'pz.item.found',
      scope: overrides.data?.scope ?? 'player',
      dedupeKey: overrides.data?.dedupeKey ?? '',
      cooldownSeconds: overrides.data?.cooldownSeconds ?? null,
      filters: overrides.data?.filters?.map(filter => createAutomationPredicate(filter)) ?? [],
      notes: overrides.data?.notes ?? '',
    },
  }
}

export function createAutomationConditionNode(overrides: Partial<AutomationConditionNode> = {}): AutomationConditionNode {
  return {
    id: overrides.id ?? createAutomationId('condition'),
    type: 'condition',
    label: overrides.label ?? 'Condition',
    position: overrides.position ?? { x: 360, y: 120 },
    data: {
      combinator: overrides.data?.combinator ?? 'all',
      checks: overrides.data?.checks?.map(check => createAutomationPredicate(check)) ?? [createAutomationPredicate()],
      notes: overrides.data?.notes ?? '',
    },
  }
}

export function createAutomationActionNode(overrides: Partial<AutomationActionNode> = {}): AutomationActionNode {
  return {
    id: overrides.id ?? createAutomationId('action'),
    type: 'action',
    label: overrides.label ?? 'Action',
    position: overrides.position ?? { x: 640, y: 120 },
    data: {
      actionKind: overrides.data?.actionKind ?? 'assignCashReward',
      targetScope: overrides.data?.targetScope ?? 'player',
      amount: overrides.data?.amount ?? 100,
      itemId: overrides.data?.itemId ?? '',
      lootTableId: overrides.data?.lootTableId ?? '',
      quantity: overrides.data?.quantity ?? 1,
      skillKey: overrides.data?.skillKey ?? '',
      xpCategory: overrides.data?.xpCategory ?? '',
      flagKey: overrides.data?.flagKey ?? '',
      notes: overrides.data?.notes ?? '',
    },
  }
}

function createEdge(source: string, target: string, overrides: Partial<AutomationStudioEdge> = {}): AutomationStudioEdge {
  return {
    id: overrides.id ?? createAutomationId('edge'),
    source,
    target,
    sourceHandle: overrides.sourceHandle ?? null,
    targetHandle: overrides.targetHandle ?? null,
    label: overrides.label,
    animated: overrides.animated ?? false,
  }
}

export function createBlankAutomationGraph(name = 'New rule graph'): AutomationStudioGraph {
  const trigger = createAutomationTriggerNode({
    label: 'Choose event',
    data: {
      eventKey: 'pz.item.found',
      scope: 'player',
      filters: [createAutomationPredicate({ source: 'item', path: 'fullType', operator: 'equals', value: 'Base.Axe' })],
      notes: 'Swap this event and filter with the raw game telemetry you want to react to.',
    },
  })
  const condition = createAutomationConditionNode({
    label: 'Gate the reward',
    data: {
      combinator: 'all',
      checks: [createAutomationPredicate({ source: 'flag', path: 'reward.first-axe', operator: 'isFalse' })],
      notes: 'Use conditions to branch on player stats, event fields, or flag state.',
    },
  })
  const action = createAutomationActionNode({
    label: 'Reward player',
    data: {
      actionKind: 'assignCashReward',
      targetScope: 'player',
      amount: 250,
      notes: 'Replace this with loot, in-game XP, PZM XP, cash, or a flag action.',
    },
  })

  return {
    id: createAutomationId('graph'),
    name,
    description: 'Start from a live event, branch through conditions, and fan out into one or more actions.',
    isEnabled: true,
    nodes: [trigger, condition, action],
    edges: [createEdge(trigger.id, condition.id), createEdge(condition.id, action.id, { sourceHandle: 'true', label: 'true' })],
  }
}

export function createAutomationBlueprintGraph(key: AutomationBlueprintKey): AutomationStudioGraph {
  if (key === 'blank-rule') {
    return createBlankAutomationGraph('Blank rule')
  }

  if (key === 'first-pickup-bonus') {
    const trigger = createAutomationTriggerNode({
      label: 'First axe pickup',
      position: { x: 80, y: 160 },
      data: {
        eventKey: 'pz.item.found',
        scope: 'player',
        dedupeKey: 'item.fullType',
        filters: [createAutomationPredicate({ source: 'item', path: 'fullType', operator: 'equals', value: 'Base.Axe' })],
        notes: 'Swap Base.Axe for any item full type or collection key you care about.',
      },
    })
    const condition = createAutomationConditionNode({
      label: 'Has not claimed before',
      position: { x: 360, y: 160 },
      data: {
        combinator: 'all',
        checks: [createAutomationPredicate({ source: 'flag', path: 'reward.first-axe', operator: 'isFalse' })],
        notes: 'This makes the reward one-time until another rule clears the flag.',
      },
    })
    const reward = createAutomationActionNode({
      label: 'Grant cash',
      position: { x: 660, y: 90 },
      data: {
        actionKind: 'assignCashReward',
        targetScope: 'player',
        amount: 250,
        notes: 'Replace with cash, PZM XP, or a loot payout.',
      },
    })
    const flag = createAutomationActionNode({
      label: 'Set player flag',
      position: { x: 660, y: 240 },
      data: {
        actionKind: 'setFlag',
        targetScope: 'player',
        amount: null,
        quantity: null,
        flagKey: 'reward.first-axe',
        notes: 'This prevents the rule from firing again for the same player.',
      },
    })

    return {
      id: createAutomationId('graph'),
      name: 'First pickup bonus',
      description: 'Reward a one-time item pickup, then set a player flag so the second pickup does not complete.',
      isEnabled: true,
      nodes: [trigger, condition, reward, flag],
      edges: [
        createEdge(trigger.id, condition.id),
        createEdge(condition.id, reward.id, { sourceHandle: 'true', label: 'true' }),
        createEdge(condition.id, flag.id, { sourceHandle: 'true', label: 'true' }),
      ],
    }
  }

  if (key === 'zombie-kill-reward') {
    const trigger = createAutomationTriggerNode({
      label: 'Zombie kill',
      position: { x: 80, y: 160 },
      data: {
        eventKey: 'pz.zombie.kill',
        scope: 'player',
        filters: [],
        notes: 'Use trigger filters when only certain zombie or weapon types should count.',
      },
    })
    const condition = createAutomationConditionNode({
      label: 'Experienced survivor',
      position: { x: 360, y: 160 },
      data: {
        combinator: 'all',
        checks: [createAutomationPredicate({ source: 'playerStat', path: 'kills.zombies', operator: 'gte', value: '25', valueType: 'number' })],
        notes: 'Example stat gate: only players with 25+ zombie kills receive the reward.',
      },
    })
    const cash = createAutomationActionNode({
      label: 'Grant credits',
      position: { x: 660, y: 90 },
      data: {
        actionKind: 'assignCashReward',
        targetScope: 'player',
        amount: 50,
      },
    })
    const xp = createAutomationActionNode({
      label: 'Grant PZM XP',
      position: { x: 660, y: 240 },
      data: {
        actionKind: 'assignPzmXp',
        targetScope: 'player',
        amount: 10,
        xpCategory: 'combat',
      },
    })

    return {
      id: createAutomationId('graph'),
      name: 'Zombie kill reward',
      description: 'Convert a zombie kill into cash and category XP with an optional player-stat gate in front of it.',
      isEnabled: true,
      nodes: [trigger, condition, cash, xp],
      edges: [
        createEdge(trigger.id, condition.id),
        createEdge(condition.id, cash.id, { sourceHandle: 'true', label: 'true' }),
        createEdge(condition.id, xp.id, { sourceHandle: 'true', label: 'true' }),
      ],
    }
  }

  const trigger = createAutomationTriggerNode({
    label: 'PvP kill',
    position: { x: 80, y: 160 },
    data: {
      eventKey: 'pz.pvp.kill',
      scope: 'player',
      notes: 'The victim and weapon fields are available to follow-up conditions.',
    },
  })
  const condition = createAutomationConditionNode({
    label: 'High-stakes target',
    position: { x: 360, y: 160 },
    data: {
      combinator: 'any',
      checks: [
        createAutomationPredicate({ source: 'event', path: 'distanceMeters', operator: 'gte', value: '25', valueType: 'number' }),
        createAutomationPredicate({ source: 'playerStat', path: 'wallet.balance', operator: 'gte', value: '5000', valueType: 'number' }),
      ],
      notes: 'Branch on either a long-distance kill or a high-value player state.',
    },
  })
  const bounty = createAutomationActionNode({
    label: 'Pay bounty',
    position: { x: 660, y: 90 },
    data: {
      actionKind: 'assignCashReward',
      targetScope: 'player',
      amount: 1000,
    },
  })
  const badgeXp = createAutomationActionNode({
    label: 'Grant combat XP',
    position: { x: 660, y: 240 },
    data: {
      actionKind: 'assignPzmXp',
      targetScope: 'player',
      amount: 250,
      xpCategory: 'combat',
    },
  })

  return {
    id: createAutomationId('graph'),
    name: 'PvP bounty',
    description: 'Grant a larger PvP payout and branch based on the killer, victim, or distance metadata.',
    isEnabled: true,
    nodes: [trigger, condition, bounty, badgeXp],
    edges: [
      createEdge(trigger.id, condition.id),
      createEdge(condition.id, bounty.id, { sourceHandle: 'true', label: 'true' }),
      createEdge(condition.id, badgeXp.id, { sourceHandle: 'true', label: 'true' }),
    ],
  }
}

export function createEmptyAutomationStudioDocument(): AutomationStudioDocument {
  return {
    version: automationStudioVersion,
    graphs: [],
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function asNumberOrNull(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

function asBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback
}

function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? value as T[] : []
}

function pickFromList<T extends string>(value: unknown, options: readonly T[], fallback: T): T {
  return typeof value === 'string' && options.includes(value as T) ? value as T : fallback
}

function normalizePredicate(value: unknown): AutomationPredicate {
  const record = asRecord(value)

  return createAutomationPredicate({
    id: asString(record.id, createAutomationId('check')),
    source: pickFromList(record.source, automationConditionSources, 'event'),
    path: asString(record.path, 'player.id'),
    operator: pickFromList(record.operator, automationConditionOperators, 'exists'),
    value: asString(record.value),
    valueType: pickFromList(record.valueType, automationValueTypes, 'string'),
  })
}

function normalizeTriggerNode(value: unknown): AutomationTriggerNode {
  const record = asRecord(value)
  const data = asRecord(record.data)

  return createAutomationTriggerNode({
    id: asString(record.id, createAutomationId('trigger')),
    label: asString(record.label, 'Trigger'),
    position: {
      x: asNumberOrNull(asRecord(record.position).x) ?? 80,
      y: asNumberOrNull(asRecord(record.position).y) ?? 120,
    },
    data: {
      eventKey: asString(data.eventKey, 'pz.item.found'),
      scope: pickFromList(data.scope, automationExecutionScopes, 'player'),
      dedupeKey: asString(data.dedupeKey),
      cooldownSeconds: asNumberOrNull(data.cooldownSeconds),
      filters: asArray(data.filters).map(normalizePredicate),
      notes: asString(data.notes),
    },
  })
}

function normalizeConditionNode(value: unknown): AutomationConditionNode {
  const record = asRecord(value)
  const data = asRecord(record.data)

  return createAutomationConditionNode({
    id: asString(record.id, createAutomationId('condition')),
    label: asString(record.label, 'Condition'),
    position: {
      x: asNumberOrNull(asRecord(record.position).x) ?? 360,
      y: asNumberOrNull(asRecord(record.position).y) ?? 120,
    },
    data: {
      combinator: pickFromList(data.combinator, automationConditionCombinators, 'all'),
      checks: asArray(data.checks).map(normalizePredicate),
      notes: asString(data.notes),
    },
  })
}

function normalizeActionNode(value: unknown): AutomationActionNode {
  const record = asRecord(value)
  const data = asRecord(record.data)

  return createAutomationActionNode({
    id: asString(record.id, createAutomationId('action')),
    label: asString(record.label, 'Action'),
    position: {
      x: asNumberOrNull(asRecord(record.position).x) ?? 640,
      y: asNumberOrNull(asRecord(record.position).y) ?? 120,
    },
    data: {
      actionKind: pickFromList(data.actionKind, automationActionKinds, 'assignCashReward'),
      targetScope: pickFromList(data.targetScope, automationExecutionScopes, 'player'),
      amount: asNumberOrNull(data.amount),
      itemId: asString(data.itemId),
      lootTableId: asString(data.lootTableId),
      quantity: asNumberOrNull(data.quantity),
      skillKey: asString(data.skillKey),
      xpCategory: asString(data.xpCategory),
      flagKey: asString(data.flagKey),
      notes: asString(data.notes),
    },
  })
}

function normalizeNode(value: unknown): AutomationStudioNode {
  const type = pickFromList(asRecord(value).type, automationNodeTypes, 'trigger')

  if (type === 'condition') {
    return normalizeConditionNode(value)
  }

  if (type === 'action') {
    return normalizeActionNode(value)
  }

  return normalizeTriggerNode(value)
}

function normalizeEdge(value: unknown): AutomationStudioEdge {
  const record = asRecord(value)

  return {
    id: asString(record.id, createAutomationId('edge')),
    source: asString(record.source),
    target: asString(record.target),
    sourceHandle: typeof record.sourceHandle === 'string' ? record.sourceHandle : null,
    targetHandle: typeof record.targetHandle === 'string' ? record.targetHandle : null,
    label: asString(record.label) || undefined,
    animated: asBoolean(record.animated),
  }
}

function normalizeGraph(value: unknown): AutomationStudioGraph {
  const record = asRecord(value)

  return {
    id: asString(record.id, createAutomationId('graph')),
    name: asString(record.name, 'Untitled rule graph'),
    description: asString(record.description),
    isEnabled: asBoolean(record.isEnabled, true),
    nodes: asArray(record.nodes).map(normalizeNode),
    edges: asArray(record.edges)
      .map(normalizeEdge)
      .filter(edge => edge.source && edge.target),
  }
}

export function normalizeAutomationStudioDocument(value: unknown): AutomationStudioDocument {
  const record = asRecord(value)

  return {
    version: automationStudioVersion,
    graphs: asArray(record.graphs).map(normalizeGraph),
  }
}

export function findAutomationEventOption(key: string): AutomationEventOption | undefined {
  return automationEventOptions.find(option => option.key === key)
}

export function findAutomationActionOption(key: AutomationActionKind): AutomationActionOption | undefined {
  return automationActionOptions.find(option => option.key === key)
}

export function findAutomationConditionSourceOption(key: AutomationConditionSource): AutomationConditionSourceOption | undefined {
  return automationConditionSourceOptions.find(option => option.key === key)
}