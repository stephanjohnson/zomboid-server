<script setup lang="ts">
const router = useRouter()

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

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    const profile = await $fetch<{ id: string }>('/api/profiles', { method: 'POST', body: form })
    await router.push(`/profiles/${profile.id}`)
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
  <div class="mx-auto max-w-4xl">
    <form @submit.prevent="handleSubmit">
      <Card>
        <CardHeader>
          <CardTitle>New Profile</CardTitle>
          <CardDescription class="max-w-2xl">
            Configure the profile basics, map rotation, player limits, and default rules for this server profile.
          </CardDescription>
        </CardHeader>

        <CardContent class="space-y-6">
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <Label for="profile-name">Profile Name</Label>
              <Input id="profile-name" v-model="form.name" type="text" required />
            </div>

            <div class="space-y-2">
              <Label for="server-name">Server Name</Label>
              <Input id="server-name" v-model="form.servername" type="text" />
            </div>
          </div>

          <div class="grid gap-4 xl:grid-cols-3">
            <div class="space-y-2">
              <Label for="game-port">Game Port</Label>
              <Input id="game-port" v-model.number="form.gamePort" type="number" />
            </div>

            <div class="space-y-2">
              <Label for="direct-port">Direct Port</Label>
              <Input id="direct-port" v-model.number="form.directPort" type="number" />
            </div>

            <div class="space-y-2">
              <Label for="rcon-port">RCON Port</Label>
              <Input id="rcon-port" v-model.number="form.rconPort" type="number" />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
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
              <Label for="max-players">Max Players</Label>
              <Input id="max-players" v-model.number="form.maxPlayers" type="number" min="1" max="128" />
            </div>
          </div>

          <div class="grid gap-4 md:grid-cols-2">
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

            <div class="space-y-2">
              <Label for="pvp">Player vs Player</Label>
              <div class="flex items-center justify-between rounded-md border p-4">
                <div class="space-y-1">
                  <p class="text-sm font-medium leading-none">Enable PvP</p>
                  <p class="text-sm text-muted-foreground">
                    Allow players to damage each other on this profile.
                  </p>
                </div>

                <Switch
                  id="pvp"
                  :checked="form.pvp"
                  @update:checked="form.pvp = $event"
                />
              </div>
            </div>
          </div>

          <Alert v-if="error" variant="destructive">
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>
        </CardContent>

        <CardFooter class="justify-end gap-2">
          <Button type="submit" :disabled="loading">
            {{ loading ? 'Creating...' : 'Create Profile' }}
          </Button>

          <Button variant="outline" as-child>
            <NuxtLink to="/profiles">
              Cancel
            </NuxtLink>
          </Button>
        </CardFooter>
      </Card>
    </form>
  </div>
</template>
