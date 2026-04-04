<script setup lang="ts">
const auth = useAuth()
const { data: playerData, refresh } = useFetch('/api/players', {
  default: () => ({ players: [], count: 0 }),
})

const selectedPlayer = ref<string | null>(null)
const actionLoading = ref<string | null>(null)

async function kickPlayer(player: string) {
  actionLoading.value = `kick-${player}`
  try {
    await $fetch(`/api/players/${encodeURIComponent(player)}/kick`, {
      method: 'POST',
      body: { reason: 'Kicked by admin' },
    })
    await refresh()
  }
  finally {
    actionLoading.value = null
  }
}

async function banPlayer(player: string) {
  if (!confirm(`Ban "${player}"?`)) return
  actionLoading.value = `ban-${player}`
  try {
    await $fetch(`/api/players/${encodeURIComponent(player)}/ban`, {
      method: 'POST',
      body: { reason: 'Banned by admin' },
    })
    await refresh()
  }
  finally {
    actionLoading.value = null
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">
        Players ({{ playerData?.count ?? 0 }})
      </h1>
      <button
        class="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
        @click="refresh"
      >
        Refresh
      </button>
    </div>

    <div v-if="playerData?.players?.length" class="space-y-2">
      <div
        v-for="player in playerData.players"
        :key="player"
        class="rounded-lg border p-3 flex items-center justify-between"
      >
        <div class="flex items-center gap-3">
          <span class="h-2.5 w-2.5 rounded-full bg-green-500" />
          <span class="font-medium">{{ player }}</span>
        </div>
        <div v-if="auth.isModerator.value" class="flex gap-2">
          <button
            :disabled="actionLoading === `kick-${player}`"
            class="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent disabled:opacity-50"
            @click="kickPlayer(player)"
          >
            Kick
          </button>
          <button
            v-if="auth.isAdmin.value"
            :disabled="actionLoading === `ban-${player}`"
            class="rounded-md border border-destructive text-destructive px-3 py-1.5 text-sm hover:bg-destructive/10 disabled:opacity-50"
            @click="banPlayer(player)"
          >
            Ban
          </button>
        </div>
      </div>
    </div>

    <p v-if="playerData?.offline" class="text-sm text-muted-foreground bg-muted rounded-md p-3">
      Server is offline — player list unavailable.
    </p>
    <p v-else-if="!playerData?.players?.length" class="text-muted-foreground text-center py-8">
      No players online.
    </p>
  </div>
</template>
