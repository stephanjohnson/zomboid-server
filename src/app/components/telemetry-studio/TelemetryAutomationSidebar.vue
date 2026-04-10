<script setup lang="ts">
import { shallowRef, watch } from 'vue'

import TelemetryAutomationInspector from '@/components/telemetry-studio/TelemetryAutomationInspector.vue'
import TelemetryAutomationPalette from '@/components/telemetry-studio/TelemetryAutomationPalette.vue'

import type {
  AutomationNodeCreateRequest,
  AutomationStudioGraph,
  AutomationStudioNode,
} from '~~/shared/telemetry-automation'

const props = defineProps<{
  graph: AutomationStudioGraph | null
  selectedNode: AutomationStudioNode | null
}>()

const emit = defineEmits<{
  (e: 'update-graph', graph: AutomationStudioGraph): void
  (e: 'update-node', node: AutomationStudioNode): void
  (e: 'remove-node', nodeId: string): void
  (e: 'add-node', request: AutomationNodeCreateRequest): void
}>()

const activeTab = shallowRef<'nodes' | 'editor'>(props.selectedNode ? 'editor' : 'nodes')

watch(() => props.selectedNode?.id, (nodeId) => {
  if (nodeId) {
    activeTab.value = 'editor'
  }
}, { immediate: true })
</script>

<template>
  <Card class="flex h-full min-h-0 flex-col border-border/70 shadow-sm">
    <CardHeader class="space-y-3 pb-4">
      <div class="space-y-1">
        <CardTitle>Workflow Builder</CardTitle>
        <CardDescription>
          Add explicit node types from the library, then edit the selected node in a single-column panel.
        </CardDescription>
      </div>

      <Tabs v-model="activeTab" class="space-y-0">
        <TabsList class="grid h-auto w-full grid-cols-2 gap-2 bg-muted/30 p-1">
          <TabsTrigger value="nodes">Nodes</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
        </TabsList>
      </Tabs>
    </CardHeader>

    <CardContent class="min-h-0 flex-1 overflow-hidden px-4 pb-4 pt-0">
      <Tabs v-model="activeTab" class="h-full min-h-0">
        <TabsContent value="nodes" class="mt-0 h-full min-h-0 overflow-y-auto pr-1">
          <TelemetryAutomationPalette @add-node="emit('add-node', $event)" />
        </TabsContent>

        <TabsContent value="editor" class="mt-0 h-full min-h-0 overflow-y-auto pr-1">
          <TelemetryAutomationInspector
            :graph="props.graph"
            :selected-node="props.selectedNode"
            @update-graph="emit('update-graph', $event)"
            @update-node="emit('update-node', $event)"
            @remove-node="emit('remove-node', $event)"
          />
        </TabsContent>
      </Tabs>
    </CardContent>
  </Card>
</template>
