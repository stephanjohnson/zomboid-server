<script setup lang="ts">
defineProps<{
  status: {
    container: { exists: boolean, running: boolean, status: string, statusLabel: string, startedAt: string | null }
    rcon: boolean
    activeProfile: { id: string, name: string } | null
  } | null
}>()
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Server Status</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="grid grid-cols-2 gap-4">
        <div>
          <p class="text-sm text-muted-foreground">
            Container
          </p>
          <div class="flex items-center gap-2">
            <span
              class="h-2.5 w-2.5 rounded-full"
              :class="status?.container?.running ? 'bg-green-500' : status?.container?.exists ? 'bg-yellow-500' : 'bg-slate-400'"
            />
            <span class="font-medium">{{ status?.container?.statusLabel || 'Unknown' }}</span>
          </div>
        </div>
        <div>
          <p class="text-sm text-muted-foreground">
            RCON
          </p>
          <div class="flex items-center gap-2">
            <span
              class="h-2.5 w-2.5 rounded-full"
              :class="status?.rcon ? 'bg-green-500' : 'bg-yellow-500'"
            />
            <span class="font-medium">{{ status?.rcon ? 'Connected' : 'Disconnected' }}</span>
          </div>
        </div>
        <div v-if="status?.container?.startedAt">
          <p class="text-sm text-muted-foreground">
            Started
          </p>
          <p class="font-medium text-sm">
            {{ new Date(status.container.startedAt).toLocaleString() }}
          </p>
        </div>
      </div>
    </CardContent>
  </Card>
</template>
