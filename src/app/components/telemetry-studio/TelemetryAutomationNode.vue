<script setup lang="ts">
import { computed } from 'vue'
import { Handle, Position, type NodeProps } from '@vue-flow/core'

import {
  findAutomationActionOption,
  findAutomationEventOption,
  type AutomationActionNodeData,
  type AutomationConditionNodeData,
  type AutomationNodeType,
  type AutomationTriggerNodeData,
} from '~~/shared/telemetry-automation'

type AutomationNodeData = AutomationTriggerNodeData | AutomationConditionNodeData | AutomationActionNodeData

const props = defineProps<NodeProps<AutomationNodeData, object, AutomationNodeType>>()

const title = computed(() => typeof props.label === 'string' ? props.label : 'Rule node')

const toneClass = computed(() => {
  if (props.type === 'trigger') {
    return 'border-sky-300/70 bg-sky-50/95'
  }

  if (props.type === 'condition') {
    return 'border-amber-300/70 bg-amber-50/95'
  }

  return 'border-emerald-300/70 bg-emerald-50/95'
})

const kindLabel = computed(() => {
  if (props.type === 'trigger') {
    return 'Trigger'
  }

  if (props.type === 'condition') {
    return 'Condition'
  }

  return 'Action'
})

const summary = computed(() => {
  if (props.type === 'trigger') {
    const eventOption = findAutomationEventOption((props.data as AutomationTriggerNodeData).eventKey)
    return eventOption?.description ?? (props.data as AutomationTriggerNodeData).eventKey
  }

  if (props.type === 'condition') {
    const conditionData = props.data as AutomationConditionNodeData
    return `${conditionData.combinator.toUpperCase()} ${conditionData.checks.length} check${conditionData.checks.length === 1 ? '' : 's'} before the rule continues.`
  }

  const actionData = props.data as AutomationActionNodeData
  const actionOption = findAutomationActionOption(actionData.actionKind)

  if (actionData.actionKind === 'assignCashReward') {
    return `${actionData.amount ?? 0} credits to the ${actionData.targetScope}.`
  }

  if (actionData.actionKind === 'assignPzmXp') {
    return `${actionData.amount ?? 0} ${actionData.xpCategory || 'general'} PZM XP.`
  }

  if (actionData.actionKind === 'assignInGameXp') {
    return `${actionData.amount ?? 0} XP in ${actionData.skillKey || 'a chosen skill'}.`
  }

  if (actionData.actionKind === 'assignLoot') {
    return `Grant ${actionData.quantity ?? 1}x ${actionData.itemId || actionData.lootTableId || 'loot drop'}.`
  }

  return `${actionOption?.label ?? 'Flag action'} ${actionData.flagKey || 'flag.key'} on the ${actionData.targetScope}.`
})

const metaChips = computed(() => {
  if (props.type === 'trigger') {
    const triggerData = props.data as AutomationTriggerNodeData
    return [
      triggerData.scope,
      triggerData.filters.length ? `${triggerData.filters.length} filters` : 'no filters',
      triggerData.dedupeKey ? `dedupe ${triggerData.dedupeKey}` : 'repeatable',
    ]
  }

  if (props.type === 'condition') {
    const conditionData = props.data as AutomationConditionNodeData
    return [conditionData.combinator, `${conditionData.checks.length} checks`]
  }

  const actionData = props.data as AutomationActionNodeData
  return [actionData.targetScope, findAutomationActionOption(actionData.actionKind)?.label ?? actionData.actionKind]
})
</script>

<template>
  <div
    class="relative min-w-[240px] rounded-[22px] border px-4 py-3 shadow-sm transition-transform duration-150"
    :class="[
      toneClass,
      props.selected ? 'scale-[1.01] shadow-lg ring-2 ring-slate-900/10' : 'shadow-sm',
    ]"
  >
    <Handle
      v-if="props.type !== 'trigger'"
      type="target"
      :position="Position.Left"
      :connectable="props.connectable"
      class="!h-3 !w-3 !border-2 !border-slate-950/20 !bg-white"
    />

    <div class="space-y-3">
      <div class="flex items-center justify-between gap-3">
        <Badge variant="secondary" class="border border-white/70 bg-white/80 text-[11px] uppercase tracking-[0.2em] text-slate-700">
          {{ kindLabel }}
        </Badge>
        <span class="text-[11px] uppercase tracking-[0.2em] text-slate-500">
          {{ props.id.slice(-4) }}
        </span>
      </div>

      <div class="space-y-1.5">
        <p class="text-sm font-semibold text-slate-950">{{ title }}</p>
        <p class="text-xs leading-5 text-slate-600">{{ summary }}</p>
      </div>

      <div class="flex flex-wrap gap-1.5">
        <Badge
          v-for="chip in metaChips"
          :key="chip"
          variant="outline"
          class="border-slate-950/10 bg-white/60 text-[11px] text-slate-700"
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
        class="!top-[38%] !h-3 !w-3 !border-2 !border-emerald-500 !bg-white"
      />
      <Handle
        id="false"
        type="source"
        :position="Position.Right"
        :connectable="props.connectable"
        class="!top-[72%] !h-3 !w-3 !border-2 !border-rose-500 !bg-white"
      />
      <span class="pointer-events-none absolute right-4 top-[30%] text-[10px] font-semibold uppercase tracking-[0.24em] text-emerald-700">True</span>
      <span class="pointer-events-none absolute right-4 top-[64%] text-[10px] font-semibold uppercase tracking-[0.24em] text-rose-700">False</span>
    </template>

    <Handle
      v-else
      type="source"
      :position="Position.Right"
      :connectable="props.connectable"
      class="!h-3 !w-3 !border-2 !border-slate-950/20 !bg-white"
    />
  </div>
</template>