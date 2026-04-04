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
  <div class="rounded-lg border p-4">
    <h2 class="text-lg font-semibold mb-3">
      Quick Actions
    </h2>
    <div class="flex flex-wrap gap-2">
      <button
        v-if="!status?.container?.running"
        :disabled="loading === 'start'"
        class="rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
        @click="serverAction('start')"
      >
        {{ loading === 'start' ? 'Starting...' : 'Start Server' }}
      </button>
      <button
        v-if="status?.container?.running"
        :disabled="loading === 'stop'"
        class="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
        @click="serverAction('stop')"
      >
        {{ loading === 'stop' ? 'Stopping...' : 'Stop Server' }}
      </button>
      <button
        v-if="status?.container?.running"
        :disabled="loading === 'restart'"
        class="rounded-md bg-yellow-600 px-4 py-2 text-sm font-medium text-white hover:bg-yellow-700 disabled:opacity-50"
        @click="serverAction('restart')"
      >
        {{ loading === 'restart' ? 'Restarting...' : 'Restart Server' }}
      </button>
      <NuxtLink
        to="/backups"
        class="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
      >
        Backups
      </NuxtLink>
    </div>
  </div>
</template>
