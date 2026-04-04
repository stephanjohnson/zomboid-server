<script setup lang="ts">
const props = defineProps<{
  status: {
    container: { running: boolean }
    rcon: boolean
  } | null
}>()

const loading = ref<string | null>(null)

async function serverAction(action: string) {
  loading.value = action
  try {
    await $fetch(`/api/zomboid/${action}`, { method: 'POST', body: {} })
  }
  catch (e: unknown) {
    console.error(`Failed to ${action}:`, e)
  }
  finally {
    loading.value = null
  }
}
</script>

<template>
  <Card>
    <CardHeader>
      <CardTitle>Quick Actions</CardTitle>
    </CardHeader>
    <CardContent>
      <div class="flex flex-wrap gap-2">
        <Button
          v-if="!status?.container?.running"
          :disabled="loading === 'start'"
          class="bg-green-600 hover:bg-green-700"
          @click="serverAction('start')"
        >
          {{ loading === 'start' ? 'Starting...' : 'Start Server' }}
        </Button>
        <Button
          v-if="status?.container?.running"
          variant="destructive"
          :disabled="loading === 'stop'"
          @click="serverAction('stop')"
        >
          {{ loading === 'stop' ? 'Stopping...' : 'Stop Server' }}
        </Button>
        <Button
          v-if="status?.container?.running"
          class="bg-yellow-600 hover:bg-yellow-700"
          :disabled="loading === 'restart'"
          @click="serverAction('restart')"
        >
          {{ loading === 'restart' ? 'Restarting...' : 'Restart Server' }}
        </Button>
        <Button variant="outline" as-child>
          <NuxtLink to="/backups">
            Backups
          </NuxtLink>
        </Button>
      </div>
    </CardContent>
  </Card>
</template>
