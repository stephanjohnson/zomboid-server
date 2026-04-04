<script setup lang="ts">
const router = useRouter()
const { fetchStatus } = useOnboardingStatus()

const step = ref(1)
const loading = ref(false)
const error = ref('')

const form = reactive({
  serverName: 'My Zomboid Server',
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
  <Card class="border-border/60 bg-background/95 shadow-2xl shadow-slate-950/5">
    <CardHeader class="space-y-6">
      <div class="space-y-2">
        <p class="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
          First-Run Setup
        </p>
        <CardTitle class="text-3xl leading-tight">
          Initialize your Zomboid server manager
        </CardTitle>
        <CardDescription class="max-w-xl text-sm leading-6">
          This creates the first admin account and provisions the default active server profile.
        </CardDescription>
      </div>

      <div class="grid grid-cols-2 gap-2 rounded-xl bg-muted/60 p-1">
        <button
          type="button"
          class="rounded-lg px-4 py-3 text-left transition"
          :class="step === 1 ? 'bg-background shadow-sm' : 'text-muted-foreground'"
          @click="step = 1"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Step 1
          </p>
          <p class="mt-1 text-sm font-medium">
            Server identity
          </p>
        </button>
        <button
          type="button"
          class="rounded-lg px-4 py-3 text-left transition"
          :class="step === 2 ? 'bg-background shadow-sm' : 'text-muted-foreground'"
          @click="step = canContinue ? 2 : 1"
        >
          <p class="text-xs font-semibold uppercase tracking-[0.25em] text-muted-foreground">
            Step 2
          </p>
          <p class="mt-1 text-sm font-medium">
            Admin access
          </p>
        </button>
      </div>
    </CardHeader>

    <form @submit.prevent="handleSubmit">
      <CardContent class="space-y-6">
        <div v-if="step === 1" class="space-y-5">
          <div class="space-y-2">
            <Label for="server-name">Server name</Label>
            <Input
              id="server-name"
              v-model="form.serverName"
              type="text"
              required
              autocomplete="organization"
              placeholder="Weekend Survivors"
            />
            <p class="text-sm text-muted-foreground">
              This becomes the name of the initial active profile and the default Project Zomboid server slug.
            </p>
          </div>
        </div>

        <div v-else class="space-y-5">
          <div class="grid gap-5 sm:grid-cols-2">
            <div class="space-y-2 sm:col-span-2">
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
            <div class="space-y-2">
              <Label for="admin-password">Admin password</Label>
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
            <div class="space-y-2">
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
          </div>

          <Alert>
            <AlertTitle>What happens next</AlertTitle>
            <AlertDescription>
              The app will create your first administrator, seed the initial profile data, and sign you into the dashboard automatically.
            </AlertDescription>
          </Alert>
        </div>

        <Alert v-if="error" variant="destructive">
          <AlertDescription>{{ error }}</AlertDescription>
        </Alert>
      </CardContent>

      <CardFooter class="flex flex-col gap-3 border-t border-border/60 bg-muted/20 sm:flex-row sm:justify-between">
        <Button
          v-if="step === 2"
          type="button"
          variant="outline"
          @click="step = 1"
        >
          Back
        </Button>
        <div class="sm:ml-auto">
          <Button
            v-if="step === 1"
            type="button"
            @click="goToAdminStep"
          >
            Continue
          </Button>
          <Button
            v-else
            type="submit"
            :disabled="loading"
          >
            {{ loading ? 'Initializing...' : 'Initialize application' }}
          </Button>
        </div>
      </CardFooter>
    </form>
  </Card>
</template>