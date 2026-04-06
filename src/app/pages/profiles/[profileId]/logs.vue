<script setup lang="ts">
import { useIntervalFn } from '@vueuse/core'
import { ArrowDownToLine, ArrowUpDown, RefreshCw, Trash2 } from 'lucide-vue-next'

const route = useRoute()
const profileId = route.params.profileId as string

const { data: logs, refresh: refreshLogs, pending: logsLoading } = useLazyFetch('/api/zomboid/logs', {
  default: () => ({ containerLogs: '', serverConsole: '', previousConsole: null as string | null }),
})

const activeTab = ref('console')
const follow = ref(true)
const reverse = ref(false)

const { pause, resume } = useIntervalFn(() => {
  refreshLogs()
}, 5000, { immediate: true })

onScopeDispose(pause)

async function deletePreviousLog() {
  await $fetch('/api/zomboid/logs/previous', { method: 'DELETE' })
  await refreshLogs()
  if (activeTab.value === 'previous') {
    activeTab.value = 'console'
  }
}
</script>

<template>
  <div class="flex flex-1 flex-col gap-4 min-h-0">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-lg font-semibold">
          Server Logs
        </h1>
        <p class="text-sm text-muted-foreground">
          Live server console auto-refreshes every 5 seconds. Container logs show startup and installer history.
        </p>
      </div>
      <div class="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="outline"
              size="sm"
              :class="follow ? 'border-emerald-600 text-emerald-600 hover:bg-emerald-600/10' : ''"
              @click="follow = !follow"
            >
              <ArrowDownToLine class="size-4" />
              <span class="hidden sm:inline">Follow</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Auto-scroll to newest log entries</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger as-child>
            <Button
              variant="outline"
              size="sm"
              :class="reverse ? 'border-blue-600 text-blue-600 hover:bg-blue-600/10' : ''"
              @click="reverse = !reverse"
            >
              <ArrowUpDown class="size-4" />
              <span class="hidden sm:inline">Newest First</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Reverse log order (newest lines at top)</TooltipContent>
        </Tooltip>
        <Button variant="outline" size="sm" :disabled="logsLoading" @click="refreshLogs">
          <RefreshCw class="size-4" :class="logsLoading ? 'animate-spin' : ''" />
          <span class="hidden sm:inline">Refresh</span>
        </Button>
      </div>
    </div>

    <div v-if="logsLoading && !logs?.serverConsole" class="flex flex-1 flex-col gap-4 min-h-0">
      <div class="flex gap-2 self-start">
        <Skeleton class="h-9 w-40" />
        <Skeleton class="h-9 w-36" />
        <Skeleton class="h-9 w-36" />
      </div>
      <Skeleton class="flex-1 min-h-[200px] rounded-md" />
    </div>

    <div v-else class="flex flex-1 flex-col min-h-0">
      <Tabs v-model="activeTab" class="flex flex-1 flex-col min-h-0">
        <TabsList class="self-start">
          <TabsTrigger value="console">
            Live Server Console
          </TabsTrigger>
          <TabsTrigger v-if="logs?.previousConsole" value="previous">
            Previous Console
          </TabsTrigger>
          <TabsTrigger value="container">
            Container Logs
          </TabsTrigger>
        </TabsList>
        <TabsContent value="console" class="flex flex-1 flex-col min-h-0 mt-4">
          <LogViewer
            :value="logs?.serverConsole ?? ''"
            placeholder="server-console.txt not available yet."
            :follow="follow"
            :reverse="reverse"
          />
        </TabsContent>
        <TabsContent v-if="logs?.previousConsole" value="previous" class="flex flex-1 flex-col min-h-0 mt-4">
          <div class="flex items-center justify-end mb-2">
            <Button variant="outline" size="sm" class="text-destructive hover:bg-destructive/10" @click="deletePreviousLog">
              <Trash2 class="size-4" />
              <span class="hidden sm:inline">Clear Previous Log</span>
            </Button>
          </div>
          <LogViewer
            :value="logs.previousConsole"
            placeholder="No previous console log."
            :follow="false"
            :reverse="reverse"
          />
        </TabsContent>
        <TabsContent value="container" class="flex flex-1 flex-col min-h-0 mt-4">
          <LogViewer
            :value="logs?.containerLogs ?? ''"
            placeholder="No container logs yet."
            :follow="follow"
            :reverse="reverse"
          />
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>
