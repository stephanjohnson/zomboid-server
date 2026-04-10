<script setup lang="ts">
import ProfileConfigEditor from '@/components/config-editor/ProfileConfigEditor.vue'

const route = useRoute()
const profileId = route.params.profileId as string
</script>

<template>
  <ProfileConfigEditor :profile-id="profileId" />
</template>
