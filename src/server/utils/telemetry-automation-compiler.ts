import {
  getAutomationNodeKind,
  getAutomationTriggerEventKey,
  normalizeAutomationStudioDocument,
  type AutomationActionNode,
  type AutomationConditionNode,
  type AutomationPredicate,
  type AutomationStudioDocument,
  type AutomationStudioEdge,
  type AutomationStudioGraph,
  type AutomationStudioNode,
  type AutomationTriggerNode,
  type AutomationValueType,
} from '../../shared/telemetry-automation'
import {
  automationRuntimeCompiledSource,
  automationRuntimeFlagMutationKey,
  automationRuntimeInGameXpGrantKey,
  automationRuntimeItemGrantKey,
  automationRuntimeMetadataKey,
  automationRuntimePredicateKey,
  type AutomationRuntimeFlagMutation,
  type AutomationRuntimeInGameXpGrant,
  type AutomationRuntimeItemGrant,
  type AutomationRuntimePredicateNode,
} from '../../shared/telemetry-automation-runtime'

export interface CompiledAutomationWorkflowStep {
  stepOrder: number
  eventKey: string
  withinSeconds: number | null
  matchConfig?: Record<string, unknown>
}

export interface CompiledAutomationWorkflow {
  key: string
  name: string
  isEnabled: boolean
  config: Record<string, unknown>
  steps: CompiledAutomationWorkflowStep[]
}

export interface CompiledAutomationActionRule {
  name: string
  triggerKind: 'WORKFLOW'
  triggerKey: string
  isEnabled: boolean
  moneyAmount: number
  xpAmount: number
  xpCategory: string | null
  xpCategoryAmount: number
  config?: Record<string, unknown>
}

export interface CompiledAutomationDocument {
  workflows: CompiledAutomationWorkflow[]
  actionRules: CompiledAutomationActionRule[]
}

export interface ResolvedAutomationNamedLootTable {
  id: string
  name: string
  slug: string
  items: AutomationRuntimeItemGrant[]
}

export interface CompileAutomationStudioDocumentOptions {
  resolveNamedLootTable?: (lootTableId: string) => Promise<ResolvedAutomationNamedLootTable | null>
}

interface GraphTraversalState {
  predicate: AutomationRuntimePredicateNode | null
  depth: number
  visited: Set<string>
}

interface RecordedAction {
  node: AutomationActionNode
  predicate: AutomationRuntimePredicateNode | null
  executionOrder: number
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function assertGraph(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message)
  }
}

function normalizeNumberValue(value: string, graph: AutomationStudioGraph, action: AutomationActionNode, label: string): number {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    throw new Error(`${graph.name}: ${action.label} has an invalid ${label} value.`)
  }

  return parsed
}

function parseTypedValue(value: string, valueType: AutomationValueType, graph: AutomationStudioGraph, action: AutomationActionNode): string | number | boolean {
  if (valueType === 'number') {
    return normalizeNumberValue(value, graph, action, 'number')
  }

  if (valueType === 'boolean') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'true') {
      return true
    }

    if (normalized === 'false') {
      return false
    }

    throw new Error(`${graph.name}: ${action.label} must use "true" or "false" for boolean server settings.`)
  }

  return value
}

function buildPredicateCheck(check: AutomationPredicate, graph: AutomationStudioGraph, nodeLabel: string): AutomationRuntimePredicateNode {
  const path = check.path.trim()
  assertGraph(path.length > 0, `${graph.name}: ${nodeLabel} includes a check with an empty path.`)

  const needsValue = !['exists', 'notExists', 'isTrue', 'isFalse'].includes(check.operator)
  if (needsValue) {
    assertGraph(check.value.trim().length > 0, `${graph.name}: ${nodeLabel} includes a check with no comparison value.`)
  }

  return {
    kind: 'check',
    source: check.source,
    path,
    operator: check.operator,
    value: check.value,
    valueType: check.valueType,
  }
}

function buildPredicateGroup(
  graph: AutomationStudioGraph,
  nodeLabel: string,
  combinator: 'all' | 'any',
  checks: AutomationPredicate[],
): AutomationRuntimePredicateNode {
  const children = checks.map(check => buildPredicateCheck(check, graph, nodeLabel))
  assertGraph(children.length > 0, `${graph.name}: ${nodeLabel} needs at least one check.`)

  return {
    kind: 'group',
    combinator,
    children,
  }
}

function combinePredicate(
  left: AutomationRuntimePredicateNode | null,
  right: AutomationRuntimePredicateNode | null,
): AutomationRuntimePredicateNode | null {
  if (!left) {
    return right
  }

  if (!right) {
    return left
  }

  return {
    kind: 'group',
    combinator: 'all',
    children: [left, right],
  }
}

function workflowKeyForTrigger(graph: AutomationStudioGraph, trigger: AutomationTriggerNode): string {
  return `automation.graph.${graph.id}.trigger.${trigger.id}`
}

function makeCompiledMetadata(
  graph: AutomationStudioGraph,
  triggerNodeId: string,
  actionNodeId?: string,
  executionOrder?: number,
): Record<string, unknown> {
  return {
    [automationRuntimeMetadataKey]: {
      source: automationRuntimeCompiledSource,
      graphId: graph.id,
      graphName: graph.name,
      triggerNodeId,
      actionNodeId,
      executionOrder,
    },
  }
}

function normalizeEdgeOrder(edge: AutomationStudioEdge): number {
  if (edge.sourceHandle === 'true') {
    return 0
  }

  if (edge.sourceHandle === 'false') {
    return 1
  }

  return 2
}

function scaleItemGrants(itemGrants: AutomationRuntimeItemGrant[], multiplier: number): AutomationRuntimeItemGrant[] {
  const totals = new Map<string, number>()

  for (const itemGrant of itemGrants) {
    const itemId = itemGrant.itemId.trim()
    if (!itemId) {
      continue
    }

    const quantity = Math.max(1, Math.floor(itemGrant.quantity)) * Math.max(1, multiplier)
    totals.set(itemId, (totals.get(itemId) ?? 0) + quantity)
  }

  return [...totals.entries()].map(([itemId, quantity]) => ({
    itemId,
    quantity,
  }))
}

async function compileActionNode(
  graph: AutomationStudioGraph,
  trigger: AutomationTriggerNode,
  action: AutomationActionNode,
  predicate: AutomationRuntimePredicateNode | null,
  executionOrder: number,
  options: CompileAutomationStudioDocumentOptions,
): Promise<CompiledAutomationActionRule> {
  const baseConfig: Record<string, unknown> = {
    ...makeCompiledMetadata(graph, trigger.id, action.id, executionOrder),
  }

  if (predicate) {
    baseConfig[automationRuntimePredicateKey] = predicate
  }

  if (action.type === 'action-assign-cash') {
    assertGraph(action.data.targetScope === 'player', `${graph.name}: ${action.label} can only target a player.`)

    return {
      name: `${graph.name}: ${action.label}`,
      triggerKind: 'WORKFLOW',
      triggerKey: workflowKeyForTrigger(graph, trigger),
      isEnabled: graph.isEnabled,
      moneyAmount: Math.max(0, action.data.amount ?? 0),
      xpAmount: 0,
      xpCategory: null,
      xpCategoryAmount: 0,
      config: Object.keys(baseConfig).length > 0 ? baseConfig : undefined,
    }
  }

  if (action.type === 'action-assign-pzm-xp') {
    assertGraph(action.data.targetScope === 'player', `${graph.name}: ${action.label} can only target a player.`)

    return {
      name: `${graph.name}: ${action.label}`,
      triggerKind: 'WORKFLOW',
      triggerKey: workflowKeyForTrigger(graph, trigger),
      isEnabled: graph.isEnabled,
      moneyAmount: 0,
      xpAmount: action.data.xpCategory.trim() ? 0 : Math.max(0, action.data.amount ?? 0),
      xpCategory: action.data.xpCategory.trim() || null,
      xpCategoryAmount: action.data.xpCategory.trim() ? Math.max(0, action.data.amount ?? 0) : 0,
      config: Object.keys(baseConfig).length > 0 ? baseConfig : undefined,
    }
  }

  if (action.type === 'action-set-flag' || action.type === 'action-unset-flag') {
    const flagKey = action.data.flagKey.trim()
    assertGraph(flagKey.length > 0, `${graph.name}: ${action.label} needs a flag key.`)

    const mutation: AutomationRuntimeFlagMutation = {
      operation: action.type === 'action-set-flag' ? 'set' : 'unset',
      targetScope: action.data.targetScope,
      flagKey,
    }

    return {
      name: `${graph.name}: ${action.label}`,
      triggerKind: 'WORKFLOW',
      triggerKey: workflowKeyForTrigger(graph, trigger),
      isEnabled: graph.isEnabled,
      moneyAmount: 0,
      xpAmount: 0,
      xpCategory: null,
      xpCategoryAmount: 0,
      config: {
        ...baseConfig,
        [automationRuntimeFlagMutationKey]: mutation,
      },
    }
  }

  if (action.type === 'action-update-server-setting') {
    const settingKey = action.data.settingKey.trim()
    assertGraph(settingKey.length > 0, `${graph.name}: ${action.label} needs a server setting key.`)

    return {
      name: `${graph.name}: ${action.label}`,
      triggerKind: 'WORKFLOW',
      triggerKey: workflowKeyForTrigger(graph, trigger),
      isEnabled: graph.isEnabled,
      moneyAmount: 0,
      xpAmount: 0,
      xpCategory: null,
      xpCategoryAmount: 0,
      config: {
        ...baseConfig,
        serverSettings: {
          [settingKey]: parseTypedValue(action.data.settingValue, action.data.valueType, graph, action),
        },
        serverSettingsApplyMode: action.data.applyMode,
      },
    }
  }

  if (action.type === 'action-assign-loot') {
    assertGraph(action.data.targetScope === 'player', `${graph.name}: ${action.label} can only target a player.`)

    const itemId = action.data.itemId.trim()
    const lootTableId = action.data.lootTableId.trim()
    const quantity = Math.max(1, Math.floor(action.data.quantity ?? 1))

    if (lootTableId) {
      if (!options.resolveNamedLootTable) {
        throw new Error(`${graph.name}: ${action.label} uses a loot table payout, but no named loot table resolver is configured.`)
      }

      const lootTable = await options.resolveNamedLootTable(lootTableId)
      assertGraph(lootTable, `${graph.name}: ${action.label} references unknown loot table "${lootTableId}".`)

      const itemGrants = scaleItemGrants(lootTable.items, quantity)
      assertGraph(itemGrants.length > 0, `${graph.name}: ${action.label} resolved loot table "${lootTable.name}" with no deliverable items.`)

      return {
        name: `${graph.name}: ${action.label}`,
        triggerKind: 'WORKFLOW',
        triggerKey: workflowKeyForTrigger(graph, trigger),
        isEnabled: graph.isEnabled,
        moneyAmount: 0,
        xpAmount: 0,
        xpCategory: null,
        xpCategoryAmount: 0,
        config: {
          ...baseConfig,
          [automationRuntimeItemGrantKey]: itemGrants,
        },
      }
    }

    assertGraph(itemId.length > 0, `${graph.name}: ${action.label} needs a direct item ID.`)

    const itemGrant: AutomationRuntimeItemGrant = {
      itemId,
      quantity,
    }

    return {
      name: `${graph.name}: ${action.label}`,
      triggerKind: 'WORKFLOW',
      triggerKey: workflowKeyForTrigger(graph, trigger),
      isEnabled: graph.isEnabled,
      moneyAmount: 0,
      xpAmount: 0,
      xpCategory: null,
      xpCategoryAmount: 0,
      config: {
        ...baseConfig,
        [automationRuntimeItemGrantKey]: itemGrant,
      },
    }
  }

  if (action.type === 'action-assign-ingame-xp') {
    assertGraph(action.data.targetScope === 'player', `${graph.name}: ${action.label} can only target a player.`)

    const skillKey = action.data.skillKey.trim()
    const amount = Math.max(0, Math.floor(action.data.amount ?? 0))

    assertGraph(skillKey.length > 0, `${graph.name}: ${action.label} needs a skill key.`)
    assertGraph(!/[\s=]/.test(skillKey), `${graph.name}: ${action.label} must use a single Project Zomboid perk key like "Woodwork".`)
    assertGraph(amount > 0, `${graph.name}: ${action.label} needs an XP amount greater than zero.`)

    const inGameXpGrant: AutomationRuntimeInGameXpGrant = {
      skillKey,
      amount,
    }

    return {
      name: `${graph.name}: ${action.label}`,
      triggerKind: 'WORKFLOW',
      triggerKey: workflowKeyForTrigger(graph, trigger),
      isEnabled: graph.isEnabled,
      moneyAmount: 0,
      xpAmount: 0,
      xpCategory: null,
      xpCategoryAmount: 0,
      config: {
        ...baseConfig,
        [automationRuntimeInGameXpGrantKey]: inGameXpGrant,
      },
    }
  }

  throw new Error(`${graph.name}: ${action.label} is not supported by the automation compiler.`)
}

async function compileGraph(
  graph: AutomationStudioGraph,
  options: CompileAutomationStudioDocumentOptions,
): Promise<CompiledAutomationDocument> {
  if (!graph.isEnabled) {
    return { workflows: [], actionRules: [] }
  }

  const nodesById = new Map(graph.nodes.map(node => [node.id, node]))
  const outgoing = new Map<string, AutomationStudioEdge[]>()
  const incomingCount = new Map<string, number>()

  for (const node of graph.nodes) {
    incomingCount.set(node.id, 0)
  }

  for (const edge of graph.edges) {
    assertGraph(nodesById.has(edge.source), `${graph.name}: edge ${edge.id} references a missing source node.`)
    assertGraph(nodesById.has(edge.target), `${graph.name}: edge ${edge.id} references a missing target node.`)

    const bucket = outgoing.get(edge.source) ?? []
    bucket.push(edge)
    outgoing.set(edge.source, bucket)
    incomingCount.set(edge.target, (incomingCount.get(edge.target) ?? 0) + 1)
  }

  for (const node of graph.nodes) {
    if (getAutomationNodeKind(node.type) !== 'trigger') {
      assertGraph((incomingCount.get(node.id) ?? 0) > 0, `${graph.name}: ${node.label} is disconnected from every trigger.`)
      assertGraph((incomingCount.get(node.id) ?? 0) <= 1, `${graph.name}: ${node.label} has multiple incoming paths, which is not supported yet.`)
    }
  }

  const triggers = graph.nodes.filter(node => getAutomationNodeKind(node.type) === 'trigger') as AutomationTriggerNode[]
  assertGraph(triggers.length > 0, `${graph.name}: an enabled graph needs at least one trigger node.`)

  const compiledWorkflows: CompiledAutomationWorkflow[] = []
  const compiledActionRules: CompiledAutomationActionRule[] = []

  for (const trigger of triggers) {
    assertGraph(!trigger.data.dedupeKey.trim(), `${graph.name}: ${trigger.label} uses a dedupe key, but dedupe compilation is not implemented yet.`)
    assertGraph(trigger.data.cooldownSeconds == null, `${graph.name}: ${trigger.label} uses a cooldown, but cooldown compilation is not implemented yet.`)

    const reachableActions: RecordedAction[] = []
    let executionOrder = 0

    const visitNode = (target: AutomationStudioNode, state: GraphTraversalState, fromBranchHandle?: string | null) => {
      assertGraph(!state.visited.has(target.id), `${graph.name}: cycle detected near ${target.label}.`)

      if (target.type === 'condition') {
        assertGraph(fromBranchHandle == null, `${graph.name}: ${target.label} cannot be reached from a branch handle.`)
        const condition = target as AutomationConditionNode
        const conditionGroup = buildPredicateGroup(graph, condition.label, condition.data.combinator, condition.data.checks)
        const branchEdges = outgoing.get(condition.id) ?? []
        assertGraph(branchEdges.length > 0, `${graph.name}: ${condition.label} does not lead anywhere.`)

        for (const branchEdge of [...branchEdges].sort((left, right) => normalizeEdgeOrder(left) - normalizeEdgeOrder(right))) {
          assertGraph(branchEdge.sourceHandle === 'true' || branchEdge.sourceHandle === 'false', `${graph.name}: ${condition.label} must use explicit true or false outputs.`)
          const branchTarget = nodesById.get(branchEdge.target)
          assertGraph(branchTarget, `${graph.name}: edge ${branchEdge.id} references a missing target node.`)
          const branchPredicate = branchEdge.sourceHandle === 'false'
            ? { kind: 'not', child: conditionGroup } as AutomationRuntimePredicateNode
            : conditionGroup

          visitNode(branchTarget, {
            predicate: combinePredicate(state.predicate, branchPredicate),
            depth: state.depth,
            visited: new Set([...state.visited, condition.id]),
          }, branchEdge.sourceHandle)
        }

        return
      }

      assertGraph(getAutomationNodeKind(target.type) === 'action', `${graph.name}: ${target.label} is not a compilable downstream node.`)
      const action = target as AutomationActionNode
      executionOrder = executionOrder + 1
      reachableActions.push({
        node: action,
        predicate: state.predicate,
        executionOrder: state.depth + executionOrder,
      })

      walk(action.id, {
        predicate: state.predicate,
        depth: state.depth + 1,
        visited: new Set([...state.visited, action.id]),
      })
    }

    const walk = (nodeId: string, state: GraphTraversalState) => {
      const edges = [...(outgoing.get(nodeId) ?? [])].sort((left, right) => normalizeEdgeOrder(left) - normalizeEdgeOrder(right))

      for (const edge of edges) {
        const target = nodesById.get(edge.target)
        assertGraph(target, `${graph.name}: edge ${edge.id} references a missing target node.`)
        visitNode(target, state, edge.sourceHandle)
      }
    }

    walk(trigger.id, {
      predicate: null,
      depth: 0,
      visited: new Set([trigger.id]),
    })

    assertGraph(reachableActions.length > 0, `${graph.name}: ${trigger.label} does not lead to any action nodes.`)

    const workflowMatchConfig = trigger.data.filters.length > 0
      ? {
          [automationRuntimePredicateKey]: buildPredicateGroup(graph, trigger.label, 'all', trigger.data.filters),
        }
      : undefined

    compiledWorkflows.push({
      key: workflowKeyForTrigger(graph, trigger),
      name: `${graph.name}: ${trigger.label}`,
      isEnabled: true,
      config: {
        kind: 'workflow',
        ...makeCompiledMetadata(graph, trigger.id),
      },
      steps: [{
        stepOrder: 1,
        eventKey: getAutomationTriggerEventKey(trigger.type),
        withinSeconds: null,
        matchConfig: workflowMatchConfig,
      }],
    })

    for (const action of reachableActions) {
      compiledActionRules.push(await compileActionNode(graph, trigger, action.node, action.predicate, action.executionOrder, options))
    }
  }

  return {
    workflows: compiledWorkflows,
    actionRules: compiledActionRules,
  }
}

function assertUniqueWorkflowKeys(workflows: CompiledAutomationWorkflow[]): void {
  const seen = new Set<string>()

  for (const workflow of workflows) {
    if (seen.has(workflow.key)) {
      throw new Error(`Automation compiler generated a duplicate workflow key: ${workflow.key}`)
    }

    seen.add(workflow.key)
  }
}

export async function compileAutomationStudioDocument(
  document: AutomationStudioDocument | unknown,
  options: CompileAutomationStudioDocumentOptions = {},
): Promise<CompiledAutomationDocument> {
  const normalized = normalizeAutomationStudioDocument(document)
  const result: CompiledAutomationDocument = {
    workflows: [],
    actionRules: [],
  }

  for (const graph of normalized.graphs) {
    const compiled = await compileGraph(graph, options)
    result.workflows.push(...compiled.workflows)
    result.actionRules.push(...compiled.actionRules)
  }

  assertUniqueWorkflowKeys(result.workflows)
  return result
}