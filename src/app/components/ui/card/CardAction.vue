<script setup lang="ts">
import type { HTMLAttributes } from "vue"
import { cn } from "@/lib/utils"

const props = defineProps<{
  class?: HTMLAttributes["class"]
}>()
</script>

<template>
  <div data-slot="card-action" :class="cn('self-start justify-self-end', props.class)">
    <slot />
  </div>
</template>
