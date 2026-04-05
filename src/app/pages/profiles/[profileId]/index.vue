<script setup lang="ts">
import { toast } from 'vue-sonner'
import {
  Archive,
  Check,
  Clipboard,
  Play,
  Power,
  RefreshCw,
  RotateCcw,
  ScrollText,
} from 'lucide-vue-next'

const route = useRoute()
const profileId = route.params.profileId as string

const { status, refresh, loading } = useServerStatus()

const { data: players, refresh: refreshPlayers } = useFetch('/api/players', { default: () => ({ players: [], count: 0 }) })

onMounted(() => {
  refresh()
})

// Refresh players alongside status polling
watch(status, () => {
  refreshPlayers()
})

const { data: profile } = await useFetch(`/api/profiles/${profileId}`)
const actionLoading = ref<string | null>(null)
const requestUrl = useRequestURL()
const host = computed(() => requestUrl.hostname || 'localhost')
const copiedField = ref<string | null>(null)

function copyToClipboard(value: string, field: string) {
  navigator.clipboard.writeText(value)
  copiedField.value = field
  setTimeout(() => copiedField.value = null, 1500)
}

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
        <Button variant="outline" size="sm" as-child>
          <NuxtLink :to="`/profiles/${profileId}/logs`">
            <ScrollText class="size-4" />
            Logs
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
        <CardContent class="flex flex-wrap items-center gap-x-6 gap-y-2 py-4">
          <span class="text-sm font-medium">Connection Info</span>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-2">
            <div v-for="item in [
              { label: ‘Host’, value: host, key: ‘host’ },
              { label: ‘Game Port’, value: String(profile.gamePort), key: ‘game’ },
              { label: ‘Direct Port’, value: String(profile.directPort), key: ‘direct’ },
              { label: ‘RCON Port’, value: String(profile.rconPort), key: ‘rcon’ },
            ]" :key="item.key" class="flex items-center gap-1.5">
              <span class="text-xs text-muted-foreground">{{ item.label }}</span>
              <code class="rounded bg-muted px-1.5 py-0.5 text-xs font-medium">{{ item.value }}</code>
              <button
                class="inline-flex size-6 items-center justify-center rounded text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                :title="`Copy ${item.label}`"
                @click="copyToClipboard(item.value, item.key)"
              >
                <Check v-if="copiedField === item.key" class="size-3 text-emerald-500" />
                <Clipboard v-else class="size-3" />
              </button>
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
