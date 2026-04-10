<script setup lang="ts">
import type { AutomationPredicate } from '~~/shared/telemetry-automation'

import {
  automationConditionSourceOptions,
  automationOperatorOptions,
  createAutomationPredicate,
} from '~~/shared/telemetry-automation'

const model = defineModel<AutomationPredicate[]>({ required: true })

const props = defineProps<{
  title: string
  helper: string
  emptyLabel: string
}>()

const valueTypeOptions = [
  { value: 'string', label: 'String' },
  { value: 'number', label: 'Number' },
  { value: 'boolean', label: 'Boolean' },
] as const

const noValueOperators = new Set(['exists', 'notExists', 'isTrue', 'isFalse'])

function addCheck() {
  model.value = [...model.value, createAutomationPredicate()]
}

function removeCheck(index: number) {
  model.value = model.value.filter((_, currentIndex) => currentIndex !== index)
}

function sourceExample(source: AutomationPredicate['source']) {
  return automationConditionSourceOptions.find(option => option.key === source)?.examples[0] ?? 'player.id'
}

function operatorNeedsValue(operator: AutomationPredicate['operator']) {
  return !noValueOperators.has(operator)
}
</script>

<template>
  <div class="space-y-3 rounded-2xl border border-border/70 bg-background/70 p-4">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div class="space-y-1">
        <p class="text-sm font-medium text-foreground">{{ props.title }}</p>
        <p class="text-xs leading-5 text-muted-foreground">{{ props.helper }}</p>
      </div>
      <Button size="sm" variant="outline" @click="addCheck()">
        Add check
      </Button>
    </div>

    <div v-if="model.length" class="space-y-3">
      <div
        v-for="(check, index) in model"
        :key="check.id"
        class="rounded-xl border border-border/60 bg-muted/20 p-3"
      >
        <div class="space-y-3">
          <div class="space-y-2">
            <Label>Source</Label>
            <Select v-model="check.source">
              <SelectTrigger>
                <SelectValue placeholder="Choose data source" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in automationConditionSourceOptions"
                  :key="option.key"
                  :value="option.key"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label>Path</Label>
            <Input v-model="check.path" :placeholder="sourceExample(check.source)" />
          </div>

          <div class="space-y-2">
            <Label>Operator</Label>
            <Select v-model="check.operator">
              <SelectTrigger>
                <SelectValue placeholder="Choose operator" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in automationOperatorOptions"
                  :key="option.key"
                  :value="option.key"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label>Value Type</Label>
            <Select v-model="check.valueType">
              <SelectTrigger>
                <SelectValue placeholder="Choose value type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem
                  v-for="option in valueTypeOptions"
                  :key="option.value"
                  :value="option.value"
                >
                  {{ option.label }}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-2">
            <Label>Comparison Value</Label>
            <Input
              v-model="check.value"
              :disabled="!operatorNeedsValue(check.operator)"
              :placeholder="operatorNeedsValue(check.operator) ? 'Base.Axe' : 'No value required for this operator'"
            />
          </div>

          <div class="flex justify-end">
            <Button variant="ghost" size="sm" @click="removeCheck(index)">
              Remove
            </Button>
          </div>
        </div>
      </div>
    </div>

    <p v-else class="text-sm text-muted-foreground">
      {{ props.emptyLabel }}
    </p>
  </div>
</template>