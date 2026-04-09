<script setup lang="ts">
import type { CheckboxRootEmits, CheckboxRootProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { reactiveOmit } from "@vueuse/core"
import { Check } from "lucide-vue-next"
import { CheckboxIndicator, CheckboxRoot, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

type CheckboxState = boolean | 'indeterminate' | null | undefined
type CheckboxEmitState = boolean | 'indeterminate'

const props = defineProps<CheckboxRootProps & {
  checked?: CheckboxState
  class?: HTMLAttributes["class"]
}>()

const emits = defineEmits<CheckboxRootEmits & {
  'update:checked': [value: CheckboxEmitState]
}>()

const delegatedProps = reactiveOmit(props, "checked", "class", "modelValue")

const forwardedProps = useForwardProps(delegatedProps)

function handleUpdate(value: CheckboxEmitState) {
  emits("update:modelValue", value)
  emits("update:checked", value)
}
</script>

<template>
  <CheckboxRoot
    v-bind="forwardedProps"
    :model-value="props.modelValue ?? props.checked"
    @update:model-value="handleUpdate"
    :class="
      cn('grid place-content-center peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
         props.class)"
  >
    <CheckboxIndicator class="grid place-content-center text-current">
      <slot>
        <Check class="h-4 w-4" />
      </slot>
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
