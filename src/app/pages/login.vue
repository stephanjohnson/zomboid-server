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
    <Card>
      <CardHeader>
        <CardTitle>Welcome back</CardTitle>
        <CardDescription>Access the server manager dashboard</CardDescription>
      </CardHeader>
      <CardContent>
        <div class="grid gap-6">
          <div class="grid gap-2">
            <Label for="username">Username</Label>
            <Input id="username" v-model="username" type="text" required autocomplete="username"
              placeholder="username" />
          </div>
          <div class="grid gap-2">
            <Label for="password">Password</Label>
            <Input id="password" v-model="password" type="password" required autocomplete="current-password"
              placeholder="••••••••" />
          </div>
          <Alert v-if="error" variant="destructive">
            <AlertDescription>{{ error }}</AlertDescription>
          </Alert>
        </div>
      </CardContent>
      <CardFooter>
        <Button type="submit" class="w-full" :disabled="loading">
          {{ loading ? 'Signing in...' : 'Login' }}
        </Button>
      </CardFooter>
    </Card>
  </form>
</template>
