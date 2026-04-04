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
        <div>
          <label class="block text-sm font-medium mb-1">Username</label>
          <input
            v-model="admin.username"
            type="text"
            required
            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Email</label>
          <input
            v-model="admin.email"
            type="email"
            required
            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Password</label>
          <input
            v-model="admin.password"
            type="password"
            required
            minlength="8"
            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <button
          type="button"
          class="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          @click="step = 2"
        >
          Next
        </button>
      </div>

      <!-- Step 2: Server Profile -->
      <div v-if="step === 2" class="space-y-4">
        <h2 class="text-lg font-semibold">
          Step 2: Server Profile
        </h2>
        <div>
          <label class="block text-sm font-medium mb-1">Profile Name</label>
          <input
            v-model="profile.name"
            type="text"
            required
            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Map</label>
          <select
            v-model="profile.mapName"
            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="Muldraugh, KY">Muldraugh, KY</option>
            <option value="Riverside, KY">Riverside, KY</option>
            <option value="Rosewood, KY">Rosewood, KY</option>
            <option value="West Point, KY">West Point, KY</option>
          </select>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Max Players</label>
          <input
            v-model.number="profile.maxPlayers"
            type="number"
            min="1"
            max="128"
            class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </div>
        <div class="flex items-center gap-2">
          <input
            id="pvp"
            v-model="profile.pvp"
            type="checkbox"
            class="rounded border-input"
          />
          <label for="pvp" class="text-sm">Enable PvP</label>
        </div>

        <p v-if="error" class="text-sm text-destructive">
          {{ error }}
        </p>

        <div class="flex gap-2">
          <button
            type="button"
            class="flex-1 rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-accent"
            @click="step = 1"
          >
            Back
          </button>
          <button
            type="submit"
            :disabled="loading"
            class="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            {{ loading ? 'Setting up...' : 'Complete Setup' }}
          </button>
        </div>
      </div>
    </form>
  </div>
</template>
