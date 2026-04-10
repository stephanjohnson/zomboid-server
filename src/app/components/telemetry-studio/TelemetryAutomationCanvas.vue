<script setup lang="ts">
import { computed } from 'vue'
import {
  ConnectionMode,
  Position,
  VueFlow,
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
  automationNodeTypes,
  type AutomationNodeType,
  type AutomationStudioEdge,
  type AutomationStudioNode,
} from '~~/shared/telemetry-automation'

const props = defineProps<{
  graphName: string
  nodes: AutomationStudioNode[]
  edges: AutomationStudioEdge[]
}>()

const emit = defineEmits<{
  (e: 'update:nodes', nodes: AutomationStudioNode[]): void
  (e: 'update:edges', edges: AutomationStudioEdge[]): void
  (e: 'select-node', nodeId: string): void
  (e: 'clear-selection'): void
  (e: 'add-node', type: AutomationNodeType): void
}>()

const flowNodes = computed<Array<FlowNode<AutomationStudioNode['data'], object, AutomationNodeType>>>(() => {
  return props.nodes.map(node => ({
    ...node,
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    draggable: true,
    selectable: true,
    connectable: true,
  }))
})

const flowEdges = computed<Array<AutomationStudioEdge>>(() => {
  return props.edges.map(edge => ({
    ...edge,
    animated: edge.animated ?? false,
  }))
})

function normalizeNodeType(type: string | undefined): AutomationNodeType {
  return automationNodeTypes.includes(type as AutomationNodeType) ? type as AutomationNodeType : 'trigger'
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

function handleNodesUpdate(nodes: GraphNode[]) {
  const nextNodes = sanitizeNodes(nodes)
  if (JSON.stringify(nextNodes) === JSON.stringify(props.nodes)) {
    return
  }

  emit('update:nodes', nextNodes)
}

function handleEdgesUpdate(edges: GraphEdge[]) {
  const nextEdges = sanitizeEdges(edges)
  if (JSON.stringify(nextEdges) === JSON.stringify(props.edges)) {
    return
  }

  emit('update:edges', nextEdges)
}

function handleConnect(connection: Connection) {
  if (!connection.source || !connection.target) {
    return
  }

  const duplicate = props.edges.some(edge => (
    edge.source === connection.source
    && edge.target === connection.target
    && (edge.sourceHandle ?? null) === (connection.sourceHandle ?? null)
    && (edge.targetHandle ?? null) === (connection.targetHandle ?? null)
  ))
  if (duplicate) {
    return
  }

  emit('update:edges', [
    ...props.edges,
    {
      id: `edge_${Math.random().toString(36).slice(2, 10)}`,
      source: connection.source,
      target: connection.target,
      sourceHandle: connection.sourceHandle ?? null,
      targetHandle: connection.targetHandle ?? null,
      label: connection.sourceHandle === 'true' ? 'true' : connection.sourceHandle === 'false' ? 'false' : undefined,
      animated: connection.sourceHandle != null,
    },
  ])
}

function handleNodeClick(event: { node: GraphNode }) {
  emit('select-node', event.node.id)
}
</script>

<template>
  <Card class="overflow-hidden border-border/70 shadow-sm">
    <CardContent class="p-0">
      <ClientOnly>
        <VueFlow
          class="telemetry-automation-flow h-[720px] w-full"
          :nodes="flowNodes"
          :edges="flowEdges"
          :connection-mode="ConnectionMode.Strict"
          :default-viewport="{ zoom: 0.82 }"
          :fit-view-on-init="true"
          :min-zoom="0.35"
          :max-zoom="1.5"
          :snap-to-grid="true"
          :snap-grid="[16, 16]"
          @node-click="handleNodeClick"
          @pane-click="emit('clear-selection')"
          @connect="handleConnect"
          @update:nodes="handleNodesUpdate"
          @update:edges="handleEdgesUpdate"
        >
          <Background />
          <MiniMap />
          <Controls />

          <template #node-trigger="nodeProps">
            <TelemetryAutomationNode v-bind="nodeProps" />
          </template>

          <template #node-condition="nodeProps">
            <TelemetryAutomationNode v-bind="nodeProps" />
          </template>

          <template #node-action="nodeProps">
            <TelemetryAutomationNode v-bind="nodeProps" />
          </template>

          <div class="pointer-events-none absolute inset-x-0 top-4 z-10 flex justify-center px-4">
            <div class="pointer-events-auto flex w-full max-w-3xl flex-col gap-3 rounded-[22px] border border-slate-300/80 bg-white/90 px-4 py-3 shadow-lg backdrop-blur">
              <div class="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p class="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Visual Rule Graph</p>
                  <p class="text-sm font-medium text-foreground">{{ props.graphName }}</p>
                </div>
                <div class="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" @click.stop="emit('add-node', 'trigger')">
                    Add trigger
                  </Button>
                  <Button size="sm" variant="outline" @click.stop="emit('add-node', 'condition')">
                    Add condition
                  </Button>
                  <Button size="sm" variant="outline" @click.stop="emit('add-node', 'action')">
                    Add action
                  </Button>
                </div>
              </div>
              <p class="text-xs leading-5 text-muted-foreground">
                Drag from the node handles to connect trigger paths. Condition nodes expose separate true and false branches.
              </p>
            </div>
          </div>
        </VueFlow>

        <template #fallback>
          <div class="flex h-[720px] items-center justify-center bg-muted/20 text-sm text-muted-foreground">
            Preparing the graph canvas…
          </div>
        </template>
      </ClientOnly>
    </CardContent>
  </Card>
</template>

<style>
@import '@vue-flow/core/dist/style.css';
@import '@vue-flow/core/dist/theme-default.css';

.telemetry-automation-flow {
  background:
    radial-gradient(circle at top, rgba(251, 191, 36, 0.14), transparent 28%),
    linear-gradient(180deg, rgba(248, 250, 252, 0.96), rgba(255, 255, 255, 0.98));
}

.telemetry-automation-flow .vue-flow__pane {
  cursor: grab;
}

.telemetry-automation-flow .vue-flow__pane.dragging {
  cursor: grabbing;
}

.telemetry-automation-flow .vue-flow__controls {
  box-shadow: 0 12px 40px rgba(15, 23, 42, 0.14);
}

.telemetry-automation-flow .vue-flow__minimap {
  border-radius: 18px;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(148, 163, 184, 0.3);
}

.telemetry-automation-flow .vue-flow__edge-text {
  font-size: 11px;
  font-weight: 600;
  fill: rgb(71 85 105);
}
</style>