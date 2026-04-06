<script setup lang="ts">
import { LoaderCircle } from 'lucide-vue-next'

// Redirect to the active profile's dashboard, or to the profile list if none active
const { data: status } = useLazyFetch('/api/zomboid/status')

watch(status, (val) => {
  if (!val) return
  if (val.activeProfile?.id) {
    navigateTo(`/profiles/${val.activeProfile.id}`, { replace: true })
  }
  else {
    navigateTo('/profiles', { replace: true })
  }
}, { immediate: true })
</script>

<template>
  <div class="flex flex-col items-center justify-center gap-3 py-16">
    <LoaderCircle class="size-6 animate-spin text-muted-foreground" />
    <p class="text-sm text-muted-foreground">
      Redirecting...
    </p>
  </div>
</template>
