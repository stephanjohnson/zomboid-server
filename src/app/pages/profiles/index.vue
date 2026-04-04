<script setup lang="ts">
const auth = useAuth()
const { data: profiles, refresh } = useFetch('/api/profiles')
const loading = ref<string | null>(null)

async function activateProfile(profileId: string) {
  loading.value = profileId
  try {
    await $fetch(`/api/profiles/${profileId}`, {
      method: 'PUT',
      body: { isActive: true },
    })
    await refresh()
  }
  finally {
    loading.value = null
  }
}

async function deleteProfile(profileId: string) {
  if (!confirm('Are you sure you want to delete this profile?')) return
  await $fetch(`/api/profiles/${profileId}`, { method: 'DELETE' })
  await refresh()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex items-center justify-between">
      <h1 class="text-2xl font-bold">
        Server Profiles
      </h1>
      <NuxtLink
        v-if="auth.isAdmin.value"
        to="/profiles/new"
        class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        New Profile
      </NuxtLink>
    </div>

    <div class="grid gap-4">
      <div
        v-for="profile in profiles"
        :key="profile.id"
        class="rounded-lg border p-4 flex items-center justify-between"
        :class="{ 'border-primary': profile.isActive }"
      >
        <div>
          <div class="flex items-center gap-2">
            <h3 class="font-semibold">
              {{ profile.name }}
            </h3>
            <span
              v-if="profile.isActive"
              class="rounded-full bg-primary/10 text-primary px-2 py-0.5 text-xs font-medium"
            >
              Active
            </span>
          </div>
          <p class="text-sm text-muted-foreground mt-1">
            {{ profile.mapName }} &bull; {{ profile.maxPlayers }} players &bull;
            {{ profile._count?.mods ?? 0 }} mods &bull; {{ profile._count?.backups ?? 0 }} backups
          </p>
        </div>
        <div v-if="auth.isAdmin.value" class="flex gap-2">
          <button
            v-if="!profile.isActive"
            :disabled="loading === profile.id"
            class="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
            @click="activateProfile(profile.id)"
          >
            Activate
          </button>
          <NuxtLink
            :to="`/profiles/${profile.id}`"
            class="rounded-md border border-input px-3 py-1.5 text-sm hover:bg-accent"
          >
            Edit
          </NuxtLink>
          <button
            v-if="!profile.isActive"
            class="rounded-md border border-destructive text-destructive px-3 py-1.5 text-sm hover:bg-destructive/10"
            @click="deleteProfile(profile.id)"
          >
            Delete
          </button>
        </div>
      </div>
    </div>

    <p v-if="!profiles?.length" class="text-muted-foreground text-center py-8">
      No profiles yet. Create one to get started.
    </p>
  </div>
</template>
