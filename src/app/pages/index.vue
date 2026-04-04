<script setup lang="ts">
const { status, refresh, loading } = useServerStatus()
const auth = useAuth()

onMounted(() => {
  refresh()
})

const { data: players } = useFetch('/api/players', { default: () => ({ players: [], count: 0 }) })
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">
        Dashboard
      </h1>
      <button
        class="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
        :disabled="loading"
        @click="refresh"
      >
        {{ loading ? 'Refreshing...' : 'Refresh' }}
      </button>
    </div>

    <!-- Server Status -->
    <ServerStatusCard :status="status" />

    <!-- Quick Actions -->
    <QuickActions :status="status" />

    <!-- Active Profile -->
    <div v-if="status?.activeProfile" class="rounded-lg border p-4">
      <h2 class="text-lg font-semibold mb-2">
        Active Profile
      </h2>
      <p class="text-muted-foreground">
        {{ status.activeProfile.name }} ({{ status.activeProfile.servername }})
      </p>
    </div>

    <!-- Online Players -->
    <div class="rounded-lg border p-4">
      <h2 class="text-lg font-semibold mb-2">
        Online Players ({{ players?.count ?? 0 }})
      </h2>
      <div v-if="players?.players?.length" class="space-y-1">
        <div
          v-for="player in players.players"
          :key="player"
          class="flex items-center gap-2 text-sm"
        >
          <span class="h-2 w-2 rounded-full bg-green-500" />
          {{ player }}
        </div>
      </div>
      <p v-else class="text-sm text-muted-foreground">
        No players online
      </p>
    </div>
  </div>
</template>
