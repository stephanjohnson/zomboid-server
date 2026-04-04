<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const router = useRouter()
const step = ref(1)
const error = ref('')
const loading = ref(false)

// Step 1: Admin account
const admin = reactive({
  username: '',
  email: '',
  password: '',
})

// Step 2: Server profile
const profile = reactive({
  name: 'Default',
  mapName: 'Muldraugh, KY',
  maxPlayers: 16,
  pvp: true,
})

async function handleSubmit() {
  error.value = ''
  loading.value = true
  try {
    await $fetch('/api/onboarding/complete', {
      method: 'POST',
      body: { admin, profile },
    })
    await router.push('/')
  }
  catch (e: unknown) {
    error.value = (e as { data?: { message?: string } })?.data?.message || 'Setup failed'
  }
  finally {
    loading.value = false
  }
}

// Check if already set up
const { data: status } = await useFetch('/api/onboarding/status')
if (status.value?.isComplete) {
  await navigateTo('/login')
}
</script>

<template>
  <div class="max-w-lg mx-auto">
    <h1 class="text-2xl font-bold text-center mb-2">
      Welcome to Zomboid Server Manager
    </h1>
    <p class="text-center text-muted-foreground mb-8">
      Let's set up your server in a few steps.
    </p>

    <form @submit.prevent="handleSubmit">
      <!-- Step 1: Admin Account -->
      <div v-if="step === 1" class="space-y-4">
        <h2 class="text-lg font-semibold">
          Step 1: Create Admin Account
        </h2>
        <div class="space-y-2">
          <Label>Username</Label>
          <Input
            v-model="admin.username"
            type="text"
            required
          />
        </div>
        <div class="space-y-2">
          <Label>Email</Label>
          <Input
            v-model="admin.email"
            type="email"
            required
          />
        </div>
        <div class="space-y-2">
          <Label>Password</Label>
          <Input
            v-model="admin.password"
            type="password"
            required
            minlength="8"
          />
        </div>
        <Button
          type="button"
          class="w-full"
          @click="step = 2"
        >
          Next
        </Button>
      </div>

      <!-- Step 2: Server Profile -->
      <div v-if="step === 2" class="space-y-4">
        <h2 class="text-lg font-semibold">
          Step 2: Server Profile
        </h2>
        <div class="space-y-2">
          <Label>Profile Name</Label>
          <Input
            v-model="profile.name"
            type="text"
            required
          />
        </div>
        <div class="space-y-2">
          <Label>Map</Label>
          <Select v-model="profile.mapName">
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
          <Input
            v-model.number="profile.maxPlayers"
            type="number"
            min="1"
            max="128"
          />
        </div>
        <div class="flex items-center gap-2">
          <Switch
            id="pvp"
            :checked="profile.pvp"
            @update:checked="profile.pvp = $event"
          />
          <Label for="pvp">Enable PvP</Label>
        </div>

        <Alert v-if="error" variant="destructive">
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>

        <div class="flex gap-2">
          <Button
            type="button"
            variant="outline"
            class="flex-1"
            @click="step = 1"
          >
            Back
          </Button>
          <Button
            type="submit"
            :disabled="loading"
            class="flex-1"
          >
            {{ loading ? 'Setting up...' : 'Complete Setup' }}
          </Button>
        </div>
      </div>
    </form>
  </div>
</template>
