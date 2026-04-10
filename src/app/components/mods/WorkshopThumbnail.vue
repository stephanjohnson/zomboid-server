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
      class="flex size-full items-center justify-center bg-gradient-to-br from-muted/70 to-background"
    >
      <div class="flex flex-col items-center gap-1 text-muted-foreground">
        <ImageIcon class="size-5" />
        <span class="text-xs font-medium">No Preview</span>
      </div>
    </div>
  </div>
</template>