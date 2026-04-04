<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const auth = useAuth()
const router = useRouter()

const username = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleLogin() {
  error.value = ''
  loading.value = true
  try {
    await auth.login(username.value, password.value)
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
      <div>
        <label for="username" class="block text-sm font-medium mb-1">Username</label>
        <input
          id="username"
          v-model="username"
          type="text"
          required
          autocomplete="username"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="admin"
        />
      </div>
      <div>
        <label for="password" class="block text-sm font-medium mb-1">Password</label>
        <input
          id="password"
          v-model="password"
          type="password"
          required
          autocomplete="current-password"
          class="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="••••••••"
        />
      </div>
      <p v-if="error" class="text-sm text-destructive">
        {{ error }}
      </p>
      <button
        type="submit"
        :disabled="loading"
        class="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
      >
        {{ loading ? 'Signing in...' : 'Sign in' }}
      </button>
    </form>
  </div>
</template>
