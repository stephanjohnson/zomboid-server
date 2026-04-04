<script setup lang="ts">
import { steamBuildOptions, type SteamBuild } from '~~/shared/game-build'

const router = useRouter()
const { fetchStatus } = useOnboardingStatus()

const step = ref(1)
const loading = ref(false)
const error = ref('')

const form = reactive({
  serverName: 'My Zomboid Server',
  build: 'public' as SteamBuild,
  adminUsername: 'admin',
  password: '',
  confirmPassword: '',
})

const canContinue = computed(() => form.serverName.trim().length > 0)
const canSubmit = computed(() => {
  return form.adminUsername.trim().length >= 3
    && form.password.length >= 8
    && form.password === form.confirmPassword
})

function goToAdminStep() {
  error.value = ''

  if (!canContinue.value) {
    error.value = 'Enter a server name to continue.'
    return
  }

  step.value = 2
}

async function handleSubmit() {
  error.value = ''

  if (!canSubmit.value) {
    error.value = form.password !== form.confirmPassword
      ? 'Passwords must match.'
      : 'Complete the required fields before continuing.'
    return
  }

  loading.value = true

  try {
    await $fetch('/api/onboarding/complete', {
      method: 'POST',
      body: {
        server: {
          name: form.serverName,
          build: form.build,
        },
        admin: {
          username: form.adminUsername,
          password: form.password,
        },
      },
    })

    await fetchStatus(true)
    await router.push('/')
  }
  catch (caughtError: unknown) {
    error.value = (caughtError as { data?: { message?: string } })?.data?.message || 'Setup failed.'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="flex flex-col gap-6" @submit.prevent="handleSubmit">
    <div class="flex flex-col items-center gap-1 text-center">
      <p class="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
        First-Run Setup
      </p>
      <h1 class="text-2xl font-bold">
        Initialize your server
      </h1>
      <p class="text-muted-foreground text-sm text-balance">
        Create the first admin account and provision the default server profile
      </p>
    </div>

    <div class="grid grid-cols-2 gap-2 rounded-lg bg-muted/60 p-1">
      <button
        type="button"
        class="rounded-md px-3 py-2 text-left text-sm transition"
        :class="step === 1 ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'"
        @click="step = 1"
      >
        <span class="text-xs text-muted-foreground">Step 1</span>
        <p>Server identity</p>
      </button>
      <button
        type="button"
        class="rounded-md px-3 py-2 text-left text-sm transition"
        :class="step === 2 ? 'bg-background shadow-sm font-medium' : 'text-muted-foreground'"
        @click="step = canContinue ? 2 : 1"
      >
        <span class="text-xs text-muted-foreground">Step 2</span>
        <p>Admin access</p>
      </button>
    </div>

    <div v-if="step === 1" class="grid gap-6">
      <div class="grid gap-2">
        <Label for="server-name">Server name</Label>
        <Input
          id="server-name"
          v-model="form.serverName"
          type="text"
          required
          autocomplete="organization"
          placeholder="Weekend Survivors"
        />
        <p class="text-xs text-muted-foreground">
          Name of the initial active profile and the default server slug.
        </p>
      </div>

      <div class="grid gap-2">
        <Label for="server-build">Game build</Label>
        <Select v-model="form.build">
          <SelectTrigger id="server-build">
            <SelectValue placeholder="Select a game build" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem
              v-for="option in steamBuildOptions"
              :key="option.value"
              :value="option.value"
            >
              {{ option.label }}
            </SelectItem>
          </SelectContent>
        </Select>
        <p class="text-xs text-muted-foreground">
          {{ steamBuildOptions.find(option => option.value === form.build)?.description }}
        </p>
      </div>

      <Button type="button" class="w-full" @click="goToAdminStep">
        Continue
      </Button>
    </div>

    <div v-else class="grid gap-6">
      <div class="grid gap-2">
        <Label for="admin-username">Admin username</Label>
        <Input
          id="admin-username"
          v-model="form.adminUsername"
          type="text"
          required
          minlength="3"
          autocomplete="username"
          placeholder="admin"
        />
      </div>
      <div class="grid gap-2">
        <Label for="admin-password">Password</Label>
        <Input
          id="admin-password"
          v-model="form.password"
          type="password"
          required
          minlength="8"
          autocomplete="new-password"
          placeholder="Minimum 8 characters"
        />
      </div>
      <div class="grid gap-2">
        <Label for="admin-password-confirm">Confirm password</Label>
        <Input
          id="admin-password-confirm"
          v-model="form.confirmPassword"
          type="password"
          required
          minlength="8"
          autocomplete="new-password"
          placeholder="Re-enter password"
        />
      </div>

      <Alert v-if="error" variant="destructive">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div class="grid gap-2">
        <Button type="submit" class="w-full" :disabled="loading">
          {{ loading ? 'Initializing...' : 'Initialize application' }}
        </Button>
        <Button type="button" variant="outline" class="w-full" @click="step = 1">
          Back
        </Button>
      </div>
    </div>
  </form>
</template>
