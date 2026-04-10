<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position, type NodeProps } from '@vue-flow/core'

import { humanizeConfigKey } from '~~/shared/config-settings'
import {
  findAutomationActionOptionForNodeType,
  findAutomationNodeCatalogItem,
  findAutomationTriggerEventOption,
  getAutomationNodeKind,
  type AutomationActionNode,
  type AutomationConditionNode,
  type AutomationNodeType,
  type AutomationStudioNode,
  type AutomationTriggerNode,
} from '~~/shared/telemetry-automation'

const props = defineProps<NodeProps<AutomationStudioNode['data'], object, AutomationNodeType>>()

const nodeKind = computed(() => getAutomationNodeKind(props.type))
const nodeMeta = computed(() => findAutomationNodeCatalogItem(props.type) ?? null)
const triggerNode = computed(() => nodeKind.value === 'trigger' ? props as NodeProps<AutomationTriggerNode['data'], object, AutomationTriggerNode['type']> : null)
const conditionNode = computed(() => props.type === 'condition' ? props as NodeProps<AutomationConditionNode['data'], object, 'condition'> : null)
const actionNode = computed(() => nodeKind.value === 'action' ? props as NodeProps<AutomationActionNode['data'], object, AutomationActionNode['type']> : null)

const title = computed(() => typeof props.label === 'string' ? props.label : nodeMeta.value?.title ?? 'Rule node')

const toneClass = computed(() => {
  if (nodeKind.value === 'trigger') {
    return 'border-primary/30 bg-card/95'
  }

  if (nodeKind.value === 'condition') {
    return 'border-accent/70 bg-card/95'
  }

  return 'border-secondary bg-card/95'
})

const kindLabel = computed(() => {
  if (nodeKind.value === 'trigger') {
    return 'Trigger'
  }

  if (nodeKind.value === 'condition') {
    return 'Condition'
  }

  return 'Action'
})

const summary = computed(() => {
  if (triggerNode.value) {
    const eventOption = findAutomationTriggerEventOption(triggerNode.value.type)
    return eventOption?.description ?? nodeMeta.value?.description ?? 'Starts the workflow when this event arrives.'
  }

  if (conditionNode.value) {
    const conditionData = conditionNode.value.data
    return `${conditionData.combinator.toUpperCase()} ${conditionData.checks.length} check${conditionData.checks.length === 1 ? '' : 's'} before the rule continues.`
  }

  if (!actionNode.value) {
    return nodeMeta.value?.description ?? 'Rule node'
  }

  const actionOption = findAutomationActionOptionForNodeType(actionNode.value.type)

  if (actionNode.value.type === 'action-assign-cash') {
    return `${actionNode.value.data.amount ?? 0} credits to the ${actionNode.value.data.targetScope}.`
  }

  if (actionNode.value.type === 'action-assign-pzm-xp') {
    return `${actionNode.value.data.amount ?? 0} ${actionNode.value.data.xpCategory || 'general'} PZM XP.`
  }

  if (actionNode.value.type === 'action-assign-ingame-xp') {
    return `${actionNode.value.data.amount ?? 0} XP in ${actionNode.value.data.skillKey || 'a chosen skill'}.`
  }

  if (actionNode.value.type === 'action-assign-loot') {
    return `Grant ${actionNode.value.data.quantity ?? 1}x ${actionNode.value.data.itemId || actionNode.value.data.lootTableId || 'loot drop'}.`
  }

  if (actionNode.value.type === 'action-update-server-setting') {
    return `Set ${humanizeConfigKey(actionNode.value.data.settingKey || 'server setting')} to ${actionNode.value.data.settingValue || 'value'}.`
  }

  return `${actionOption?.label ?? 'Flag action'} ${actionNode.value.data.flagKey || 'flag.key'} on the ${actionNode.value.data.targetScope}.`
})

const metaChips = computed(() => {
  if (triggerNode.value) {
    const eventOption = findAutomationTriggerEventOption(triggerNode.value.type)
    return [
      eventOption?.scope ?? 'player',
      triggerNode.value.data.filters.length ? `${triggerNode.value.data.filters.length} filters` : 'no filters',
      triggerNode.value.data.dedupeKey ? `dedupe ${triggerNode.value.data.dedupeKey}` : 'repeatable',
    ]
  }

  if (conditionNode.value) {
    return [conditionNode.value.data.combinator, `${conditionNode.value.data.checks.length} checks`]
  }

  if (!actionNode.value) {
    return []
  }

  if (actionNode.value.type === 'action-update-server-setting') {
    return ['server', actionNode.value.data.valueType]
  }

  return [
    actionNode.value.data.targetScope,
    findAutomationActionOptionForNodeType(actionNode.value.type)?.label ?? actionNode.value.type,
  ]
})
</script>

<template>
  <div
    class="relative min-w-60 rounded-xl border px-4 py-3 shadow-sm transition-transform duration-200"
    :class="[
      toneClass,
      props.selected ? 'scale-[1.01] shadow-lg ring-2 ring-border' : 'shadow-sm',
    ]"
  >
    <Handle
      v-if="nodeKind !== 'trigger'"
      type="target"
      :position="Position.Left"
      :connectable="props.connectable"
      class="!h-3 !w-3 !border-2 !border-border !bg-background"
    />

    <div class="space-y-3">
      <div class="flex items-center justify-between gap-3">
        <Badge variant="secondary" class="border border-card/70 bg-card/80 text-xs uppercase tracking-[0.35em] text-foreground">
          {{ kindLabel }}
        </Badge>
        <span class="text-xs uppercase tracking-[0.35em] text-muted-foreground">
          {{ props.id.slice(-4) }}
        </span>
      </div>

      <div class="space-y-1.5">
        <p class="text-sm font-semibold text-foreground">{{ title }}</p>
        <p class="text-xs leading-5 text-muted-foreground">{{ summary }}</p>
      </div>

      <div class="flex flex-wrap gap-1.5">
        <Badge
          v-for="chip in metaChips"
          :key="chip"
          variant="outline"
          class="border-border bg-card/60 text-xs text-foreground"
        >
          {{ chip }}
        </Badge>
      </div>
    </div>

    <template v-if="props.type === 'condition'">
      <Handle
        id="true"
        type="source"
        :position="Position.Right"
        :connectable="props.connectable"
        class="!top-[38%] !h-3 !w-3 !border-2 !border-primary !bg-background"
      />
      <Handle
        id="false"
        type="source"
        :position="Position.Right"
        :connectable="props.connectable"
        class="!top-[72%] !h-3 !w-3 !border-2 !border-destructive !bg-background"
      />
      <span class="pointer-events-none absolute right-4 top-[30%] text-xs font-semibold uppercase tracking-[0.35em] text-primary">True</span>
      <span class="pointer-events-none absolute right-4 top-[64%] text-xs font-semibold uppercase tracking-[0.35em] text-destructive">False</span>
    </template>

    <Handle
      v-else
      type="source"
      :position="Position.Right"
      :connectable="props.connectable"
      class="!h-3 !w-3 !border-2 !border-border !bg-background"
    />
  </div>
</template>
