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
import { cn } from '@/lib/utils'

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

const badgeClass = computed(() => {
  switch (normalizedStatus.value.state) {
    case 'ok':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700'
    case 'installing':
      return 'border-amber-200 bg-amber-50 text-amber-700'
    case 'faulty':
      return 'border-orange-200 bg-orange-50 text-orange-700'
    case 'error':
      return 'border-red-200 bg-red-50 text-red-700'
    default:
      return 'border-slate-200 bg-slate-50 text-slate-700'
  }
})
</script>

<template>
  <Tooltip>
    <TooltipTrigger as-child>
      <Badge variant="outline" :class="cn('w-fit cursor-help', badgeClass)">
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