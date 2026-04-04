<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { fetchStatus } = useOnboardingStatus()
const status = await fetchStatus()

if (status?.isComplete) {
  await navigateTo('/login')
}
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <OnboardingSetupPanel />
  </div>
</template>
