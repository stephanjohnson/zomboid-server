<script setup lang="ts">
import {
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Loader2,
  XCircle,
} from 'lucide-vue-next'

import type { ProfileModRuntimeStatus } from '@/composables/useProfileModStatuses'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const props = defineProps<{
  status?: ProfileModRuntimeStatus | null
  loading?: boolean
}>()

const normalizedStatus = computed(() => {
  if (props.status) {
    return props.status
  }

  if (props.loading) {
    return {
      state: 'installing',
      label: 'Checking',
      detail: 'Checking mod runtime status.',
      progress: null,
    } as const
  }

  return {
    state: 'unknown',
    label: 'Unknown',
    detail: 'No runtime evidence yet.',
    progress: null,
  } as const
})

const badgeVariant = computed(() => {
  switch (normalizedStatus.value.state) {
    case 'ok':
      return 'default'
    case 'installing':
    case 'faulty':
      return 'outline'
    case 'error':
      return 'destructive'
    default:
      return 'secondary'
  }
})
</script>

<template>
  <Tooltip>
    <TooltipTrigger as-child>
      <Badge :variant="badgeVariant" class="w-fit cursor-help">
        <CheckCircle2 v-if="normalizedStatus.state === 'ok'" class="size-3.5" />
        <Loader2 v-else-if="normalizedStatus.state === 'installing'" class="size-3.5 animate-spin" />
        <AlertTriangle v-else-if="normalizedStatus.state === 'faulty'" class="size-3.5" />
        <XCircle v-else-if="normalizedStatus.state === 'error'" class="size-3.5" />
        <HelpCircle v-else class="size-3.5" />
        <span>{{ normalizedStatus.label }}</span>
      </Badge>
    </TooltipTrigger>
    <TooltipContent side="top" class="max-w-xs text-pretty">
      {{ normalizedStatus.detail }}
    </TooltipContent>
  </Tooltip>
</template>