<script setup lang="ts">
const route = useRoute()
const router = useRouter()
const profileId = route.params.profileId as string
const isNew = profileId === 'new'

const form = reactive({
  name: '',
  servername: '',
  gamePort: 16261,
  directPort: 16262,
  rconPort: 27015,
  mapName: 'Muldraugh, KY',
  maxPlayers: 16,
  pvp: true,
  difficulty: 'Normal',
})

const loading = ref(false)
const error = ref('')

if (!isNew) {
  const { data } = await useFetch(`/api/profiles/${profileId}`)
  if (data.value) {
    Object.assign(form, data.value)
  }
}

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    if (isNew) {
      await $fetch('/api/profiles', { method: 'POST', body: form })
    }
    else {
      await $fetch(`/api/profiles/${profileId}`, { method: 'PUT', body: form })
    }
    await router.push('/profiles')
  }
  catch (e: unknown) {
    error.value = (e as { data?: { message?: string } })?.data?.message || 'Failed to save'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl space-y-6">
    <h1 class="text-2xl font-bold">
      {{ isNew ? 'New Profile' : 'Edit Profile' }}
    </h1>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Profile Name</label>
          <input v-model="form.name" type="text" required class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Server Name</label>
          <input v-model="form.servername" type="text" class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Game Port</label>
          <input v-model.number="form.gamePort" type="number" class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Direct Port</label>
          <input v-model.number="form.directPort" type="number" class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">RCON Port</label>
          <input v-model.number="form.rconPort" type="number" class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Map</label>
          <select v-model="form.mapName" class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="Muldraugh, KY">Muldraugh, KY</option>
            <option value="Riverside, KY">Riverside, KY</option>
            <option value="Rosewood, KY">Rosewood, KY</option>
            <option value="West Point, KY">West Point, KY</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Max Players</label>
          <input v-model.number="form.maxPlayers" type="number" min="1" max="128" class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div>
          <label class="block text-sm font-medium mb-1">Difficulty</label>
          <select v-model="form.difficulty" class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option>Easy</option>
            <option>Normal</option>
            <option>Hard</option>
            <option>Hardcore</option>
          </select>
        </div>
        <div class="flex items-end gap-2 pb-1">
          <input id="pvp" v-model="form.pvp" type="checkbox" class="rounded border-input" />
          <label for="pvp" class="text-sm">Enable PvP</label>
        </div>
      </div>

      <p v-if="error" class="text-sm text-destructive">
        {{ error }}
      </p>

      <div class="flex gap-2">
        <button
          type="submit"
          :disabled="loading"
          class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {{ loading ? 'Saving...' : 'Save Profile' }}
        </button>
        <NuxtLink
          to="/profiles"
          class="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
        >
          Cancel
        </NuxtLink>
      </div>
    </form>
  </div>
</template>
