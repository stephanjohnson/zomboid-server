<script setup lang="ts">
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'

const route = useRoute()

const pageTitle = computed(() => {
  const parts = route.path.split('/').filter(Boolean)
  if (parts.length === 0) return 'Dashboard'
  const last = parts.at(-1) ?? 'Dashboard'
  return last.charAt(0).toUpperCase() + last.slice(1).replace(/-/g, ' ')
})
</script>

<template>
  <div>
    <NuxtLoadingIndicator color="var(--color-primary)" />
    <SidebarProvider
      :style="{
        '--sidebar-width': 'calc(var(--spacing) * 72)',
        '--header-height': 'calc(var(--spacing) * 12)',
      }"
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <header class="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height)">
          <div class="flex w-full items-center gap-1 px-4 lg:gap-2 lg:px-6">
            <SidebarTrigger class="-ml-1" />
            <Separator
              orientation="vertical"
              class="mx-2 data-[orientation=vertical]:h-4"
            />
            <h1 class="text-base font-medium">
              {{ pageTitle }}
            </h1>
          </div>
        </header>
        <div class="flex flex-1 flex-col overflow-hidden">
          <div class="@container/main flex flex-1 flex-col gap-2 overflow-hidden p-4">
            <slot />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
    <Toaster rich-colors />
  </div>
</template>
