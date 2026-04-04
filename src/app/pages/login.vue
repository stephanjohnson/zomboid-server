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
  <div>
    <h1 class="text-2xl font-bold text-center mb-6">
      Zomboid Server Manager
    </h1>
    <form class="space-y-4" @submit.prevent="handleLogin">
      <div class="space-y-2">
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
      <div class="space-y-2">
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
      <Button
        type="submit"
        :disabled="loading"
        class="w-full"
      >
        {{ loading ? 'Signing in...' : 'Sign in' }}
      </Button>
    </form>
  </div>
</template>
