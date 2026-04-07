<script setup lang="ts">
import ProfileModsManager from '@/components/mods/ProfileModsManager.vue'

const route = useRoute()
const profileId = route.params.profileId as string
</script>

<template>
  <ProfileModsManager :profile-id="profileId" />
</template>
