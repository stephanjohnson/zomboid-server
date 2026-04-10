<script setup lang="ts">
import type { HTMLAttributes } from 'vue'

const props = withDefaults(defineProps<{
  modelValue?: number | string | null
  id?: string
  name?: string
  placeholder?: string
  min?: number
  max?: number
  step?: number
  disabled?: boolean
  readonly?: boolean
  required?: boolean
  valueType?: 'number' | 'string'
  emptyValue?: number | string | null | undefined
  inputClass?: HTMLAttributes['class']
}>(), {
  valueType: 'number',
  emptyValue: '',
  inputClass: 'h-10',
})

const emit = defineEmits<{
  (e: 'update:modelValue', payload: number | string | null | undefined): void
}>()

const numericValue = computed(() => {
  if (props.modelValue === '' || props.modelValue === null || props.modelValue === undefined) {
    return undefined
  }

  const parsedValue = Number(props.modelValue)
  return Number.isFinite(parsedValue) ? parsedValue : undefined
})

function updateValue(nextValue: number | null | undefined) {
  if (nextValue === null || nextValue === undefined || Number.isNaN(nextValue)) {
    emit('update:modelValue', props.emptyValue)
    return
  }

  emit('update:modelValue', props.valueType === 'string' ? String(nextValue) : nextValue)
}
</script>

<template>
  <NumberField
    :id="id"
    :name="name"
    :model-value="numericValue"
    :min="min"
    :max="max"
    :step="step"
    :disabled="disabled"
    :readonly="readonly"
    :required="required"
    @update:model-value="updateValue"
  >
    <NumberFieldContent>
      <NumberFieldDecrement />
      <NumberFieldInput :placeholder="placeholder" :class="inputClass" />
      <NumberFieldIncrement />
    </NumberFieldContent>
  </NumberField>
</template>