<script setup lang="ts">
import { computed, markRaw, ref, watch } from 'vue'
import {
  ConnectionMode,
  Position,
  VueFlow,
  useVueFlow,
  type Connection,
  type GraphEdge,
  type GraphNode,
  type Node as FlowNode,
} from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'

import TelemetryAutomationNode from '@/components/telemetry-studio/TelemetryAutomationNode.vue'

import {
  automationNodeDragMimeType,
  automationNodeTypes,
  type AutomationNodeCreateRequest,
  type AutomationNodeType,
  type AutomationStudioEdge,
  type AutomationStudioNode,
} from '~~/shared/telemetry-automation'

const props = defineProps<{
  graphName: string
  nodes: AutomationStudioNode[]
  edges: AutomationStudioEdge[]
  heightClass?: string
}>()

const emit = defineEmits<{
  (e: 'update:nodes', nodes: AutomationStudioNode[]): void
  (e: 'update:edges', edges: AutomationStudioEdge[]): void
  (e: 'select-node', nodeId: string): void
  (e: 'clear-selection'): void
  (e: 'add-node', request: AutomationNodeCreateRequest): void
}>()

const modelNodes = ref<Array<FlowNode<AutomationStudioNode['data'], object, AutomationNodeType>>>([])
const modelEdges = ref<GraphEdge[]>([])
const isDropTarget = ref(false)
const flowId = 'telemetry-automation-flow'

const { screenToFlowCoordinate } = useVueFlow(flowId)

const canvasHeightClass = computed(() => props.heightClass ?? 'h-[720px]')
const nodeTypes = Object.fromEntries(automationNodeTypes.map(type => [type, markRaw(TelemetryAutomationNode)]))

function buildFlowNode(node: AutomationStudioNode): FlowNode<AutomationStudioNode['data'], object, AutomationNodeType> {
  return {
    ...node,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    draggable: true,
    selectable: true,
    connectable: true,
  }
}

function buildFlowEdge(edge: AutomationStudioEdge): GraphEdge {
  return {
    ...edge,
    animated: edge.animated ?? false,
  }
}

function normalizeNodeType(type: string | undefined): AutomationNodeType {
  return automationNodeTypes.includes(type as AutomationNodeType) ? type as AutomationNodeType : 'trigger-item-found'
}

function sanitizeNodes(nodes: GraphNode[]): AutomationStudioNode[] {
  return nodes.map((node) => {
    return {
      id: node.id,
      type: normalizeNodeType(node.type),
      label: typeof node.label === 'string' ? node.label : 'Rule node',
      position: {
        x: node.position.x,
        y: node.position.y,
      },
      data: node.data as AutomationStudioNode['data'],
    } as AutomationStudioNode
  })
}

function sanitizeEdges(edges: GraphEdge[]): AutomationStudioEdge[] {
  return edges.map(edge => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle ?? null,
    targetHandle: edge.targetHandle ?? null,
    label: typeof edge.label === 'string' ? edge.label : undefined,
    animated: edge.animated ?? false,
  }))
}

function syncNodesToParent(nodes: GraphNode[]) {
  const nextNodes = sanitizeNodes(nodes)
  if (JSON.stringify(nextNodes) === JSON.stringify(props.nodes)) {
    return
  }

  emit('update:nodes', nextNodes)
}

function syncEdgesToParent(edges: GraphEdge[]) {
  const nextEdges = sanitizeEdges(edges)
  if (JSON.stringify(nextEdges) === JSON.stringify(props.edges)) {
    return
  }

  emit('update:edges', nextEdges)
}

watch(() => props.nodes, (nodes) => {
  const nextNodes = nodes.map(buildFlowNode)
  if (JSON.stringify(sanitizeNodes(nextNodes as GraphNode[])) === JSON.stringify(sanitizeNodes(modelNodes.value as GraphNode[]))) {
    return
  }

  modelNodes.value = nextNodes
}, { immediate: true, deep: true })

watch(() => props.edges, (edges) => {
  const nextEdges = edges.map(buildFlowEdge)
  if (JSON.stringify(sanitizeEdges(nextEdges)) === JSON.stringify(sanitizeEdges(modelEdges.value))) {
    return
  }

  modelEdges.value = nextEdges
}, { immediate: true, deep: true })

watch(modelNodes, (nodes) => {
  syncNodesToParent(nodes as GraphNode[])
}, { deep: true })

watch(modelEdges, (edges) => {
  syncEdgesToParent(edges)
}, { deep: true })

function handleConnect(connection: Connection) {
  if (!connection.source || !connection.target) {
    return
  }

  const duplicate = modelEdges.value.some(edge => (
    edge.source === connection.source
    && edge.target === connection.target
    && (edge.sourceHandle ?? null) === (connection.sourceHandle ?? null)
    && (edge.targetHandle ?? null) === (connection.targetHandle ?? null)
  ))
  if (duplicate) {
    return
  }

  modelEdges.value = [
    ...modelEdges.value,
    {
      id: `edge_${Math.random().toString(36).slice(2, 10)}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle ?? null,
      targetHandle: connection.targetHandle ?? null,
      label: connection.sourceHandle === 'true' ? 'true' : connection.sourceHandle === 'false' ? 'false' : undefined,
      animated: connection.sourceHandle != null,
    },
  ]
}

function handleNodeClick(event: { node: GraphNode }) {
  emit('select-node', event.node.id)
}

function canAcceptDraggedNode(dataTransfer: DataTransfer | null | undefined): boolean {
  if (!dataTransfer) {
    return false
  }

  return Array.from(dataTransfer.types).includes(automationNodeDragMimeType)
    || Array.from(dataTransfer.types).includes('text/plain')
}

function getDraggedNodeType(dataTransfer: DataTransfer | null | undefined): AutomationNodeType | null {
  if (!dataTransfer) {
    return null
  }

  const rawType = dataTransfer.getData(automationNodeDragMimeType) || dataTransfer.getData('text/plain')
  return automationNodeTypes.includes(rawType as AutomationNodeType) ? rawType as AutomationNodeType : null
}

function handleDragOver(event: DragEvent) {
  if (!canAcceptDraggedNode(event.dataTransfer)) {
    return
  }

  event.preventDefault()
  isDropTarget.value = true
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'copy'
  }
}

function handleDragLeave(event: DragEvent) {
  const currentTarget = event.currentTarget
  if (currentTarget instanceof HTMLElement && event.relatedTarget instanceof Node && currentTarget.contains(event.relatedTarget)) {
    return
  }

  isDropTarget.value = false
}

function handleDrop(event: DragEvent) {
  const type = getDraggedNodeType(event.dataTransfer)
  isDropTarget.value = false

  if (!type) {
    return
  }

  event.preventDefault()
  emit('add-node', {
    type,
    position: screenToFlowCoordinate({ x: event.clientX, y: event.clientY }),
  })
}

function handlePaneClick() {
  isDropTarget.value = false
  emit('clear-selection')
}
</script>

<template>
  <Card class="flex h-full min-h-0 flex-col overflow-hidden border-border/70 shadow-sm">
    <CardContent :class="[canvasHeightClass, 'min-h-0 w-full flex-1 p-0']">
      <div
        class="relative h-full min-h-0 w-full"
        @dragover="handleDragOver"
        @dragleave="handleDragLeave"
        @drop="handleDrop"
      >
        <ClientOnly>
          <VueFlow
            :id="flowId"
            class="telemetry-automation-flow !h-full !w-full"
            :node-types="nodeTypes"
            v-model:nodes="modelNodes"
            v-model:edges="modelEdges"
            :connection-mode="ConnectionMode.Strict"
            :default-viewport="{ zoom: 0.82 }"
            :fit-view-on-init="true"
            :min-zoom="0.35"
            :max-zoom="1.5"
            :snap-to-grid="true"
            :snap-grid="[16, 16]"
            @node-click="handleNodeClick"
            @pane-click="handlePaneClick"
            @connect="handleConnect"
          >
            <Background />
            <MiniMap />
            <Controls />

            <div class="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center px-4">
              <div class="pointer-events-auto w-full max-w-2xl rounded-xl border border-border/70 bg-card/90 px-4 py-3 shadow-lg backdrop-blur">
                <div class="space-y-1.5">
                  <p class="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">Visual Rule Graph</p>
                  <p class="text-sm font-medium text-foreground">{{ props.graphName }}</p>
                  <p class="text-xs leading-5 text-muted-foreground">
                    Drag node cards onto the canvas. Condition nodes expose separate true and false handles for branching.
                  </p>
                </div>
              </div>
            </div>
          </VueFlow>

          <div
            v-if="isDropTarget"
            class="pointer-events-none absolute inset-4 z-20 flex items-center justify-center rounded-2xl border border-dashed border-primary/50 bg-primary/5"
          >
            <div class="rounded-full border border-primary/20 bg-background/90 px-4 py-2 text-sm font-medium text-foreground shadow-sm">
              Drop node to add it here
            </div>
          </div>

          <template #fallback>
            <div :class="[canvasHeightClass, 'flex items-center justify-center bg-muted/20 text-sm text-muted-foreground']">
              Preparing the graph canvas…
            </div>
          </template>
        </ClientOnly>
      </div>
    </CardContent>
  </Card>
</template>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';

.telemetry-automation-flow {
  background:
    radial-gradient(circle at top, color-mix(in oklch, var(--primary) 12%, transparent) 0%, transparent 28%),
    linear-gradient(180deg, color-mix(in oklch, var(--card) 94%, transparent), color-mix(in oklch, var(--background) 98%, transparent));
}

.telemetry-automation-flow .vue-flow__pane {
  cursor: grab;
}

.telemetry-automation-flow .vue-flow__pane.dragging {
  cursor: grabbing;
}

.telemetry-automation-flow .vue-flow__controls {
  background: color-mix(in oklch, var(--card) 94%, transparent);
  border: 1px solid color-mix(in oklch, var(--border) 85%, transparent);
  border-radius: 1rem;
  box-shadow: var(--shadow-lg);
}

.telemetry-automation-flow .vue-flow__minimap {
  border-radius: 1rem;
  overflow: hidden;
  background: color-mix(in oklch, var(--card) 92%, transparent);
  border: 1px solid color-mix(in oklch, var(--border) 85%, transparent);
  box-shadow: var(--shadow-sm);
}

.telemetry-automation-flow .vue-flow__edge-text {
  font-size: 0.75rem;
  font-weight: 600;
  fill: var(--muted-foreground);
}
</style>
