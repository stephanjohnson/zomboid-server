<script setup lang="ts">
const { isAdmin } = useAuth()
const { data: profiles, refresh, pending: profilesPending } = useLazyFetch('/api/profiles')
const loading = ref<string | null>(null)

async function activateProfile(profileId: string) {
  loading.value = profileId
  try {
    await $fetch(`/api/profiles/${profileId}`, {
      method: 'PUT',
      body: { isActive: true },
    })
    await refresh()
    // Navigate to the activated profile's dashboard
    await navigateTo(`/profiles/${profileId}`)
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
      <Button
        v-if="isAdmin"
        as-child
      >
        <NuxtLink to="/profiles/new">
          New Profile
        </NuxtLink>
      </Button>
    </div>

    <div v-if="profilesPending" class="grid gap-4">
      <div v-for="i in 3" :key="i" class="rounded-lg border p-4 flex items-center justify-between">
        <div class="space-y-2">
          <Skeleton class="h-5 w-40" />
          <Skeleton class="h-4 w-64" />
        </div>
        <div class="flex gap-2">
          <Skeleton class="h-8 w-20" />
          <Skeleton class="h-8 w-16" />
        </div>
      </div>
    </div>

    <div v-else class="grid gap-4">
      <div
        v-for="profile in profiles"
        :key="profile.id"
        class="rounded-lg border p-4 flex items-center justify-between"
        :class="{ 'border-primary': profile.isActive }"
      >
        <div>
          <div class="flex items-center gap-2">
            <NuxtLink :to="`/profiles/${profile.id}`" class="font-semibold hover:underline">
              {{ profile.name }}
            </NuxtLink>
            <Badge
              v-if="profile.isActive"
              variant="secondary"
            >
              Active
            </Badge>
          </div>
          <p class="text-sm text-muted-foreground mt-1">
            {{ profile.mapName }} &bull; {{ profile.maxPlayers }} players &bull;
            {{ profile._count?.mods ?? 0 }} mods &bull; {{ profile._count?.backups ?? 0 }} backups
          </p>
        </div>
        <div v-if="isAdmin" class="flex gap-2">
          <Button
            v-if="!profile.isActive"
            variant="outline"
            size="sm"
            :disabled="loading === profile.id"
            @click="activateProfile(profile.id)"
          >
            Activate
          </Button>
          <Button
            variant="outline"
            size="sm"
            as-child
          >
            <NuxtLink :to="`/profiles/${profile.id}/automations`">
              Automations
            </NuxtLink>
          </Button>
          <Button
            variant="outline"
            size="sm"
            as-child
          >
            <NuxtLink :to="`/profiles/${profile.id}/edit`">
              Edit
            </NuxtLink>
          </Button>
          <Button
            v-if="!profile.isActive"
            variant="destructive"
            size="sm"
            @click="deleteProfile(profile.id)"
          >
            Delete
          </Button>
        </div>
      </div>
    </div>

    <p v-if="!profilesPending && !profiles?.length" class="text-muted-foreground text-center py-8">
      No profiles yet. Create one to get started.
    </p>
  </div>
</template>
