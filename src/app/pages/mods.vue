<script setup lang="ts">
const { data: mods, refresh } = useFetch('/api/mods')
const auth = useAuth()

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
    // Get active profile
    const profiles = await $fetch<{ id: string, isActive: boolean }[]>('/api/profiles')
    const active = profiles.find(p => p.isActive)
    if (!active) {
      error.value = 'No active profile'
      return
    }
    await $fetch('/api/mods', {
      method: 'POST',
      body: { profileId: active.id, ...newMod },
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
    <div v-if="auth.isAdmin.value" class="rounded-lg border p-4 space-y-3">
      <h2 class="font-semibold">
        Add Mod
      </h2>
      <div class="grid grid-cols-3 gap-3">
        <input
          v-model="newMod.workshopId"
          placeholder="Workshop ID"
          class="rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          v-model="newMod.modName"
          placeholder="Mod Name (internal)"
          class="rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <input
          v-model="newMod.displayName"
          placeholder="Display Name (optional)"
          class="rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
      </div>
      <p v-if="error" class="text-sm text-destructive">
        {{ error }}
      </p>
      <button
        :disabled="adding || !newMod.workshopId || !newMod.modName"
        class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        @click="addMod"
      >
        {{ adding ? 'Adding...' : 'Add Mod' }}
      </button>
    </div>

    <!-- Mod List -->
    <div class="space-y-2">
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
        <button
          v-if="auth.isAdmin.value"
          class="text-sm text-destructive hover:underline"
          @click="removeMod(mod.id)"
        >
          Remove
        </button>
      </div>
    </div>

    <p v-if="!mods?.length" class="text-muted-foreground text-center py-8">
      No mods installed.
    </p>
  </div>
</template>
