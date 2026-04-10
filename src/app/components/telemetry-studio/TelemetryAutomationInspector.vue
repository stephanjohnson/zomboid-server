<script setup lang="ts">
import { computed } from 'vue'

import TelemetryAutomationChecksEditor from '@/components/telemetry-studio/TelemetryAutomationChecksEditor.vue'

import { getConfigDefinition } from '~~/shared/config-settings'
import {
  automationConditionCombinators,
  automationExecutionScopes,
  automationServerSettingApplyModes,
  findAutomationActionOptionForNodeType,
  findAutomationNodeCatalogItem,
  findAutomationTriggerEventOption,
  getAutomationNodeKind,
  getAutomationTriggerEventKey,
  type AutomationActionNode,
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

const selectedNodeMeta = computed(() => props.selectedNode ? findAutomationNodeCatalogItem(props.selectedNode.type) ?? null : null)
const selectedTrigger = computed(() => props.selectedNode && getAutomationNodeKind(props.selectedNode.type) === 'trigger' ? props.selectedNode as AutomationTriggerNode : null)
const selectedCondition = computed(() => props.selectedNode?.type === 'condition' ? props.selectedNode as AutomationConditionNode : null)
const selectedAction = computed(() => props.selectedNode && getAutomationNodeKind(props.selectedNode.type) === 'action' ? props.selectedNode as AutomationActionNode : null)
const selectedTriggerEvent = computed(() => selectedTrigger.value ? findAutomationTriggerEventOption(selectedTrigger.value.type) : null)
const selectedActionMeta = computed(() => selectedAction.value ? findAutomationActionOptionForNodeType(selectedAction.value.type) ?? null : null)

const selectedAssignLootAction = computed(() => selectedAction.value?.type === 'action-assign-loot' ? selectedAction.value : null)
const selectedAssignInGameXpAction = computed(() => selectedAction.value?.type === 'action-assign-ingame-xp' ? selectedAction.value : null)
const selectedAssignPzmXpAction = computed(() => selectedAction.value?.type === 'action-assign-pzm-xp' ? selectedAction.value : null)
const selectedAssignCashAction = computed(() => selectedAction.value?.type === 'action-assign-cash' ? selectedAction.value : null)
const selectedSetFlagAction = computed(() => selectedAction.value?.type === 'action-set-flag' ? selectedAction.value : null)
const selectedUnsetFlagAction = computed(() => selectedAction.value?.type === 'action-unset-flag' ? selectedAction.value : null)
const selectedServerSettingAction = computed(() => selectedAction.value?.type === 'action-update-server-setting' ? selectedAction.value : null)
const selectedServerSettingDefinition = computed(() => selectedServerSettingAction.value ? getConfigDefinition('server-ini', selectedServerSettingAction.value.data.settingKey) : undefined)

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

const valueTypeOptions = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
] as const

const applyModeOptions = [
  { value: 'persist-only', label: 'Persist only' },
  { value: 'restart-server', label: 'Restart server' },
] as const

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

function updateActionData(patch: Record<string, unknown>) {
  if (!selectedAction.value) {
    return
  }

  updateNode({
    ...selectedAction.value,
    data: {
      ...selectedAction.value.data,
      ...patch,
    } as AutomationActionNode['data'],
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

function updateServerSettingKey(settingKey: string) {
  if (!selectedServerSettingAction.value) {
    return
  }

  const definition = getConfigDefinition('server-ini', settingKey)
  updateNode({
    ...selectedServerSettingAction.value,
    data: {
      ...selectedServerSettingAction.value.data,
      settingKey,
      valueType: definition?.rawType ?? selectedServerSettingAction.value.data.valueType,
    },
  })
}
</script>

<template>
  <div class="space-y-6">
    <div v-if="props.graph" class="space-y-4 rounded-2xl border border-border/70 bg-muted/15 p-4">
      <div class="space-y-1">
        <p class="text-sm font-semibold text-foreground">Graph Settings</p>
        <p class="text-xs leading-5 text-muted-foreground">
          {{ props.graph.nodes.length }} nodes and {{ props.graph.edges.length }} connections in this workflow.
        </p>
      </div>

      <div class="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-background/70 px-3 py-3">
        <div class="space-y-1">
          <p class="text-sm font-medium text-foreground">Enabled</p>
          <p class="text-xs leading-5 text-muted-foreground">
            Disabled graphs stay in the library but should not be compiled into runtime rules.
          </p>
        </div>

        <Switch
          :checked="props.graph.isEnabled"
          @update:checked="updateGraph({ isEnabled: $event })"
        />
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
          placeholder="Describe what this workflow is supposed to do."
          @update:model-value="updateGraph({ description: $event })"
        />
      </div>
    </div>

    <div v-if="props.selectedNode" class="space-y-4 rounded-2xl border border-border/70 bg-background/80 p-4">
      <div class="flex items-start justify-between gap-3">
        <div class="space-y-1">
          <div class="flex flex-wrap items-center gap-2">
            <p class="text-sm font-semibold text-foreground">
              {{ selectedNodeMeta?.title ?? 'Selected node' }}
            </p>
            <Badge variant="outline" class="border-border/70 bg-background/80 text-[11px] font-medium text-muted-foreground">
              {{ selectedNodeMeta?.badge ?? props.selectedNode.type }}
            </Badge>
          </div>
          <p class="text-xs leading-5 text-muted-foreground">
            {{ selectedNodeMeta?.description ?? 'Update the node fields below.' }}
          </p>
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

      <template v-if="selectedTrigger && selectedTriggerEvent">
        <div class="space-y-3 rounded-xl border border-border/60 bg-muted/10 p-3">
          <div class="space-y-1">
            <p class="text-sm font-medium text-foreground">{{ selectedTriggerEvent.label }}</p>
            <p class="text-xs leading-5 text-muted-foreground">{{ selectedTriggerEvent.description }}</p>
          </div>

          <div class="flex flex-wrap gap-2">
            <Badge variant="outline" class="border-border/70 bg-background/80 text-[11px] text-muted-foreground">
              {{ selectedTriggerEvent.scope }}
            </Badge>
            <Badge variant="outline" class="border-border/70 bg-background/80 text-[11px] text-muted-foreground">
              {{ getAutomationTriggerEventKey(selectedTrigger.type) }}
            </Badge>
          </div>
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

        <TelemetryAutomationChecksEditor
          v-model="triggerFilters"
          title="Trigger Filters"
          helper="Only let matching payloads enter this workflow path."
          empty-label="No trigger filters yet. Add one when the event should only match specific payload values."
        />

        <div class="space-y-2">
          <Label>Notes</Label>
          <Textarea
            :model-value="selectedTrigger.data.notes"
            :rows="3"
            placeholder="Explain why this trigger exists or what the dedupe key is protecting."
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
          helper="Use checks to decide whether the true or false branch continues."
          empty-label="No checks yet. Add at least one check to make the branch meaningful."
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
        <div class="space-y-3 rounded-xl border border-border/60 bg-muted/10 p-3">
          <div class="space-y-1">
            <p class="text-sm font-medium text-foreground">{{ selectedActionMeta?.label ?? 'Action' }}</p>
            <p class="text-xs leading-5 text-muted-foreground">
              {{ selectedActionMeta?.description ?? 'Configure the effect that should run when this path completes.' }}
            </p>
          </div>
        </div>

        <div v-if="!selectedServerSettingAction" class="space-y-2">
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

        <template v-if="selectedAssignLootAction">
          <div class="space-y-2">
            <Label>Item ID</Label>
            <Input
              :model-value="selectedAssignLootAction.data.itemId"
              placeholder="Base.Axe"
              @update:model-value="updateActionData({ itemId: $event })"
            />
          </div>

          <div class="space-y-2">
            <Label>Loot Table</Label>
            <Input
              :model-value="selectedAssignLootAction.data.lootTableId"
              placeholder="starter.weapons"
              @update:model-value="updateActionData({ lootTableId: $event })"
            />
          </div>

          <div class="space-y-2">
            <Label>Quantity</Label>
            <NumericInput
              :model-value="selectedAssignLootAction.data.quantity ?? ''"
              min="1"
              placeholder="1"
              :empty-value="null"
              @update:model-value="updateActionData({ quantity: typeof $event === 'number' ? $event : null })"
            />
          </div>
        </template>

        <template v-else-if="selectedAssignInGameXpAction">
          <div class="space-y-2">
            <Label>Amount</Label>
            <NumericInput
              :model-value="selectedAssignInGameXpAction.data.amount ?? ''"
              min="0"
              placeholder="0"
              :empty-value="null"
              @update:model-value="updateActionData({ amount: typeof $event === 'number' ? $event : null })"
            />
          </div>

          <div class="space-y-2">
            <Label>Skill Key</Label>
            <Input
              :model-value="selectedAssignInGameXpAction.data.skillKey"
              placeholder="Axe"
              @update:model-value="updateActionData({ skillKey: $event })"
            />
          </div>
        </template>

        <template v-else-if="selectedAssignPzmXpAction">
          <div class="space-y-2">
            <Label>Amount</Label>
            <NumericInput
              :model-value="selectedAssignPzmXpAction.data.amount ?? ''"
              min="0"
              placeholder="0"
              :empty-value="null"
              @update:model-value="updateActionData({ amount: typeof $event === 'number' ? $event : null })"
            />
          </div>

          <div class="space-y-2">
            <Label>XP Category</Label>
            <Input
              :model-value="selectedAssignPzmXpAction.data.xpCategory"
              placeholder="combat"
              @update:model-value="updateActionData({ xpCategory: $event })"
            />
          </div>
        </template>

        <template v-else-if="selectedAssignCashAction">
          <div class="space-y-2">
            <Label>Amount</Label>
            <NumericInput
              :model-value="selectedAssignCashAction.data.amount ?? ''"
              min="0"
              placeholder="0"
              :empty-value="null"
              @update:model-value="updateActionData({ amount: typeof $event === 'number' ? $event : null })"
            />
          </div>
        </template>

        <template v-else-if="selectedSetFlagAction">
          <div class="space-y-2">
            <Label>Flag Key</Label>
            <Input
              :model-value="selectedSetFlagAction.data.flagKey"
              placeholder="reward.first-axe"
              @update:model-value="updateActionData({ flagKey: $event })"
            />
          </div>
        </template>

        <template v-else-if="selectedUnsetFlagAction">
          <div class="space-y-2">
            <Label>Flag Key</Label>
            <Input
              :model-value="selectedUnsetFlagAction.data.flagKey"
              placeholder="reward.first-axe"
              @update:model-value="updateActionData({ flagKey: $event })"
            />
          </div>
        </template>

        <template v-else-if="selectedServerSettingAction">
          <div class="space-y-2">
            <Label>Setting Key</Label>
            <Input
              :model-value="selectedServerSettingAction.data.settingKey"
              placeholder="PVP"
              @update:model-value="updateServerSettingKey($event)"
            />
          </div>

          <div v-if="selectedServerSettingDefinition" class="space-y-1 rounded-xl border border-border/60 bg-muted/10 p-3">
            <p class="text-sm font-medium text-foreground">
              {{ selectedServerSettingDefinition.label || selectedServerSettingAction.data.settingKey }}
            </p>
            <p class="text-xs leading-5 text-muted-foreground">
              {{ selectedServerSettingDefinition.description }}
            </p>
          </div>

          <div class="space-y-2">
            <Label>Value Type</Label>
            <Select :model-value="selectedServerSettingAction.data.valueType" @update:model-value="updateActionData({ valueType: $event })">
              <SelectTrigger>
                <SelectValue placeholder="Choose value type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in valueTypeOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label>Setting Value</Label>
            <Input
              :model-value="selectedServerSettingAction.data.settingValue"
              placeholder="true"
              @update:model-value="updateActionData({ settingValue: $event })"
            />
          </div>

          <div class="space-y-2">
            <Label>Apply Mode</Label>
            <Select :model-value="selectedServerSettingAction.data.applyMode" @update:model-value="updateActionData({ applyMode: $event })">
              <SelectTrigger>
                <SelectValue placeholder="Choose apply mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem v-for="option in applyModeOptions" :key="option.value" :value="option.value">
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </template>

        <div class="space-y-2">
          <Label>Notes</Label>
          <Textarea
            :model-value="selectedAction.data.notes"
            :rows="3"
            placeholder="Document why this action exists, especially when it mutates state or grants a large payout."
            @update:model-value="updateActionData({ notes: $event })"
          />
        </div>
      </template>
    </div>

    <div v-else-if="props.graph" class="rounded-2xl border border-dashed border-border/70 bg-muted/10 p-6 text-sm text-muted-foreground">
      Select a node on the canvas to edit its fixed trigger or action settings.
    </div>

    <div v-else class="rounded-2xl border border-dashed border-border/70 bg-muted/10 p-6 text-sm text-muted-foreground">
      Open a workflow to start editing the automation graph.
    </div>
  </div>
</template>
