<script setup lang="ts">
import { steamBuildOptions, type SteamBuild } from '~~/shared/game-build'

const { fetchStatus } = useOnboardingStatus()

const loading = ref(false)
const error = ref('')

const form = reactive({
  serverName: 'My Zomboid Server',
  build: 'public' as SteamBuild,
  adminUsername: 'admin',
  password: '',
  confirmPassword: '',
})

const canSubmit = computed(() => {
  return form.serverName.trim().length > 0
    && form.adminUsername.trim().length >= 3
    && form.password.length >= 8
    && form.password === form.confirmPassword
})

const passwordMismatch = computed(() => {
  return form.confirmPassword.length > 0 && form.password !== form.confirmPassword
})

async function handleSubmit() {
  error.value = ''

  if (!form.serverName.trim()) {
    error.value = 'Enter a server name before continuing.'
    return
  }

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
    reloadNuxtApp({ path: '/' })
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
      <h1 class="text-2xl font-semibold tracking-tight">
        Create your server workspace
      </h1>
      <p class="text-muted-foreground text-sm text-balance">
        Provision the default server profile and secure the first admin account in one pass.
      </p>
    </div>

    <div class="grid gap-5 md:grid-cols-2">
      <div class="grid gap-2 md:col-span-2">
        <Label for="server-name">Server name</Label>
        <Input id="server-name" v-model="form.serverName" type="text" required autocomplete="organization"
          placeholder="Weekend Survivors" />
        <p class="text-xs text-muted-foreground">
          This becomes the initial active profile and default server slug.
        </p>
      </div>

      <div class="grid gap-2 md:col-span-2">
        <Label for="admin-username">Dashboard admin username</Label>
        <Input id="admin-username" v-model="form.adminUsername" type="text" required minlength="3"
          autocomplete="username" placeholder="admin" />
        <p class="text-xs text-muted-foreground">
          Use at least 3 characters. This controls dashboard sign-ins. The game server admin user remains "admin".
        </p>
      </div>

      <div class="grid gap-2">
        <Label for="admin-password">Admin password</Label>
        <Input id="admin-password" v-model="form.password" type="password" required minlength="8"
          autocomplete="new-password" placeholder="Minimum 8 characters" />
        <p class="text-xs text-muted-foreground">
          Use a strong password with at least 8 characters.
        </p>
      </div>

      <div class="grid gap-2">
        <Label for="admin-password-confirm">Confirm password</Label>
        <Input id="admin-password-confirm" v-model="form.confirmPassword" type="password" required minlength="8"
          autocomplete="new-password" placeholder="Re-enter password" />
        <p class="text-xs" :class="passwordMismatch ? 'text-destructive' : 'text-muted-foreground'">
          {{ passwordMismatch ? 'Passwords must match.' : 'Re-enter the password to confirm it.' }}
        </p>
      </div>
    </div>

    <FieldSet>
      <FieldLegend>Server version</FieldLegend>
      <FieldDescription>
        Choose which Steam branch this server should track.
      </FieldDescription>
      <RadioGroup v-model="form.build" default-value="public">
        <FieldLabel v-for="option in steamBuildOptions" :key="option.value" :for="`server-build-${option.value}`">
          <Field orientation="horizontal">
            <FieldContent>
              <FieldTitle>{{ option.label }}</FieldTitle>
              <FieldDescription>
                {{ option.description }}
              </FieldDescription>
            </FieldContent>
            <RadioGroupItem :id="`server-build-${option.value}`" :value="option.value" :aria-label="option.label" />
          </Field>
        </FieldLabel>
      </RadioGroup>
    </FieldSet>

    <Alert v-if="error" variant="destructive">
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>

    <div class="grid gap-2">
      <Button type="submit" class="w-full" :disabled="loading">
        {{ loading ? 'Initializing...' : 'Initialize application' }}
      </Button>
      <p class="text-center text-xs text-muted-foreground">
        You can change the server profile settings later from the dashboard.
      </p>
    </div>
  </form>
</template>
