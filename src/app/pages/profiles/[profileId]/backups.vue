<script setup lang="ts">
const route = useRoute()
const profileId = route.params.profileId as string

const { data: backups, refresh, pending: backupsPending } = useLazyFetch('/api/backups', { query: { profileId } })
const { isAdmin } = useAuth()
const creating = ref(false)
const restoring = ref<string | null>(null)

async function createBackup() {
  creating.value = true
  try {
    await $fetch('/api/backups/create', { method: 'POST', body: { profileId } })
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
  <div class="space-y-8">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-semibold tracking-tight">
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

    <div v-if="backupsPending" class="space-y-3">
      <Card v-for="i in 3" :key="i">
        <CardContent class="flex items-center justify-between py-3">
          <div class="space-y-2">
            <Skeleton class="h-5 w-48" />
            <Skeleton class="h-4 w-64" />
          </div>
          <Skeleton class="h-8 w-20" />
        </CardContent>
      </Card>
    </div>

    <div v-else class="space-y-3">
      <Card
        v-for="backup in backups"
        :key="backup.id"
      >
        <CardContent class="flex items-center justify-between py-3">
          <div>
            <p class="text-sm font-medium">
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
        </CardContent>
      </Card>
    </div>

    <p v-if="!backupsPending && !backups?.length" class="text-muted-foreground text-center py-8">
      No backups yet.
    </p>
  </div>
</template>
