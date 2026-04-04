<script setup lang="ts">
const { status, refresh, loading } = useServerStatus()

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
      <Button
        variant="outline"
        size="sm"
        :disabled="loading"
        @click="refresh"
      >
        {{ loading ? 'Refreshing...' : 'Refresh' }}
      </Button>
    </div>

    <!-- Server Status -->
    <ServerStatusCard :status="status" />

    <!-- Quick Actions -->
    <QuickActions :status="status" />

    <!-- Active Profile -->
    <Card v-if="status?.activeProfile">
      <CardHeader>
        <CardTitle>Active Profile</CardTitle>
      </CardHeader>
      <CardContent>
        <p class="text-muted-foreground">
          {{ status.activeProfile.name }} ({{ status.activeProfile.servername }})
        </p>
      </CardContent>
    </Card>

    <!-- Online Players -->
    <Card>
      <CardHeader>
        <CardTitle>Online Players ({{ players?.count ?? 0 }})</CardTitle>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  </div>
</template>
