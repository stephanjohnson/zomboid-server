<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next'

definePageMeta({ layout: 'auth' })

const { status, fetchStatus } = useOnboardingStatus()

onMounted(async () => {
  const result = await fetchStatus(true)

  if (!result.isComplete) {
    await navigateTo('/onboarding', { replace: true })
    return
  }

  const { loggedIn, fetch: fetchSession } = useUserSession()

  if (!loggedIn.value) {
    await fetchSession()
  }

  if (!loggedIn.value) {
    await navigateTo('/login', { replace: true })
    return
  }

  await navigateTo('/', { replace: true })
})
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-4 py-16">
    <LoaderCircle class="size-8 animate-spin text-primary" />
    <p class="text-sm text-muted-foreground">
      Loading...
    </p>
  </div>
</template>
