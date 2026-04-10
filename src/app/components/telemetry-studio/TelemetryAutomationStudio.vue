<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'

import TelemetryAutomationCanvas from '@/components/telemetry-studio/TelemetryAutomationCanvas.vue'
import TelemetryAutomationInspector from '@/components/telemetry-studio/TelemetryAutomationInspector.vue'

import {
  automationBlueprintOptions,
  automationConditionSourceOptions,
  automationEventOptions,
  createAutomationActionNode,
  createAutomationBlueprintGraph,
  createAutomationConditionNode,
  createAutomationTriggerNode,
  type AutomationBlueprintKey,
  type AutomationNodeType,
  type AutomationStudioDocument,
  type AutomationStudioEdge,
  type AutomationStudioGraph,
  type AutomationStudioNode,
} from '~~/shared/telemetry-automation'

const model = defineModel<AutomationStudioDocument>({ required: true })

const props = defineProps<{
  profileName: string
}>()

const selectedGraphId = shallowRef('')
const selectedNodeId = shallowRef<string | null>(null)

const selectedGraph = computed(() => model.value.graphs.find(graph => graph.id === selectedGraphId.value) ?? null)
const selectedNode = computed(() => selectedGraph.value?.nodes.find(node => node.id === selectedNodeId.value) ?? null)

watch(() => model.value.graphs, (graphs) => {
  if (graphs.length === 0) {
    selectedGraphId.value = ''
    selectedNodeId.value = null
    return
  }

  if (!graphs.some(graph => graph.id === selectedGraphId.value)) {
    selectedGraphId.value = graphs[0]?.id ?? ''
    selectedNodeId.value = null
  }

  if (selectedNodeId.value && !selectedGraph.value?.nodes.some(node => node.id === selectedNodeId.value)) {
    selectedNodeId.value = null
  }
}, { immediate: true, deep: true })

function replaceGraphs(graphs: AutomationStudioGraph[]) {
  model.value = {
    ...model.value,
    graphs,
  }
}

function updateGraph(nextGraph: AutomationStudioGraph) {
  replaceGraphs(model.value.graphs.map(graph => graph.id === nextGraph.id ? nextGraph : graph))
}

function pruneEdges(nodes: AutomationStudioNode[], edges: AutomationStudioEdge[]) {
  const nodeIds = new Set(nodes.map(node => node.id))
  return edges.filter(edge => nodeIds.has(edge.source) && nodeIds.has(edge.target))
}

function addGraph(key: AutomationBlueprintKey) {
  const nextGraph = createAutomationBlueprintGraph(key)
  replaceGraphs([...model.value.graphs, nextGraph])
  selectedGraphId.value = nextGraph.id
  selectedNodeId.value = nextGraph.nodes[0]?.id ?? null
}

function removeGraph(graphId: string) {
  replaceGraphs(model.value.graphs.filter(graph => graph.id !== graphId))
}

function selectGraph(graphId: string) {
  selectedGraphId.value = graphId
  selectedNodeId.value = null
}

function updateSelectedGraphNodes(nodes: AutomationStudioNode[]) {
  if (!selectedGraph.value) {
    return
  }

  updateGraph({
    ...selectedGraph.value,
    nodes,
    edges: pruneEdges(nodes, selectedGraph.value.edges),
  })
}

function updateSelectedGraphEdges(edges: AutomationStudioEdge[]) {
  if (!selectedGraph.value) {
    return
  }

  updateGraph({
    ...selectedGraph.value,
    edges: pruneEdges(selectedGraph.value.nodes, edges),
  })
}

function updateSelectedNode(node: AutomationStudioNode) {
  if (!selectedGraph.value) {
    return
  }

  updateSelectedGraphNodes(selectedGraph.value.nodes.map(currentNode => currentNode.id === node.id ? node : currentNode))
}

function removeSelectedNode(nodeId: string) {
  if (!selectedGraph.value) {
    return
  }

  const nextNodes = selectedGraph.value.nodes.filter(node => node.id !== nodeId)
  updateGraph({
    ...selectedGraph.value,
    nodes: nextNodes,
    edges: pruneEdges(nextNodes, selectedGraph.value.edges.filter(edge => edge.source !== nodeId && edge.target !== nodeId)),
  })
  selectedNodeId.value = null
}

function nextNodePosition(type: AutomationNodeType) {
  const graph = selectedGraph.value
  const row = graph ? graph.nodes.length % 4 : 0
  const baseY = 100 + row * 150
  const maxX = graph && graph.nodes.length > 0
    ? Math.max(...graph.nodes.map(node => node.position.x))
    : 80

  if (type === 'trigger') {
    return { x: 80, y: baseY }
  }

  if (type === 'condition') {
    return { x: Math.max(320, maxX + 220), y: baseY }
  }

  return { x: Math.max(560, maxX + 240), y: baseY }
}

function addNode(type: AutomationNodeType) {
  if (!selectedGraph.value) {
    return
  }

  const position = nextNodePosition(type)
  const nextNode = type === 'trigger'
    ? createAutomationTriggerNode({ label: 'New trigger', position })
    : type === 'condition'
      ? createAutomationConditionNode({ label: 'New condition', position })
      : createAutomationActionNode({ label: 'New action', position })

  updateGraph({
    ...selectedGraph.value,
    nodes: [...selectedGraph.value.nodes, nextNode],
  })
  selectedNodeId.value = nextNode.id
}

const triggerLabels = computed(() => automationEventOptions.map(option => option.label))
const actionLabels = ['loot', 'in-game XP', 'PZM XP', 'cash reward', 'set flag', 'unset flag']
</script>

<template>
  <div class="space-y-6">
    <Card class="border-stone-300/70 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_28%),linear-gradient(135deg,_rgba(255,251,235,0.95),_rgba(255,255,255,0.98))] shadow-sm">
      <CardHeader class="space-y-4">
        <div class="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div class="space-y-2">
            <Badge variant="secondary">{{ props.profileName }}</Badge>
            <div class="space-y-1">
              <CardTitle class="text-2xl">Visual Rule Studio</CardTitle>
              <CardDescription class="max-w-3xl text-sm leading-6">
                Build branching trigger logic for telemetry events, inspect player or item context, and fan out into rewards or flag mutations without dropping into raw JSON first.
              </CardDescription>
            </div>
          </div>

          <div class="flex flex-wrap gap-2">
            <Badge variant="outline">{{ model.graphs.length }} graphs</Badge>
            <Badge variant="outline">{{ triggerLabels.slice(0, 3).join(' • ') }}</Badge>
            <Badge variant="outline">{{ actionLabels.join(' • ') }}</Badge>
          </div>
        </div>
      </CardHeader>
    </Card>

    <div class="grid gap-6 2xl:grid-cols-[320px_minmax(0,1fr)_360px]">
      <div class="space-y-6">
        <Card class="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Graphs</CardTitle>
            <CardDescription>
              Start from a blank rule or a blueprint close to the gameplay loop you want to automate.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-5">
            <div class="grid gap-2">
              <Button
                v-for="blueprint in automationBlueprintOptions"
                :key="blueprint.key"
                variant="outline"
                class="h-auto justify-start whitespace-normal px-4 py-3 text-left"
                @click="addGraph(blueprint.key)"
              >
                <span class="block">
                  <span class="block font-medium text-foreground">{{ blueprint.title }}</span>
                  <span class="block text-xs leading-5 text-muted-foreground">{{ blueprint.description }}</span>
                </span>
              </Button>
            </div>

            <Separator />

            <div class="space-y-3">
              <div class="flex items-center justify-between gap-3">
                <p class="text-sm font-medium text-foreground">Saved rule graphs</p>
                <Badge variant="secondary">{{ model.graphs.length }}</Badge>
              </div>

              <div v-if="model.graphs.length" class="space-y-3">
                <div
                  v-for="graph in model.graphs"
                  :key="graph.id"
                  class="rounded-2xl border p-3 transition-colors"
                  :class="graph.id === selectedGraphId ? 'border-slate-900/20 bg-slate-50' : 'border-border/70 bg-background'"
                >
                  <div class="flex items-start justify-between gap-3">
                    <button
                      type="button"
                      class="flex-1 text-left"
                      @click="selectGraph(graph.id)"
                    >
                      <p class="font-medium text-foreground">{{ graph.name }}</p>
                      <p class="mt-1 text-xs leading-5 text-muted-foreground">{{ graph.description || 'No description yet.' }}</p>
                      <p class="mt-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                        {{ graph.nodes.length }} nodes • {{ graph.edges.length }} links • {{ graph.isEnabled ? 'enabled' : 'disabled' }}
                      </p>
                    </button>
                    <Button variant="ghost" size="sm" @click="removeGraph(graph.id)">
                      Remove
                    </Button>
                  </div>
                </div>
              </div>

              <p v-else class="text-sm text-muted-foreground">
                No graphs yet. Start from a blueprint above to create your first branching rule.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card class="border-border/70 shadow-sm">
          <CardHeader>
            <CardTitle>Context Cheat Sheet</CardTitle>
            <CardDescription>
              Conditions can read event payload, player state, item info, flags, and server fields.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Event Ideas</p>
              <div class="space-y-2">
                <div
                  v-for="eventOption in automationEventOptions.slice(0, 4)"
                  :key="eventOption.key"
                  class="rounded-xl border border-border/70 bg-muted/20 p-3"
                >
                  <p class="font-medium text-foreground">{{ eventOption.label }}</p>
                  <p class="mt-1 text-xs leading-5 text-muted-foreground">{{ eventOption.context.slice(0, 3).join(' • ') }}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div class="space-y-2">
              <p class="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Condition Sources</p>
              <div class="space-y-2">
                <div
                  v-for="sourceOption in automationConditionSourceOptions"
                  :key="sourceOption.key"
                  class="rounded-xl border border-border/70 bg-background/80 p-3"
                >
                  <p class="font-medium text-foreground">{{ sourceOption.label }}</p>
                  <p class="mt-1 text-xs leading-5 text-muted-foreground">{{ sourceOption.examples.join(' • ') }}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div class="min-w-0">
        <TelemetryAutomationCanvas
          v-if="selectedGraph"
          :graph-name="selectedGraph.name"
          :nodes="selectedGraph.nodes"
          :edges="selectedGraph.edges"
          @update:nodes="updateSelectedGraphNodes"
          @update:edges="updateSelectedGraphEdges"
          @select-node="selectedNodeId = $event"
          @clear-selection="selectedNodeId = null"
          @add-node="addNode"
        />

        <Card v-else class="border-dashed border-border/70 shadow-sm">
          <CardContent class="flex min-h-[720px] flex-col items-center justify-center gap-4 p-8 text-center">
            <p class="text-lg font-medium text-foreground">No rule graph selected</p>
            <p class="max-w-lg text-sm leading-6 text-muted-foreground">
              Start from a blank rule or a blueprint on the left. This first cut focuses on authoring and persisting the graph so the evaluator can attach to a stable rule document next.
            </p>
            <Button @click="addGraph('blank-rule')">
              Add blank rule
            </Button>
          </CardContent>
        </Card>
      </div>

      <TelemetryAutomationInspector
        :graph="selectedGraph"
        :selected-node="selectedNode"
        @update-graph="updateGraph"
        @update-node="updateSelectedNode"
        @remove-node="removeSelectedNode"
      />
    </div>
  </div>
</template>