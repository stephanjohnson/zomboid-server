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
  <div class="max-w-3xl space-y-6">
    <div class="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 class="text-2xl font-bold">
          {{ isNew ? 'New Profile' : 'Edit Profile' }}
        </h1>
        <p v-if="!isNew" class="mt-1 text-sm text-muted-foreground">
          Profile-scoped telemetry, objectives, and achievement flows live in the automation studio.
        </p>
      </div>

      <Button v-if="!isNew" variant="outline" as-child>
        <NuxtLink :to="`/profiles/${profileId}/telemetry`">
          Open Studio
        </NuxtLink>
      </Button>
    </div>

    <form class="space-y-4" @submit.prevent="handleSubmit">
      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label>Profile Name</Label>
          <Input v-model="form.name" type="text" required />
        </div>
        <div class="space-y-2">
          <Label>Server Name</Label>
          <Input v-model="form.servername" type="text" />
        </div>
      </div>

      <div class="grid grid-cols-3 gap-4">
        <div class="space-y-2">
          <Label>Game Port</Label>
          <Input v-model.number="form.gamePort" type="number" />
        </div>
        <div class="space-y-2">
          <Label>Direct Port</Label>
          <Input v-model.number="form.directPort" type="number" />
        </div>
        <div class="space-y-2">
          <Label>RCON Port</Label>
          <Input v-model.number="form.rconPort" type="number" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label>Map</Label>
          <Select v-model="form.mapName">
            <SelectTrigger>
              <SelectValue placeholder="Select a map" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Muldraugh, KY">Muldraugh, KY</SelectItem>
              <SelectItem value="Riverside, KY">Riverside, KY</SelectItem>
              <SelectItem value="Rosewood, KY">Rosewood, KY</SelectItem>
              <SelectItem value="West Point, KY">West Point, KY</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-2">
          <Label>Max Players</Label>
          <Input v-model.number="form.maxPlayers" type="number" min="1" max="128" />
        </div>
      </div>

      <div class="grid grid-cols-2 gap-4">
        <div class="space-y-2">
          <Label>Difficulty</Label>
          <Select v-model="form.difficulty">
            <SelectTrigger>
              <SelectValue placeholder="Select difficulty" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Easy">Easy</SelectItem>
              <SelectItem value="Normal">Normal</SelectItem>
              <SelectItem value="Hard">Hard</SelectItem>
              <SelectItem value="Hardcore">Hardcore</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="flex items-end gap-2 pb-1">
          <Switch
            id="pvp"
            :checked="form.pvp"
            @update:checked="form.pvp = $event"
          />
          <Label for="pvp">Enable PvP</Label>
        </div>
      </div>

      <Alert v-if="error" variant="destructive">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div class="flex gap-2">
        <Button
          type="submit"
          :disabled="loading"
        >
          {{ loading ? 'Saving...' : 'Save Profile' }}
        </Button>
        <Button variant="outline" as-child>
          <NuxtLink to="/profiles">
            Cancel
          </NuxtLink>
        </Button>
      </div>
    </form>
  </div>
</template>
