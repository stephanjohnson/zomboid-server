<script setup lang="ts">
const { isModerator, isAdmin } = useAuth()
const { data: playerData, refresh } = useFetch('/api/players', {
  default: () => ({ players: [], count: 0 }),
})

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
      <Button
        variant="outline"
        size="sm"
        @click="refresh"
      >
        Refresh
      </Button>
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
        <div v-if="isModerator" class="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            :disabled="actionLoading === `kick-${player}`"
            @click="kickPlayer(player)"
          >
            Kick
          </Button>
          <Button
            v-if="isAdmin"
            variant="destructive"
            size="sm"
            :disabled="actionLoading === `ban-${player}`"
            @click="banPlayer(player)"
          >
            Ban
          </Button>
        </div>
      </div>
    </div>

    <Alert v-if="playerData?.offline">
      <AlertDescription>Server is offline — player list unavailable.</AlertDescription>
    </Alert>
    <p v-else-if="!playerData?.players?.length" class="text-muted-foreground text-center py-8">
      No players online.
    </p>
  </div>
</template>
