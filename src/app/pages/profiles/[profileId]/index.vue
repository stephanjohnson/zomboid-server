<script setup lang="ts">
import { toast } from 'vue-sonner'
import {
  Archive,
  Play,
  Power,
  RefreshCw,
  RotateCcw,
} from 'lucide-vue-next'

const route = useRoute()
const profileId = route.params.profileId as string

const { status, refresh, loading } = useServerStatus()

onMounted(() => {
  refresh()
})

const { data: profile } = await useFetch(`/api/profiles/${profileId}`)
const { data: players } = useFetch('/api/players', { default: () => ({ players: [], count: 0 }) })
const { data: logs, refresh: refreshLogs, pending: logsLoading } = await useFetch('/api/zomboid/logs', {
  default: () => ({ containerLogs: '', serverConsole: '' }),
})

const actionLoading = ref<string | null>(null)
const requestUrl = useRequestURL()
const host = computed(() => requestUrl.hostname || 'localhost')

function getActionErrorMessage(error: unknown, fallback: string): string {
  return (error as { data?: { message?: string }, statusMessage?: string })?.data?.message
    || (error as { statusMessage?: string })?.statusMessage
    || fallback
}

async function serverAction(action: string) {
  actionLoading.value = action
  try {
    await $fetch(`/api/zomboid/${action}`, { method: 'POST', body: { profileId } })
    await refresh()

    toast.success(
      action === 'start'
        ? 'Server startup requested. First boot can take several minutes while SteamCMD installs Project Zomboid.'
        : action === 'restart'
          ? 'Server restart requested.'
          : 'Server stop requested.',
    )
  }
  catch (e: unknown) {
    console.error(`Failed to ${action}:`, e)
    toast.error(getActionErrorMessage(e, `Failed to ${action} server.`))
  }
  finally {
    actionLoading.value = null
  }
}

const showLogs = ref(false)
</script>

<template>
  <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
    <SectionCards :status="status" :player-count="players?.count ?? 0" />

    <!-- Quick Actions -->
    <div class="flex items-center justify-between px-4 lg:px-6">
      <div class="flex flex-wrap items-center gap-2">
        <Button
          v-if="!status?.container?.running"
          size="sm"
          class="bg-emerald-600 hover:bg-emerald-700 text-white"
          :disabled="actionLoading === 'start'"
          @click="serverAction('start')"
        >
          <Play class="size-4" />
          {{ actionLoading === 'start' ? 'Starting...' : status?.container?.exists ? 'Start Server' : 'Create & Start' }}
        </Button>
        <Button
          v-if="status?.container?.running"
          variant="destructive"
          size="sm"
          :disabled="actionLoading === 'stop'"
          @click="serverAction('stop')"
        >
          <Power class="size-4" />
          {{ actionLoading === 'stop' ? 'Stopping...' : 'Stop Server' }}
        </Button>
        <Button
          v-if="status?.container?.running"
          variant="outline"
          size="sm"
          class="border-yellow-600 text-yellow-600 hover:bg-yellow-600/10"
          :disabled="actionLoading === 'restart'"
          @click="serverAction('restart')"
        >
          <RotateCcw class="size-4" />
          {{ actionLoading === 'restart' ? 'Restarting...' : 'Restart' }}
        </Button>
        <Button variant="outline" size="sm" as-child>
          <NuxtLink :to="`/profiles/${profileId}/backups`">
            <Archive class="size-4" />
            Backups
          </NuxtLink>
        </Button>
      </div>
      <Button
        variant="ghost"
        size="sm"
        :disabled="loading"
        @click="refresh"
      >
        <RefreshCw class="size-4" :class="loading ? 'animate-spin' : ''" />
        <span class="hidden sm:inline">Refresh</span>
      </Button>
    </div>

    <!-- Connection Info -->
    <div v-if="profile" class="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle class="text-base font-medium">
            Connection Info
          </CardTitle>
          <CardDescription>
            Use these details in the Project Zomboid client.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div class="grid gap-4 md:grid-cols-2">
            <div>
              <p class="text-xs text-muted-foreground uppercase tracking-wide">
                Host
              </p>
              <p class="text-sm font-medium">
                {{ host }}
              </p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground uppercase tracking-wide">
                Game Port (UDP)
              </p>
              <p class="text-sm font-medium">
                {{ profile.gamePort }}
              </p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground uppercase tracking-wide">
                Direct Port (UDP)
              </p>
              <p class="text-sm font-medium">
                {{ profile.directPort }}
              </p>
            </div>
            <div>
              <p class="text-xs text-muted-foreground uppercase tracking-wide">
                RCON Port (TCP)
              </p>
              <p class="text-sm font-medium">
                {{ profile.rconPort }}
              </p>
            </div>
          </div>
          <p class="mt-4 text-xs text-muted-foreground">
            For local testing, use 127.0.0.1 as the host. For LAN clients, use this machine’s IP and ensure UDP ports are allowed by your firewall.
          </p>
        </CardContent>
      </Card>
    </div>

    <!-- Server Logs -->
    <div class="px-4 lg:px-6">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle class="text-base font-medium">
              Server Logs
            </CardTitle>
            <CardDescription>
              Container output and server console logs (last entries).
            </CardDescription>
          </div>
          <div class="flex items-center gap-2">
            <Button variant="outline" size="sm" :disabled="logsLoading" @click="refreshLogs">
              <RefreshCw class="size-4" :class="logsLoading ? 'animate-spin' : ''" />
              Refresh
            </Button>
            <Button variant="ghost" size="sm" @click="showLogs = !showLogs">
              {{ showLogs ? 'Hide' : 'Show' }}
            </Button>
          </div>
        </CardHeader>
        <CardContent v-if="showLogs">
          <div class="grid gap-4 lg:grid-cols-2">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Container Logs
              </p>
              <pre class="mt-2 max-h-72 overflow-auto rounded-md border border-border bg-muted/30 p-3 text-xs whitespace-pre-wrap">{{ logs?.containerLogs || 'No container logs yet.' }}</pre>
            </div>
            <div>
              <p class="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Server Console
              </p>
              <pre class="mt-2 max-h-72 overflow-auto rounded-md border border-border bg-muted/30 p-3 text-xs whitespace-pre-wrap">{{ logs?.serverConsole || 'server-console.txt not available yet.' }}</pre>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Online Players -->
    <div class="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle class="text-base font-medium">
            Online Players
          </CardTitle>
          <CardDescription>
            {{ players?.count ?? 0 }} player{{ (players?.count ?? 0) !== 1 ? 's' : '' }} currently connected
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul v-if="players?.players?.length" role="list" class="divide-y divide-border">
            <li
              v-for="player in players.players"
              :key="player"
              class="flex items-center justify-between gap-x-6 py-4 first:pt-0 last:pb-0"
            >
              <div class="flex min-w-0 gap-x-3">
                <div class="flex size-10 flex-none items-center justify-center rounded-full bg-emerald-500/10">
                  <span class="text-sm font-medium text-emerald-600">{{ player.slice(0, 2).toUpperCase() }}</span>
                </div>
                <div class="min-w-0 flex-auto">
                  <p class="text-sm font-semibold">
                    {{ player }}
                  </p>
                  <p class="mt-1 truncate text-xs text-muted-foreground">
                    In-game
                  </p>
                </div>
              </div>
              <div class="flex shrink-0 items-center gap-x-1.5">
                <div class="flex-none rounded-full bg-emerald-500/20 p-1">
                  <div class="size-1.5 rounded-full bg-emerald-500" />
                </div>
                <p class="text-xs text-muted-foreground">
                  Online
                </p>
              </div>
            </li>
          </ul>
          <div v-else class="flex flex-col items-center justify-center py-8 text-center">
            <p class="text-sm text-muted-foreground">
              No players online
            </p>
            <p class="mt-1 text-xs text-muted-foreground">
              Players will appear here when they connect to the server
            </p>
          </div>
        </CardContent>
      </Card>
    </div>

    <!-- Profile Info -->
    <div v-if="profile" class="px-4 lg:px-6">
      <Card>
        <CardHeader>
          <CardTitle class="text-base font-medium">
            Server Profile
          </CardTitle>
          <CardDescription>
            Currently loaded server configuration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul role="list" class="divide-y divide-border">
            <li class="flex items-center justify-between gap-x-6 py-4 first:pt-0 last:pb-0">
              <div class="flex min-w-0 gap-x-3">
                <div class="flex size-10 flex-none items-center justify-center rounded-full bg-primary/10">
                  <span class="text-sm font-medium text-primary">{{ profile.name.slice(0, 2).toUpperCase() }}</span>
                </div>
                <div class="min-w-0 flex-auto">
                  <p class="text-sm font-semibold">
                    {{ profile.name }}
                  </p>
                  <p class="mt-1 truncate text-xs text-muted-foreground">
                    {{ profile.servername }}
                  </p>
                </div>
              </div>
              <Button variant="outline" size="sm" as-child>
                <NuxtLink :to="`/profiles/${profileId}/edit`">
                  Edit
                </NuxtLink>
              </Button>
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
