<script setup lang="ts">
const { data: backups, refresh } = useFetch('/api/backups')
const { isAdmin } = useAuth()
const creating = ref(false)
const restoring = ref<string | null>(null)

async function createBackup() {
  creating.value = true
  try {
    await $fetch('/api/backups/create', { method: 'POST' })
    await refresh()
  }
  finally {
    creating.value = false
  }
}

async function restoreBackup(backupId: string) {
  if (!confirm('Are you sure? This will stop the server and restore from this backup.')) return
  restoring.value = backupId
  try {
    await $fetch(`/api/backups/${backupId}/restore`, { method: 'POST' })
  }
  finally {
    restoring.value = null
  }
}

function formatSize(bytes: number | bigint): string {
  const b = Number(bytes)
  if (b < 1024) return `${b} B`
  if (b < 1048576) return `${(b / 1024).toFixed(1)} KB`
  if (b < 1073741824) return `${(b / 1048576).toFixed(1)} MB`
  return `${(b / 1073741824).toFixed(1)} GB`
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">
        Backups
      </h1>
      <Button
        v-if="isAdmin"
        :disabled="creating"
        @click="createBackup"
      >
        {{ creating ? 'Creating...' : 'Create Backup' }}
      </Button>
    </div>

    <div class="space-y-2">
      <div
        v-for="backup in backups"
        :key="backup.id"
        class="rounded-lg border p-3 flex items-center justify-between"
      >
        <div>
          <p class="font-medium">
            {{ backup.fileName }}
          </p>
          <p class="text-sm text-muted-foreground">
            {{ formatSize(backup.sizeBytes) }}
            &bull; {{ new Date(backup.createdAt).toLocaleString() }}
            <span v-if="backup.gameVersion">&bull; v{{ backup.gameVersion }}</span>
          </p>
        </div>
        <Button
          v-if="isAdmin"
          variant="outline"
          size="sm"
          :disabled="restoring === backup.id"
          @click="restoreBackup(backup.id)"
        >
          {{ restoring === backup.id ? 'Restoring...' : 'Restore' }}
        </Button>
      </div>
    </div>

    <p v-if="!backups?.length" class="text-muted-foreground text-center py-8">
      No backups yet.
    </p>
  </div>
</template>
