<script setup lang="ts">
// Redirect to the active profile's dashboard, or to the profile list if none active
const { data: status } = await useFetch('/api/zomboid/status')

if (status.value?.activeProfile?.id) {
  await navigateTo(`/profiles/${status.value.activeProfile.id}`, { replace: true })
}
else {
  await navigateTo('/profiles', { replace: true })
}
</script>

<template>
  <div class="flex items-center justify-center py-16">
    <p class="text-muted-foreground">
      Redirecting...
    </p>
  </div>
</template>
