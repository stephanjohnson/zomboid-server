export const automationStudioVersion = 1 as const
export const automationNodeDragMimeType = 'application/x-zomboid-automation-node-type' as const

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
export const automationServerSettingApplyModes = ['persist-only', 'restart-server'] as const
export const automationActionKinds = [
  'assignLoot',
  'assignInGameXp',
  'assignPzmXp',
  'assignCashReward',
  'setFlag',
  'unsetFlag',
  'updateServerSetting',
] as const
export const automationConditionCombinators = ['all', 'any'] as const
export const automationBlueprintKeys = ['blank-rule', 'first-pickup-bonus', 'zombie-kill-reward', 'pvp-bounty'] as const
export const automationTriggerNodeTypes = [
  'trigger-item-found',
  'trigger-zombie-kill',
  'trigger-pvp-kill',
  'trigger-skill-level-up',
  'trigger-build-action',
  'trigger-player-died',
  'trigger-session-started',
  'trigger-session-ended',
] as const
export const automationActionNodeTypes = [
  'action-assign-loot',
  'action-assign-ingame-xp',
  'action-assign-pzm-xp',
  'action-assign-cash',
  'action-set-flag',
  'action-unset-flag',
  'action-update-server-setting',
] as const
export const automationNodeTypes = [...automationTriggerNodeTypes, 'condition', ...automationActionNodeTypes] as const

export type AutomationExecutionScope = (typeof automationExecutionScopes)[number]
export type AutomationConditionSource = (typeof automationConditionSources)[number]
export type AutomationConditionOperator = (typeof automationConditionOperators)[number]
export type AutomationValueType = (typeof automationValueTypes)[number]
export type AutomationServerSettingApplyMode = (typeof automationServerSettingApplyModes)[number]
export type AutomationActionKind = (typeof automationActionKinds)[number]
export type AutomationConditionCombinator = (typeof automationConditionCombinators)[number]
export type AutomationBlueprintKey = (typeof automationBlueprintKeys)[number]
export type AutomationTriggerNodeType = (typeof automationTriggerNodeTypes)[number]
export type AutomationActionNodeType = (typeof automationActionNodeTypes)[number]
export type AutomationNodeType = (typeof automationNodeTypes)[number]
export type AutomationNodeKind = 'trigger' | 'condition' | 'action'
export type AutomationPaletteSectionKey = 'triggers' | 'logic' | 'actions'

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

interface AutomationActionNodeDataBase {
  notes: string
}

interface AutomationScopedActionNodeData extends AutomationActionNodeDataBase {
  targetScope: AutomationExecutionScope
}

export interface AutomationAssignLootActionNodeData extends AutomationScopedActionNodeData {
  itemId: string
  lootTableId: string
  quantity: number | null
}

export interface AutomationAssignInGameXpActionNodeData extends AutomationScopedActionNodeData {
  amount: number | null
  skillKey: string
}

export interface AutomationAssignPzmXpActionNodeData extends AutomationScopedActionNodeData {
  amount: number | null
  xpCategory: string
}

export interface AutomationAssignCashRewardActionNodeData extends AutomationScopedActionNodeData {
  amount: number | null
}

export interface AutomationSetFlagActionNodeData extends AutomationScopedActionNodeData {
  flagKey: string
}

export interface AutomationUnsetFlagActionNodeData extends AutomationScopedActionNodeData {
  flagKey: string
}

export interface AutomationUpdateServerSettingActionNodeData extends AutomationActionNodeDataBase {
  settingKey: string
  settingValue: string
  valueType: AutomationValueType
  applyMode: AutomationServerSettingApplyMode
}

interface AutomationNodeBase<TType extends AutomationNodeType, TData> {
  id: string
  type: TType
  label: string
  position: AutomationCanvasPosition
  data: TData
}

export type AutomationTriggerNode = AutomationNodeBase<AutomationTriggerNodeType, AutomationTriggerNodeData>
export type AutomationConditionNode = AutomationNodeBase<'condition', AutomationConditionNodeData>
export type AutomationAssignLootActionNode = AutomationNodeBase<'action-assign-loot', AutomationAssignLootActionNodeData>
export type AutomationAssignInGameXpActionNode = AutomationNodeBase<'action-assign-ingame-xp', AutomationAssignInGameXpActionNodeData>
export type AutomationAssignPzmXpActionNode = AutomationNodeBase<'action-assign-pzm-xp', AutomationAssignPzmXpActionNodeData>
export type AutomationAssignCashRewardActionNode = AutomationNodeBase<'action-assign-cash', AutomationAssignCashRewardActionNodeData>
export type AutomationSetFlagActionNode = AutomationNodeBase<'action-set-flag', AutomationSetFlagActionNodeData>
export type AutomationUnsetFlagActionNode = AutomationNodeBase<'action-unset-flag', AutomationUnsetFlagActionNodeData>
export type AutomationUpdateServerSettingActionNode = AutomationNodeBase<'action-update-server-setting', AutomationUpdateServerSettingActionNodeData>
export type AutomationActionNode =
  | AutomationAssignLootActionNode
  | AutomationAssignInGameXpActionNode
  | AutomationAssignPzmXpActionNode
  | AutomationAssignCashRewardActionNode
  | AutomationSetFlagActionNode
  | AutomationUnsetFlagActionNode
  | AutomationUpdateServerSettingActionNode
export type AutomationStudioNode = AutomationTriggerNode | AutomationConditionNode | AutomationActionNode
export type AutomationNodeByType<TType extends AutomationNodeType> = Extract<AutomationStudioNode, { type: TType }>
export type AutomationNodeOverrides<TType extends AutomationNodeType> = Partial<Omit<AutomationNodeByType<TType>, 'type' | 'data'>> & {
  data?: Partial<AutomationNodeByType<TType>['data']>
}

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

export interface AutomationNodeCatalogItem {
  type: AutomationNodeType
  kind: AutomationNodeKind
  category: AutomationPaletteSectionKey
  title: string
  description: string
  badge: string
}

export interface AutomationPaletteSection {
  key: AutomationPaletteSectionKey
  title: string
  description: string
  items: AutomationNodeCatalogItem[]
}

export interface AutomationNodeCreateRequest {
  type: AutomationNodeType
  position?: AutomationCanvasPosition
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
  {
    key: 'updateServerSetting',
    label: 'Update Server Setting',
    description: 'Persist a server.ini value change and optionally apply it with a restart.',
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

const triggerNodeTypeByEventKey: Record<string, AutomationTriggerNodeType> = {
  'pz.item.found': 'trigger-item-found',
  'pz.zombie.kill': 'trigger-zombie-kill',
  'pz.pvp.kill': 'trigger-pvp-kill',
  'pz.skill.level_up': 'trigger-skill-level-up',
  'pz.build.action': 'trigger-build-action',
  'pz.player.died': 'trigger-player-died',
  'pz.session.started': 'trigger-session-started',
  'pz.session.ended': 'trigger-session-ended',
}

const eventKeyByTriggerNodeType: Record<AutomationTriggerNodeType, string> = {
  'trigger-item-found': 'pz.item.found',
  'trigger-zombie-kill': 'pz.zombie.kill',
  'trigger-pvp-kill': 'pz.pvp.kill',
  'trigger-skill-level-up': 'pz.skill.level_up',
  'trigger-build-action': 'pz.build.action',
  'trigger-player-died': 'pz.player.died',
  'trigger-session-started': 'pz.session.started',
  'trigger-session-ended': 'pz.session.ended',
}

const actionNodeTypeByActionKind: Record<AutomationActionKind, AutomationActionNodeType> = {
  assignLoot: 'action-assign-loot',
  assignInGameXp: 'action-assign-ingame-xp',
  assignPzmXp: 'action-assign-pzm-xp',
  assignCashReward: 'action-assign-cash',
  setFlag: 'action-set-flag',
  unsetFlag: 'action-unset-flag',
  updateServerSetting: 'action-update-server-setting',
}

const actionKindByActionNodeType: Record<AutomationActionNodeType, AutomationActionKind> = {
  'action-assign-loot': 'assignLoot',
  'action-assign-ingame-xp': 'assignInGameXp',
  'action-assign-pzm-xp': 'assignPzmXp',
  'action-assign-cash': 'assignCashReward',
  'action-set-flag': 'setFlag',
  'action-unset-flag': 'unsetFlag',
  'action-update-server-setting': 'updateServerSetting',
}

const actionBadgeByKind: Record<AutomationActionKind, string> = {
  assignLoot: 'loot',
  assignInGameXp: 'vanilla xp',
  assignPzmXp: 'pzm xp',
  assignCashReward: 'wallet',
  setFlag: 'flag',
  unsetFlag: 'flag',
  updateServerSetting: 'server',
}

function createAutomationId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`
}

function defaultNodePosition(type: AutomationNodeType): AutomationCanvasPosition {
  const kind = getAutomationNodeKind(type)

  if (kind === 'trigger') {
    return { x: 80, y: 120 }
  }

  if (kind === 'condition') {
    return { x: 360, y: 120 }
  }

  return { x: 640, y: 120 }
}

function defaultNodeLabel(type: AutomationNodeType): string {
  return findAutomationNodeCatalogItem(type)?.title ?? 'Rule node'
}

function createTriggerData(overrides: Partial<AutomationTriggerNodeData> = {}): AutomationTriggerNodeData {
  return {
    dedupeKey: overrides.dedupeKey ?? '',
    cooldownSeconds: overrides.cooldownSeconds ?? null,
    filters: overrides.filters?.map(filter => createAutomationPredicate(filter)) ?? [],
    notes: overrides.notes ?? '',
  }
}

function createConditionData(overrides: Partial<AutomationConditionNodeData> = {}): AutomationConditionNodeData {
  return {
    combinator: overrides.combinator ?? 'all',
    checks: overrides.checks?.map(check => createAutomationPredicate(check)) ?? [createAutomationPredicate()],
    notes: overrides.notes ?? '',
  }
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

export function getAutomationNodeKind(type: AutomationNodeType): AutomationNodeKind {
  if (automationTriggerNodeTypes.includes(type as AutomationTriggerNodeType)) {
    return 'trigger'
  }

  if (automationActionNodeTypes.includes(type as AutomationActionNodeType)) {
    return 'action'
  }

  return 'condition'
}

export function findAutomationEventOption(key: string): AutomationEventOption | undefined {
  return automationEventOptions.find(option => option.key === key)
}

export function resolveAutomationTriggerNodeType(eventKey: string): AutomationTriggerNodeType {
  return triggerNodeTypeByEventKey[eventKey] ?? 'trigger-item-found'
}

export function getAutomationTriggerEventKey(type: AutomationTriggerNodeType): string {
  return eventKeyByTriggerNodeType[type]
}

export function findAutomationTriggerEventOption(type: AutomationTriggerNodeType): AutomationEventOption | undefined {
  return findAutomationEventOption(getAutomationTriggerEventKey(type))
}

export function findAutomationActionOption(key: AutomationActionKind): AutomationActionOption | undefined {
  return automationActionOptions.find(option => option.key === key)
}

export function resolveAutomationActionNodeType(actionKind: AutomationActionKind | string): AutomationActionNodeType {
  return actionNodeTypeByActionKind[actionKind as AutomationActionKind] ?? 'action-assign-cash'
}

export function getAutomationActionKind(type: AutomationActionNodeType): AutomationActionKind {
  return actionKindByActionNodeType[type]
}

export function findAutomationActionOptionForNodeType(type: AutomationActionNodeType): AutomationActionOption | undefined {
  return findAutomationActionOption(getAutomationActionKind(type))
}

export function findAutomationConditionSourceOption(key: AutomationConditionSource): AutomationConditionSourceOption | undefined {
  return automationConditionSourceOptions.find(option => option.key === key)
}

const automationNodeCatalogEntries: AutomationNodeCatalogItem[] = [
  ...automationTriggerNodeTypes.map((type) => {
    const eventOption = findAutomationTriggerEventOption(type)

    return {
      type,
      kind: 'trigger' as const,
      category: 'triggers' as const,
      title: eventOption?.label ?? 'Trigger',
      description: eventOption?.description ?? 'Start a workflow when this telemetry event arrives.',
      badge: eventOption?.scope ?? 'player',
    }
  }),
  {
    type: 'condition',
    kind: 'condition',
    category: 'logic',
    title: 'Condition Branch',
    description: 'Evaluate one or more checks and split the path into true and false outcomes.',
    badge: 'logic',
  },
  ...automationActionNodeTypes.map((type) => {
    const actionOption = findAutomationActionOptionForNodeType(type)
    const actionKind = getAutomationActionKind(type)

    return {
      type,
      kind: 'action' as const,
      category: 'actions' as const,
      title: actionOption?.label ?? 'Action',
      description: actionOption?.description ?? 'Execute a reward or state change.',
      badge: actionBadgeByKind[actionKind],
    }
  }),
]

export const automationNodeCatalog: ReadonlyArray<AutomationNodeCatalogItem> = automationNodeCatalogEntries

export const automationPaletteSections: ReadonlyArray<AutomationPaletteSection> = [
  {
    key: 'triggers',
    title: 'Triggers',
    description: 'Pick the exact game event that should start a workflow path.',
    items: automationNodeCatalogEntries.filter(item => item.category === 'triggers'),
  },
  {
    key: 'logic',
    title: 'Logic',
    description: 'Branch on flags, stats, or payload checks before rewards execute.',
    items: automationNodeCatalogEntries.filter(item => item.category === 'logic'),
  },
  {
    key: 'actions',
    title: 'Actions',
    description: 'Grant rewards, mutate flags, or update live server state.',
    items: automationNodeCatalogEntries.filter(item => item.category === 'actions'),
  },
]

export function findAutomationNodeCatalogItem(type: AutomationNodeType): AutomationNodeCatalogItem | undefined {
  return automationNodeCatalogEntries.find(item => item.type === type)
}

export function createAutomationNode<TType extends AutomationNodeType>(
  type: TType,
  overrides: AutomationNodeOverrides<TType> = {},
): AutomationNodeByType<TType> {
  const base = overrides as AutomationNodeOverrides<AutomationNodeType>
  const position = base.position ?? defaultNodePosition(type)
  const label = base.label ?? defaultNodeLabel(type)

  if (type === 'condition') {
    const conditionOverrides = overrides as AutomationNodeOverrides<'condition'>

    return {
      id: conditionOverrides.id ?? createAutomationId('condition'),
      type,
      label,
      position,
      data: createConditionData(conditionOverrides.data),
    } as AutomationNodeByType<TType>
  }

  if (automationTriggerNodeTypes.includes(type as AutomationTriggerNodeType)) {
    const triggerOverrides = overrides as AutomationNodeOverrides<AutomationTriggerNodeType>

    return {
      id: triggerOverrides.id ?? createAutomationId(type),
      type,
      label,
      position,
      data: createTriggerData(triggerOverrides.data),
    } as AutomationNodeByType<TType>
  }

  const actionOverrides = overrides as AutomationNodeOverrides<AutomationActionNodeType>

  if (type === 'action-assign-loot') {
    const actionData = actionOverrides.data as Partial<AutomationAssignLootActionNodeData> | undefined

    return {
      id: actionOverrides.id ?? createAutomationId(type),
      type,
      label,
      position,
      data: {
        targetScope: actionData?.targetScope ?? 'player',
        itemId: actionData?.itemId ?? '',
        lootTableId: actionData?.lootTableId ?? '',
        quantity: actionData?.quantity ?? 1,
        notes: actionData?.notes ?? '',
      },
    } as AutomationNodeByType<TType>
  }

  if (type === 'action-assign-ingame-xp') {
    const actionData = actionOverrides.data as Partial<AutomationAssignInGameXpActionNodeData> | undefined

    return {
      id: actionOverrides.id ?? createAutomationId(type),
      type,
      label,
      position,
      data: {
        targetScope: actionData?.targetScope ?? 'player',
        amount: actionData?.amount ?? 100,
        skillKey: actionData?.skillKey ?? '',
        notes: actionData?.notes ?? '',
      },
    } as AutomationNodeByType<TType>
  }

  if (type === 'action-assign-pzm-xp') {
    const actionData = actionOverrides.data as Partial<AutomationAssignPzmXpActionNodeData> | undefined

    return {
      id: actionOverrides.id ?? createAutomationId(type),
      type,
      label,
      position,
      data: {
        targetScope: actionData?.targetScope ?? 'player',
        amount: actionData?.amount ?? 100,
        xpCategory: actionData?.xpCategory ?? '',
        notes: actionData?.notes ?? '',
      },
    } as AutomationNodeByType<TType>
  }

  if (type === 'action-set-flag') {
    const actionData = actionOverrides.data as Partial<AutomationSetFlagActionNodeData> | undefined

    return {
      id: actionOverrides.id ?? createAutomationId(type),
      type,
      label,
      position,
      data: {
        targetScope: actionData?.targetScope ?? 'player',
        flagKey: actionData?.flagKey ?? '',
        notes: actionData?.notes ?? '',
      },
    } as AutomationNodeByType<TType>
  }

  if (type === 'action-unset-flag') {
    const actionData = actionOverrides.data as Partial<AutomationUnsetFlagActionNodeData> | undefined

    return {
      id: actionOverrides.id ?? createAutomationId(type),
      type,
      label,
      position,
      data: {
        targetScope: actionData?.targetScope ?? 'player',
        flagKey: actionData?.flagKey ?? '',
        notes: actionData?.notes ?? '',
      },
    } as AutomationNodeByType<TType>
  }

  if (type === 'action-update-server-setting') {
    const actionData = actionOverrides.data as Partial<AutomationUpdateServerSettingActionNodeData> | undefined

    return {
      id: actionOverrides.id ?? createAutomationId(type),
      type,
      label,
      position,
      data: {
        settingKey: actionData?.settingKey ?? 'PVP',
        settingValue: actionData?.settingValue ?? 'true',
        valueType: actionData?.valueType ?? 'boolean',
        applyMode: actionData?.applyMode ?? 'restart-server',
        notes: actionData?.notes ?? '',
      },
    } as AutomationNodeByType<TType>
  }

  const actionData = actionOverrides.data as Partial<AutomationAssignCashRewardActionNodeData> | undefined

  return {
    id: actionOverrides.id ?? createAutomationId(type),
    type,
    label,
    position,
    data: {
      targetScope: actionData?.targetScope ?? 'player',
      amount: actionData?.amount ?? 100,
      notes: actionData?.notes ?? '',
    },
  } as AutomationNodeByType<TType>
}

export function createAutomationTriggerNode<TType extends AutomationTriggerNodeType>(
  type: TType,
  overrides: AutomationNodeOverrides<TType> = {},
): AutomationNodeByType<TType> {
  return createAutomationNode(type, overrides)
}

export function createAutomationConditionNode(
  overrides: AutomationNodeOverrides<'condition'> = {},
): AutomationConditionNode {
  return createAutomationNode('condition', overrides)
}

export function createAutomationActionNode<TType extends AutomationActionNodeType>(
  type: TType,
  overrides: AutomationNodeOverrides<TType> = {},
): AutomationNodeByType<TType> {
  return createAutomationNode(type, overrides)
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
  const trigger = createAutomationTriggerNode('trigger-item-found', {
    label: 'Item pickup',
    data: {
      filters: [createAutomationPredicate({ source: 'item', path: 'fullType', operator: 'equals', value: 'Base.Axe' })],
      notes: 'Swap this item filter with the event payload you want to react to.',
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
  const action = createAutomationActionNode('action-assign-cash', {
    label: 'Reward player',
    data: {
      targetScope: 'player',
      amount: 250,
      notes: 'Replace this with loot, in-game XP, PZM XP, cash, flags, or a server-setting update.',
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
    const trigger = createAutomationTriggerNode('trigger-item-found', {
      label: 'First axe pickup',
      position: { x: 80, y: 160 },
      data: {
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
    const reward = createAutomationActionNode('action-assign-cash', {
      label: 'Grant credits',
      position: { x: 660, y: 90 },
      data: {
        targetScope: 'player',
        amount: 250,
        notes: 'Replace with cash, PZM XP, or a loot payout.',
      },
    })
    const flag = createAutomationActionNode('action-set-flag', {
      label: 'Set player flag',
      position: { x: 660, y: 240 },
      data: {
        targetScope: 'player',
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
    const trigger = createAutomationTriggerNode('trigger-zombie-kill', {
      label: 'Zombie kill',
      position: { x: 80, y: 160 },
      data: {
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
    const cash = createAutomationActionNode('action-assign-cash', {
      label: 'Grant credits',
      position: { x: 660, y: 90 },
      data: {
        targetScope: 'player',
        amount: 50,
      },
    })
    const xp = createAutomationActionNode('action-assign-pzm-xp', {
      label: 'Grant PZM XP',
      position: { x: 660, y: 240 },
      data: {
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

  const trigger = createAutomationTriggerNode('trigger-pvp-kill', {
    label: 'PvP kill',
    position: { x: 80, y: 160 },
    data: {
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
  const bounty = createAutomationActionNode('action-assign-cash', {
    label: 'Pay bounty',
    position: { x: 660, y: 90 },
    data: {
      targetScope: 'player',
      amount: 1000,
    },
  })
  const badgeXp = createAutomationActionNode('action-assign-pzm-xp', {
    label: 'Grant combat XP',
    position: { x: 660, y: 240 },
    data: {
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

function normalizeTriggerNode(type: AutomationTriggerNodeType, value: unknown): AutomationTriggerNode {
  const record = asRecord(value)
  const data = asRecord(record.data)
  const defaultPosition = defaultNodePosition(type)

  return createAutomationTriggerNode(type, {
    id: asString(record.id, createAutomationId(type)),
    label: asString(record.label, defaultNodeLabel(type)),
    position: {
      x: asNumberOrNull(asRecord(record.position).x) ?? defaultPosition.x,
      y: asNumberOrNull(asRecord(record.position).y) ?? defaultPosition.y,
    },
    data: {
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
  const defaultPosition = defaultNodePosition('condition')

  return createAutomationConditionNode({
    id: asString(record.id, createAutomationId('condition')),
    label: asString(record.label, defaultNodeLabel('condition')),
    position: {
      x: asNumberOrNull(asRecord(record.position).x) ?? defaultPosition.x,
      y: asNumberOrNull(asRecord(record.position).y) ?? defaultPosition.y,
    },
    data: {
      combinator: pickFromList(data.combinator, automationConditionCombinators, 'all'),
      checks: asArray(data.checks).map(normalizePredicate),
      notes: asString(data.notes),
    },
  })
}

function normalizeActionNode(type: AutomationActionNodeType, value: unknown): AutomationActionNode {
  const record = asRecord(value)
  const data = asRecord(record.data)
  const defaultPosition = defaultNodePosition(type)
  const position = {
    x: asNumberOrNull(asRecord(record.position).x) ?? defaultPosition.x,
    y: asNumberOrNull(asRecord(record.position).y) ?? defaultPosition.y,
  }
  const label = asString(record.label, defaultNodeLabel(type))

  if (type === 'action-assign-loot') {
    return createAutomationActionNode(type, {
      id: asString(record.id, createAutomationId(type)),
      label,
      position,
      data: {
        targetScope: pickFromList(data.targetScope, automationExecutionScopes, 'player'),
        itemId: asString(data.itemId),
        lootTableId: asString(data.lootTableId),
        quantity: asNumberOrNull(data.quantity),
        notes: asString(data.notes),
      },
    })
  }

  if (type === 'action-assign-ingame-xp') {
    return createAutomationActionNode(type, {
      id: asString(record.id, createAutomationId(type)),
      label,
      position,
      data: {
        targetScope: pickFromList(data.targetScope, automationExecutionScopes, 'player'),
        amount: asNumberOrNull(data.amount),
        skillKey: asString(data.skillKey),
        notes: asString(data.notes),
      },
    })
  }

  if (type === 'action-assign-pzm-xp') {
    return createAutomationActionNode(type, {
      id: asString(record.id, createAutomationId(type)),
      label,
      position,
      data: {
        targetScope: pickFromList(data.targetScope, automationExecutionScopes, 'player'),
        amount: asNumberOrNull(data.amount),
        xpCategory: asString(data.xpCategory),
        notes: asString(data.notes),
      },
    })
  }

  if (type === 'action-set-flag') {
    return createAutomationActionNode(type, {
      id: asString(record.id, createAutomationId(type)),
      label,
      position,
      data: {
        targetScope: pickFromList(data.targetScope, automationExecutionScopes, 'player'),
        flagKey: asString(data.flagKey),
        notes: asString(data.notes),
      },
    })
  }

  if (type === 'action-unset-flag') {
    return createAutomationActionNode(type, {
      id: asString(record.id, createAutomationId(type)),
      label,
      position,
      data: {
        targetScope: pickFromList(data.targetScope, automationExecutionScopes, 'player'),
        flagKey: asString(data.flagKey),
        notes: asString(data.notes),
      },
    })
  }

  if (type === 'action-update-server-setting') {
    return createAutomationActionNode(type, {
      id: asString(record.id, createAutomationId(type)),
      label,
      position,
      data: {
        settingKey: asString(data.settingKey, 'PVP'),
        settingValue: asString(data.settingValue, 'true'),
        valueType: pickFromList(data.valueType, automationValueTypes, 'boolean'),
        applyMode: pickFromList(data.applyMode, automationServerSettingApplyModes, 'restart-server'),
        notes: asString(data.notes),
      },
    })
  }

  return createAutomationActionNode(type, {
    id: asString(record.id, createAutomationId(type)),
    label,
    position,
    data: {
      targetScope: pickFromList(data.targetScope, automationExecutionScopes, 'player'),
      amount: asNumberOrNull(data.amount),
      notes: asString(data.notes),
    },
  })
}

function normalizeLegacyTriggerNode(value: unknown): AutomationTriggerNode {
  const data = asRecord(asRecord(value).data)
  return normalizeTriggerNode(resolveAutomationTriggerNodeType(asString(data.eventKey, 'pz.item.found')), value)
}

function normalizeLegacyActionNode(value: unknown): AutomationActionNode {
  const data = asRecord(asRecord(value).data)
  const actionKind = pickFromList(data.actionKind, automationActionKinds, 'assignCashReward')
  return normalizeActionNode(resolveAutomationActionNodeType(actionKind), value)
}

function normalizeNode(value: unknown): AutomationStudioNode {
  const rawType = asString(asRecord(value).type)

  if (rawType === 'condition') {
    return normalizeConditionNode(value)
  }

  if (rawType === 'trigger') {
    return normalizeLegacyTriggerNode(value)
  }

  if (rawType === 'action') {
    return normalizeLegacyActionNode(value)
  }

  if (automationTriggerNodeTypes.includes(rawType as AutomationTriggerNodeType)) {
    return normalizeTriggerNode(rawType as AutomationTriggerNodeType, value)
  }

  if (automationActionNodeTypes.includes(rawType as AutomationActionNodeType)) {
    return normalizeActionNode(rawType as AutomationActionNodeType, value)
  }

  return normalizeTriggerNode('trigger-item-found', value)
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
