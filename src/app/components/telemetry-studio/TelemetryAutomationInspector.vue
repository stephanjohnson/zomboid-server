<script setup lang="ts">
import { computed } from 'vue'

import TelemetryAutomationChecksEditor from '@/components/telemetry-studio/TelemetryAutomationChecksEditor.vue'

import {
  automationActionOptions,
  automationConditionCombinators,
  automationEventOptions,
  automationExecutionScopes,
  type AutomationActionNode,
  type AutomationActionNodeData,
  type AutomationConditionNode,
  type AutomationConditionNodeData,
  type AutomationStudioGraph,
  type AutomationStudioNode,
  type AutomationTriggerNode,
  type AutomationTriggerNodeData,
} from '~~/shared/telemetry-automation'

const props = defineProps<{
  graph: AutomationStudioGraph | null
  selectedNode: AutomationStudioNode | null
}>()

const emit = defineEmits<{
  (e: 'update-graph', graph: AutomationStudioGraph): void
  (e: 'update-node', node: AutomationStudioNode): void
  (e: 'remove-node', nodeId: string): void
}>()

const selectedTrigger = computed(() => props.selectedNode?.type === 'trigger' ? props.selectedNode as AutomationTriggerNode : null)
const selectedCondition = computed(() => props.selectedNode?.type === 'condition' ? props.selectedNode as AutomationConditionNode : null)
const selectedAction = computed(() => props.selectedNode?.type === 'action' ? props.selectedNode as AutomationActionNode : null)

const triggerFilters = computed({
  get: () => selectedTrigger.value?.data.filters ?? [],
  set: (filters) => {
    if (!selectedTrigger.value) {
      return
    }

    updateTriggerData({ filters })
  },
})

const conditionChecks = computed({
  get: () => selectedCondition.value?.data.checks ?? [],
  set: (checks) => {
    if (!selectedCondition.value) {
      return
    }

    updateConditionData({ checks })
  },
})

function updateGraph(patch: Partial<AutomationStudioGraph>) {
  if (!props.graph) {
    return
  }

  emit('update-graph', {
    ...props.graph,
    ...patch,
  })
}

function updateNode(nextNode: AutomationStudioNode) {
  emit('update-node', nextNode)
}

function updateTriggerData(patch: Partial<AutomationTriggerNodeData>) {
  if (!selectedTrigger.value) {
    return
  }

  updateNode({
    ...selectedTrigger.value,
    data: {
      ...selectedTrigger.value.data,
      ...patch,
    },
  })
}

function updateConditionData(patch: Partial<AutomationConditionNodeData>) {
  if (!selectedCondition.value) {
    return
  }

  updateNode({
    ...selectedCondition.value,
    data: {
      ...selectedCondition.value.data,
      ...patch,
    },
  })
}

function updateActionData(patch: Partial<AutomationActionNodeData>) {
  if (!selectedAction.value) {
    return
  }

  updateNode({
    ...selectedAction.value,
    data: {
      ...selectedAction.value.data,
      ...patch,
    },
  })
}

function updateSelectedNodeLabel(label: string) {
  if (!props.selectedNode) {
    return
  }

  updateNode({
    ...props.selectedNode,
    label,
  })
}
</script>

<template>
  <Card class="h-full border-border/70 shadow-sm">
    <CardHeader class="space-y-4">
      <div>
        <CardTitle>Inspector</CardTitle>
        <CardDescription>
          Tune the selected rule graph, then click a node to edit its trigger, checks, actions, and flag behavior.
        </CardDescription>
      </div>
      <Alert>
        <AlertTitle>Runtime intent</AlertTitle>
        <AlertDescription>
          This editor models future branching automation cleanly. The current delivery focuses on authoring and persistence, so the rule document is ready before the evaluator lands.
        </AlertDescription>
      </Alert>
    </CardHeader>

    <CardContent class="space-y-6">
      <div v-if="props.graph" class="space-y-4 rounded-2xl border border-border/70 bg-muted/20 p-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-medium text-foreground">Graph Settings</p>
            <p class="text-xs leading-5 text-muted-foreground">
              {{ props.graph.nodes.length }} nodes and {{ props.graph.edges.length }} connections in this rule graph.
            </p>
          </div>
          <div class="flex items-center gap-2">
            <Switch
              :checked="props.graph.isEnabled"
              @update:checked="updateGraph({ isEnabled: $event })"
            />
            <Label>Enabled</Label>
          </div>
        </div>

        <div class="space-y-2">
          <Label>Name</Label>
          <Input
            :model-value="props.graph.name"
            placeholder="Zombie kill reward"
            @update:model-value="updateGraph({ name: $event })"
          />
        </div>

        <div class="space-y-2">
          <Label>Description</Label>
          <Textarea
            :model-value="props.graph.description"
            :rows="4"
            placeholder="Describe what this rule is supposed to do."
            @update:model-value="updateGraph({ description: $event })"
          />
        </div>
      </div>

      <div v-if="props.selectedNode" class="space-y-4 rounded-2xl border border-border/70 bg-background/80 p-4">
        <div class="flex items-center justify-between gap-3">
          <div>
            <p class="text-sm font-medium text-foreground">Selected Node</p>
            <p class="text-xs uppercase tracking-[0.35em] text-muted-foreground">{{ props.selectedNode.type }}</p>
          </div>
          <Button variant="ghost" size="sm" @click="emit('remove-node', props.selectedNode.id)">
            Remove node
          </Button>
        </div>

        <div class="space-y-2">
          <Label>Label</Label>
          <Input
            :model-value="props.selectedNode.label"
            placeholder="Reward player"
            @update:model-value="updateSelectedNodeLabel($event)"
          />
        </div>

        <template v-if="selectedTrigger">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2 sm:col-span-2">
              <Label>Event</Label>
              <Select :model-value="selectedTrigger.data.eventKey" @update:model-value="updateTriggerData({ eventKey: $event })">
                <SelectTrigger>
                  <SelectValue placeholder="Choose event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in automationEventOptions"
                    :key="option.key"
                    :value="option.key"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label>Scope</Label>
              <Select :model-value="selectedTrigger.data.scope" @update:model-value="updateTriggerData({ scope: $event })">
                <SelectTrigger>
                  <SelectValue placeholder="Choose scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="scope in automationExecutionScopes" :key="scope" :value="scope">
                    {{ scope }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label>Dedupe Key</Label>
              <Input
                :model-value="selectedTrigger.data.dedupeKey"
                placeholder="item.fullType"
                @update:model-value="updateTriggerData({ dedupeKey: $event })"
              />
            </div>

            <div class="space-y-2">
              <Label>Cooldown Seconds</Label>
              <NumericInput
                :model-value="selectedTrigger.data.cooldownSeconds ?? ''"
                min="0"
                placeholder="Optional"
                :empty-value="null"
                @update:model-value="updateTriggerData({ cooldownSeconds: typeof $event === 'number' ? $event : null })"
              />
            </div>
          </div>

          <TelemetryAutomationChecksEditor
            v-model="triggerFilters"
            title="Trigger Filters"
            helper="Use trigger filters when the event should only enter the graph for a matching item, kill type, stat band, or payload field."
            empty-label="No trigger filters yet. Add one when the event should only match specific payload values."
          />

          <div class="space-y-2">
            <Label>Notes</Label>
            <Textarea
              :model-value="selectedTrigger.data.notes"
              :rows="3"
              placeholder="Explain why this event exists or what the dedupe key is guarding."
              @update:model-value="updateTriggerData({ notes: $event })"
            />
          </div>
        </template>

        <template v-else-if="selectedCondition">
          <div class="space-y-2">
            <Label>Combinator</Label>
            <Select :model-value="selectedCondition.data.combinator" @update:model-value="updateConditionData({ combinator: $event })">
              <SelectTrigger>
                <SelectValue placeholder="Choose combinator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="combinator in automationConditionCombinators" :key="combinator" :value="combinator">
                  {{ combinator.toUpperCase() }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <TelemetryAutomationChecksEditor
            v-model="conditionChecks"
            title="Branch Checks"
            helper="Condition nodes can look at event fields, player stats, item metadata, or flags that earlier actions already set."
            empty-label="No checks yet. Add at least one to make the condition branch meaningful."
          />

          <div class="space-y-2">
            <Label>Notes</Label>
            <Textarea
              :model-value="selectedCondition.data.notes"
              :rows="3"
              placeholder="Capture the rule intent, like why this branch exists or which flags it depends on."
              @update:model-value="updateConditionData({ notes: $event })"
            />
          </div>
        </template>

        <template v-else-if="selectedAction">
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="space-y-2 sm:col-span-2">
              <Label>Action Kind</Label>
              <Select :model-value="selectedAction.data.actionKind" @update:model-value="updateActionData({ actionKind: $event })">
                <SelectTrigger>
                  <SelectValue placeholder="Choose action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem
                    v-for="option in automationActionOptions"
                    :key="option.key"
                    :value="option.key"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div class="space-y-2">
              <Label>Target Scope</Label>
              <Select :model-value="selectedAction.data.targetScope" @update:model-value="updateActionData({ targetScope: $event })">
                <SelectTrigger>
                  <SelectValue placeholder="Choose scope" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem v-for="scope in automationExecutionScopes" :key="scope" :value="scope">
                    {{ scope }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div v-if="selectedAction.data.actionKind !== 'setFlag' && selectedAction.data.actionKind !== 'unsetFlag'" class="space-y-2">
              <Label>Amount</Label>
              <NumericInput
                :model-value="selectedAction.data.amount ?? ''"
                min="0"
                placeholder="0"
                :empty-value="null"
                @update:model-value="updateActionData({ amount: typeof $event === 'number' ? $event : null })"
              />
            </div>

            <div v-if="selectedAction.data.actionKind === 'assignLoot'" class="space-y-2">
              <Label>Item ID</Label>
              <Input
                :model-value="selectedAction.data.itemId"
                placeholder="Base.Axe"
                @update:model-value="updateActionData({ itemId: $event })"
              />
            </div>

            <div v-if="selectedAction.data.actionKind === 'assignLoot'" class="space-y-2">
              <Label>Loot Table</Label>
              <Input
                :model-value="selectedAction.data.lootTableId"
                placeholder="starter.weapons"
                @update:model-value="updateActionData({ lootTableId: $event })"
              />
            </div>

            <div v-if="selectedAction.data.actionKind === 'assignLoot'" class="space-y-2">
              <Label>Quantity</Label>
              <NumericInput
                :model-value="selectedAction.data.quantity ?? ''"
                min="1"
                placeholder="1"
                :empty-value="null"
                @update:model-value="updateActionData({ quantity: typeof $event === 'number' ? $event : null })"
              />
            </div>

            <div v-if="selectedAction.data.actionKind === 'assignInGameXp'" class="space-y-2">
              <Label>Skill Key</Label>
              <Input
                :model-value="selectedAction.data.skillKey"
                placeholder="Axe"
                @update:model-value="updateActionData({ skillKey: $event })"
              />
            </div>

            <div v-if="selectedAction.data.actionKind === 'assignPzmXp'" class="space-y-2">
              <Label>XP Category</Label>
              <Input
                :model-value="selectedAction.data.xpCategory"
                placeholder="combat"
                @update:model-value="updateActionData({ xpCategory: $event })"
              />
            </div>

            <div v-if="selectedAction.data.actionKind === 'setFlag' || selectedAction.data.actionKind === 'unsetFlag'" class="space-y-2 sm:col-span-2">
              <Label>Flag Key</Label>
              <Input
                :model-value="selectedAction.data.flagKey"
                placeholder="reward.first-axe"
                @update:model-value="updateActionData({ flagKey: $event })"
              />
            </div>
          </div>

          <div class="space-y-2">
            <Label>Notes</Label>
            <Textarea
              :model-value="selectedAction.data.notes"
              :rows="3"
              placeholder="Document why this action exists, especially when it mutates a flag or grants a large payout."
              @update:model-value="updateActionData({ notes: $event })"
            />
          </div>
        </template>
      </div>

      <div v-else-if="props.graph" class="rounded-2xl border border-dashed border-border/70 bg-muted/10 p-6 text-sm text-muted-foreground">
        Select a node on the canvas to edit its event source, condition checks, flag logic, or reward payload.
      </div>

      <div v-else class="rounded-2xl border border-dashed border-border/70 bg-muted/10 p-6 text-sm text-muted-foreground">
        Add or select a rule graph to start editing the automation studio.
      </div>
    </CardContent>
  </Card>
</template>