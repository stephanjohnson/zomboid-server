<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { fetchStatus } = useOnboardingStatus()
const status = await fetchStatus()

if (status?.isComplete) {
  await navigateTo('/login')
}
</script>

<template>
  <OnboardingSetupPanel />
</template>
