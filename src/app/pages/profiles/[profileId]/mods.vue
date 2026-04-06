<script setup lang="ts">
const route = useRoute()
const profileId = route.params.profileId as string

const { data: mods, refresh, pending: modsPending } = useLazyFetch('/api/mods', { query: { profileId } })
const { isAdmin } = useAuth()

const newMod = reactive({
  workshopId: '',
  modName: '',
  displayName: '',
})
const adding = ref(false)
const error = ref('')

async function addMod() {
  error.value = ''
  adding.value = true
  try {
    await $fetch('/api/mods', {
      method: 'POST',
      body: { profileId, ...newMod },
    })
    newMod.workshopId = ''
    newMod.modName = ''
    newMod.displayName = ''
    await refresh()
  }
  catch (e: unknown) {
    error.value = (e as { data?: { message?: string } })?.data?.message || 'Failed to add mod'
  }
  finally {
    adding.value = false
  }
}

async function removeMod(modId: string) {
  if (!confirm('Remove this mod?')) return
  await $fetch(`/api/mods/${modId}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">
      Mod Management
    </h1>

    <!-- Add Mod Form -->
    <Card v-if="isAdmin">
      <CardHeader>
        <CardTitle>Add Mod</CardTitle>
      </CardHeader>
      <CardContent class="space-y-3">
        <div class="grid grid-cols-3 gap-3">
          <Input
            v-model="newMod.workshopId"
            placeholder="Workshop ID"
          />
          <Input
            v-model="newMod.modName"
            placeholder="Mod Name (internal)"
          />
          <Input
            v-model="newMod.displayName"
            placeholder="Display Name (optional)"
          />
        </div>
        <Alert v-if="error" variant="destructive">
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>
        <Button
          :disabled="adding || !newMod.workshopId || !newMod.modName"
          @click="addMod"
        >
          {{ adding ? 'Adding...' : 'Add Mod' }}
        </Button>
      </CardContent>
    </Card>

    <!-- Mod List -->
    <div v-if="modsPending" class="space-y-2">
      <div v-for="i in 3" :key="i" class="rounded-lg border p-3 flex items-center justify-between">
        <div class="space-y-2">
          <Skeleton class="h-5 w-36" />
          <Skeleton class="h-4 w-56" />
        </div>
        <Skeleton class="h-8 w-20" />
      </div>
    </div>

    <div v-else class="space-y-2">
      <div
        v-for="mod in mods"
        :key="mod.id"
        class="rounded-lg border p-3 flex items-center justify-between"
      >
        <div>
          <p class="font-medium">
            {{ mod.displayName || mod.modName }}
          </p>
          <p class="text-sm text-muted-foreground">
            Workshop: {{ mod.workshopId }} &bull; {{ mod.modName }}
          </p>
        </div>
        <Button
          v-if="isAdmin"
          variant="destructive"
          size="sm"
          @click="removeMod(mod.id)"
        >
          Remove
        </Button>
      </div>
    </div>

    <p v-if="!modsPending && !mods?.length" class="text-muted-foreground text-center py-8">
      No mods installed.
    </p>
  </div>
</template>
