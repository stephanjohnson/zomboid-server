<script setup lang="ts">
import { ImageIcon } from 'lucide-vue-next'

import { cn } from '@/lib/utils'

withDefaults(defineProps<{
  src?: string | null
  alt: string
  sizeClass?: string
  imageClass?: string
}>(), {
  src: null,
  sizeClass: 'size-20',
  imageClass: 'object-cover',
})
</script>

<template>
  <div :class="cn('relative overflow-hidden rounded-xl border border-border/70 bg-muted/40', sizeClass)">
    <img
      v-if="src"
      :src="src"
      :alt="alt"
      loading="lazy"
      :class="cn('size-full', imageClass)"
    >
    <div
      v-else
      class="flex size-full items-center justify-center bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.18),transparent_60%),linear-gradient(135deg,rgba(148,163,184,0.18),rgba(15,23,42,0.08))]"
    >
      <div class="flex flex-col items-center gap-1 text-muted-foreground">
        <ImageIcon class="size-5" />
        <span class="text-[10px] font-medium uppercase tracking-[0.18em]">No Preview</span>
      </div>
    </div>
  </div>
</template>