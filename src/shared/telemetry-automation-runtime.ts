import {
  automationConditionOperators,
  automationConditionSources,
  automationValueTypes,
  type AutomationConditionCombinator,
  type AutomationConditionOperator,
  type AutomationConditionSource,
  type AutomationExecutionScope,
  type AutomationValueType,
} from './telemetry-automation'

export const automationRuntimeCompiledSource = 'automation-studio' as const
export const automationRuntimeMetadataKey = '__automationCompiled' as const
export const automationRuntimePredicateKey = '__automationPredicate' as const
export const automationRuntimeFlagMutationKey = '__automationFlagMutation' as const
export const automationRuntimeItemGrantKey = '__automationItemGrant' as const
export const automationRuntimeInGameXpGrantKey = '__automationInGameXpGrant' as const

export interface AutomationRuntimeCompiledMetadata {
  source: typeof automationRuntimeCompiledSource
  graphId: string
  graphName: string
  triggerNodeId?: string
  actionNodeId?: string
  executionOrder?: number
}

export interface AutomationRuntimeFlagMutation {
  operation: 'set' | 'unset'
  targetScope: AutomationExecutionScope
  flagKey: string
}

export interface AutomationRuntimeItemGrant {
  itemId: string
  quantity: number
}

export interface AutomationRuntimeInGameXpGrant {
  skillKey: string
  amount: number
}

function normalizeRuntimeItemGrant(value: unknown): AutomationRuntimeItemGrant | null {
  const record = asRecord(value)
  const itemId = typeof record.itemId === 'string' ? record.itemId.trim() : ''
  const quantity = typeof record.quantity === 'number' && Number.isFinite(record.quantity)
    ? Math.max(1, Math.floor(record.quantity))
    : null

  if (!itemId || quantity == null) {
    return null
  }

  return {
    itemId,
    quantity,
  }
}

export interface AutomationRuntimePredicateCheck {
  kind: 'check'
  source: AutomationConditionSource
  path: string
  operator: AutomationConditionOperator
  value: string
  valueType: AutomationValueType
}

export interface AutomationRuntimePredicateGroup {
  kind: 'group'
  combinator: AutomationConditionCombinator
  children: AutomationRuntimePredicateNode[]
}

export interface AutomationRuntimePredicateNot {
  kind: 'not'
  child: AutomationRuntimePredicateNode
}

export type AutomationRuntimePredicateNode =
  | AutomationRuntimePredicateCheck
  | AutomationRuntimePredicateGroup
  | AutomationRuntimePredicateNot

export interface AutomationRuntimeState {
  flags?: Record<string, unknown>
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function cloneRecord(value: Record<string, unknown>): Record<string, unknown> {
  return Object.entries(value).reduce<Record<string, unknown>>((acc, [key, innerValue]) => {
    if (innerValue && typeof innerValue === 'object' && !Array.isArray(innerValue)) {
      acc[key] = cloneRecord(innerValue as Record<string, unknown>)
      return acc
    }

    acc[key] = innerValue
    return acc
  }, {})
}

function normalizePredicateNode(value: unknown): AutomationRuntimePredicateNode | null {
  const record = asRecord(value)
  const kind = record.kind

  if (kind === 'check') {
    const source = typeof record.source === 'string' && automationConditionSources.includes(record.source as AutomationConditionSource)
      ? record.source as AutomationConditionSource
      : null
    const operator = typeof record.operator === 'string' && automationConditionOperators.includes(record.operator as AutomationConditionOperator)
      ? record.operator as AutomationConditionOperator
      : null
    const valueType = typeof record.valueType === 'string' && automationValueTypes.includes(record.valueType as AutomationValueType)
      ? record.valueType as AutomationValueType
      : null

    if (!source || !operator || !valueType || typeof record.path !== 'string') {
      return null
    }

    return {
      kind: 'check',
      source,
      path: record.path,
      operator,
      value: typeof record.value === 'string' ? record.value : '',
      valueType,
    }
  }

  if (kind === 'group') {
    const combinator = record.combinator === 'any' ? 'any' : record.combinator === 'all' ? 'all' : null
    const children = Array.isArray(record.children)
      ? record.children.map(normalizePredicateNode).filter((child): child is AutomationRuntimePredicateNode => Boolean(child))
      : []

    if (!combinator || children.length === 0) {
      return null
    }

    return {
      kind: 'group',
      combinator,
      children,
    }
  }

  if (kind === 'not') {
    const child = normalizePredicateNode(record.child)
    if (!child) {
      return null
    }

    return {
      kind: 'not',
      child,
    }
  }

  return null
}

function getRuntimeMetadata(config: unknown): AutomationRuntimeCompiledMetadata | null {
  const metadata = asRecord(asRecord(config)[automationRuntimeMetadataKey])

  if (metadata.source !== automationRuntimeCompiledSource || typeof metadata.graphId !== 'string' || typeof metadata.graphName !== 'string') {
    return null
  }

  return {
    source: automationRuntimeCompiledSource,
    graphId: metadata.graphId,
    graphName: metadata.graphName,
    triggerNodeId: typeof metadata.triggerNodeId === 'string' ? metadata.triggerNodeId : undefined,
    actionNodeId: typeof metadata.actionNodeId === 'string' ? metadata.actionNodeId : undefined,
    executionOrder: typeof metadata.executionOrder === 'number' && Number.isFinite(metadata.executionOrder)
      ? metadata.executionOrder
      : undefined,
  }
}

export function getAutomationRuntimeMetadata(config: unknown): AutomationRuntimeCompiledMetadata | null {
  return getRuntimeMetadata(config)
}

export function isAutomationRuntimeGeneratedConfig(config: unknown): boolean {
  return Boolean(getRuntimeMetadata(config))
}

export function getAutomationRuntimeExecutionOrder(config: unknown): number | null {
  return getRuntimeMetadata(config)?.executionOrder ?? null
}

export function getAutomationRuntimePredicate(config: unknown): AutomationRuntimePredicateNode | null {
  return normalizePredicateNode(asRecord(config)[automationRuntimePredicateKey])
}

export function getAutomationRuntimeFlagMutation(config: unknown): AutomationRuntimeFlagMutation | null {
  const record = asRecord(asRecord(config)[automationRuntimeFlagMutationKey])
  const operation = record.operation === 'set' || record.operation === 'unset' ? record.operation : null
  const targetScope = record.targetScope === 'player' || record.targetScope === 'server' ? record.targetScope : null
  const flagKey = typeof record.flagKey === 'string' ? record.flagKey.trim() : ''

  if (!operation || !targetScope || !flagKey) {
    return null
  }

  return {
    operation,
    targetScope,
    flagKey,
  }
}

export function getAutomationRuntimeItemGrant(config: unknown): AutomationRuntimeItemGrant | null {
  return getAutomationRuntimeItemGrants(config)[0] ?? null
}

export function getAutomationRuntimeItemGrants(config: unknown): AutomationRuntimeItemGrant[] {
  const value = asRecord(config)[automationRuntimeItemGrantKey]

  if (Array.isArray(value)) {
    return value
      .map(normalizeRuntimeItemGrant)
      .filter((itemGrant): itemGrant is AutomationRuntimeItemGrant => Boolean(itemGrant))
  }

  const itemGrant = normalizeRuntimeItemGrant(value)
  return itemGrant ? [itemGrant] : []
}

export function getAutomationRuntimeInGameXpGrant(config: unknown): AutomationRuntimeInGameXpGrant | null {
  const record = asRecord(asRecord(config)[automationRuntimeInGameXpGrantKey])
  const skillKey = typeof record.skillKey === 'string' ? record.skillKey.trim() : ''
  const amount = typeof record.amount === 'number' && Number.isFinite(record.amount)
    ? Math.max(0, Math.floor(record.amount))
    : null

  if (!skillKey || amount == null || amount <= 0) {
    return null
  }

  return {
    skillKey,
    amount,
  }
}

export function getAutomationRuntimeFlags(value: unknown): Record<string, unknown> {
  return cloneRecord(asRecord(asRecord(value).flags))
}

export function buildAutomationRuntimeState(flags: Record<string, unknown>): AutomationRuntimeState | null {
  return Object.keys(flags).length > 0
    ? { flags: cloneRecord(flags) }
    : null
}

function cleanupNestedRecord(target: Record<string, unknown>, segments: string[], index: number): boolean {
  const segment = segments[index]
  if (!segment) {
    return Object.keys(target).length === 0
  }

  if (index === segments.length - 1) {
    delete target[segment]
    return Object.keys(target).length === 0
  }

  const child = asRecord(target[segment])
  const isEmpty = cleanupNestedRecord(child, segments, index + 1)
  if (isEmpty) {
    delete target[segment]
  } else {
    target[segment] = child
  }

  return Object.keys(target).length === 0
}

export function setAutomationRuntimeFlag(flags: Record<string, unknown>, path: string, value: boolean): Record<string, unknown> {
  const nextFlags = cloneRecord(flags)
  const segments = path.split('.').map(segment => segment.trim()).filter(Boolean)
  if (segments.length === 0) {
    return nextFlags
  }

  let cursor = nextFlags
  for (const segment of segments.slice(0, -1)) {
    const child = asRecord(cursor[segment])
    cursor[segment] = child
    cursor = child
  }

  cursor[segments[segments.length - 1] as string] = value
  return nextFlags
}

export function unsetAutomationRuntimeFlag(flags: Record<string, unknown>, path: string): Record<string, unknown> {
  const nextFlags = cloneRecord(flags)
  const segments = path.split('.').map(segment => segment.trim()).filter(Boolean)
  if (segments.length === 0) {
    return nextFlags
  }

  cleanupNestedRecord(nextFlags, segments, 0)
  return nextFlags
}

function mergeDeep(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  const next = cloneRecord(base)

  for (const [key, value] of Object.entries(override)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      next[key] = mergeDeep(asRecord(next[key]), value as Record<string, unknown>)
      continue
    }

    next[key] = value
  }

  return next
}

export function mergeAutomationRuntimeFlags(
  playerFlags: Record<string, unknown>,
  serverFlags: Record<string, unknown>,
): Record<string, unknown> {
  return {
    ...mergeDeep(serverFlags, playerFlags),
    player: cloneRecord(playerFlags),
    server: cloneRecord(serverFlags),
  }
}