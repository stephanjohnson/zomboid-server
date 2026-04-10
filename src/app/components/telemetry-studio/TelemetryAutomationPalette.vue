<script setup lang="ts">
import {
  automationNodeDragMimeType,
  automationPaletteSections,
  type AutomationNodeCreateRequest,
  type AutomationNodeType,
} from '~~/shared/telemetry-automation'

const emit = defineEmits<{
  (e: 'add-node', request: AutomationNodeCreateRequest): void
}>()

function addNode(type: AutomationNodeType) {
  emit('add-node', { type })
}

function handleDragStart(event: DragEvent, type: AutomationNodeType) {
  if (!event.dataTransfer) {
    return
  }

  event.dataTransfer.effectAllowed = 'copy'
  event.dataTransfer.setData(automationNodeDragMimeType, type)
  event.dataTransfer.setData('text/plain', type)
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1.5">
      <p class="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
        Node Library
      </p>
      <p class="text-sm leading-6 text-muted-foreground">
        Drag a node onto the canvas or click a card to append it to the current graph.
      </p>
    </div>

    <section v-for="section in automationPaletteSections" :key="section.key" class="space-y-3">
      <div class="space-y-1">
        <p class="text-sm font-semibold text-foreground">{{ section.title }}</p>
        <p class="text-xs leading-5 text-muted-foreground">{{ section.description }}</p>
      </div>

      <div class="space-y-2">
        <button
          v-for="item in section.items"
          :key="item.type"
          type="button"
          draggable="true"
          class="group flex w-full cursor-grab flex-col rounded-xl border border-border/70 bg-card px-3 py-3 text-left shadow-sm transition hover:border-border hover:bg-muted/20 hover:shadow-md active:cursor-grabbing"
          @click="addNode(item.type)"
          @dragstart="handleDragStart($event, item.type)"
        >
          <div class="flex items-start justify-between gap-3">
            <div class="min-w-0 space-y-1">
              <p class="text-sm font-medium text-foreground">{{ item.title }}</p>
              <p class="text-xs leading-5 text-muted-foreground">{{ item.description }}</p>
            </div>

            <Badge
              variant="outline"
              class="shrink-0 border-border/70 bg-background/80 text-[11px] font-medium text-muted-foreground"
            >
              {{ item.badge }}
            </Badge>
          </div>
        </button>
      </div>
    </section>
  </div>
</template>
