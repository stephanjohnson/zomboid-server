<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { login } = useAuth()
const router = useRouter()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await login(username.value, password.value)
    await router.push('/')
  }
  catch (e: unknown) {
    error.value = (e as { data?: { message?: string } })?.data?.message || 'Login failed'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="flex flex-col gap-6" @submit.prevent="handleLogin">
    <div class="flex flex-col items-center gap-1 text-center">
      <h1 class="text-2xl font-bold">
        Login to your account
      </h1>
      <p class="text-muted-foreground text-sm text-balance">
        Enter your credentials to access the server manager
      </p>
    </div>
    <div class="grid gap-6">
      <div class="grid gap-2">
        <Label for="username">Username</Label>
        <Input
          id="username"
          v-model="username"
          type="text"
          required
          autocomplete="username"
          placeholder="admin"
        />
      </div>
      <div class="grid gap-2">
        <Label for="password">Password</Label>
        <Input
          id="password"
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
          placeholder="••••••••"
        />
      </div>
      <Alert v-if="error" variant="destructive">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>
      <Button type="submit" class="w-full" :disabled="loading">
        {{ loading ? 'Signing in...' : 'Login' }}
      </Button>
    </div>
  </form>
</template>
