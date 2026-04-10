<script setup lang="ts">
import { computed, shallowRef, watch } from 'vue'

import TelemetryAutomationCanvas from '@/components/telemetry-studio/TelemetryAutomationCanvas.vue'
import TelemetryAutomationSidebar from '@/components/telemetry-studio/TelemetryAutomationSidebar.vue'

import {
  createAutomationNode,
  getAutomationNodeKind,
  type AutomationNodeCreateRequest,
  type AutomationNodeType,
  type AutomationStudioDocument,
  type AutomationStudioEdge,
  type AutomationStudioGraph,
  type AutomationStudioNode,
} from '~~/shared/telemetry-automation'

const model = defineModel<AutomationStudioDocument>({ required: true })

const props = defineProps<{
  graphId: string
}>()

const selectedNodeId = shallowRef<string | null>(null)

const selectedGraph = computed(() => model.value.graphs.find(graph => graph.id === props.graphId) ?? null)
const selectedNode = computed(() => selectedGraph.value?.nodes.find(node => node.id === selectedNodeId.value) ?? null)

watch(() => model.value.graphs, (graphs) => {
  const graph = graphs.find(entry => entry.id === props.graphId) ?? null
  if (!graph) {
    selectedNodeId.value = null
    return
  }

  if (selectedNodeId.value && !graph.nodes.some(node => node.id === selectedNodeId.value)) {
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

  if (getAutomationNodeKind(type) === 'trigger') {
    return { x: 80, y: baseY }
  }

  if (getAutomationNodeKind(type) === 'condition') {
    return { x: Math.max(320, maxX + 220), y: baseY }
  }

  return { x: Math.max(560, maxX + 240), y: baseY }
}

function addNode(request: AutomationNodeCreateRequest) {
  if (!selectedGraph.value) {
    return
  }

  const nextNode = createAutomationNode(request.type, {
    position: request.position ?? nextNodePosition(request.type),
  })

  updateGraph({
    ...selectedGraph.value,
    nodes: [...selectedGraph.value.nodes, nextNode],
  })
  selectedNodeId.value = nextNode.id
}
</script>

<template>
  <div class="grid h-full min-h-0 gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
    <div class="min-h-0 xl:order-1">
      <TelemetryAutomationSidebar
        :graph="selectedGraph"
        :selected-node="selectedNode"
        @update-graph="updateGraph"
        @update-node="updateSelectedNode"
        @remove-node="removeSelectedNode"
        @add-node="addNode"
      />
    </div>

    <div class="min-h-0 min-w-0 xl:order-2">
      <TelemetryAutomationCanvas
        v-if="selectedGraph"
        :graph-name="selectedGraph.name"
        :nodes="selectedGraph.nodes"
        :edges="selectedGraph.edges"
        height-class="h-[calc(100dvh-16rem)] min-h-[640px]"
        @update:nodes="updateSelectedGraphNodes"
        @update:edges="updateSelectedGraphEdges"
        @select-node="selectedNodeId = $event"
        @clear-selection="selectedNodeId = null"
        @add-node="addNode"
      />

      <Card v-else class="h-full border-dashed border-border/70 shadow-sm">
        <CardContent class="flex h-full min-h-[640px] flex-col items-center justify-center gap-4 p-8 text-center">
          <p class="text-lg font-medium text-foreground">No workflow selected</p>
          <p class="max-w-lg text-sm leading-6 text-muted-foreground">
            Return to the automation workflow list and open an existing workflow or create a new blueprint.
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>