<script setup lang="ts">
import TelemetryAutomationWorkflowList from '@/components/telemetry-studio/TelemetryAutomationWorkflowList.vue'

const route = useRoute()
const profileId = route.params.profileId as string

const { isAdmin } = useAuth()
if (!isAdmin.value) {
  await navigateTo('/profiles')
}

const {
  profile,
  automationStudio,
  pending,
  refresh,
} = await useTelemetryStudio(profileId)
</script>

<template>
    <div class="flex flex-col gap-6 py-4 md:gap-8 md:py-6">
    <div class="px-4 lg:px-6">
      <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div class="min-w-0 flex-1 space-y-1">
          <h2 class="text-2xl font-semibold tracking-tight">
            {{ profile?.name ?? 'Automation workflows' }}
          </h2>
          <p class="max-w-3xl text-sm text-balance text-muted-foreground">
            Manage visual automation workflows separately from the raw telemetry editors.
            Pick a workflow to open it in the fullscreen Vue Flow editor.
          </p>
        </div>

        <div class="flex flex-wrap gap-2">
          <Button variant="outline" as-child>
            <NuxtLink :to="`/profiles/${profileId}/telemetry`">
              Back to telemetry
            </NuxtLink>
          </Button>
          <Button variant="outline" as-child>
            <NuxtLink :to="`/profiles/${profileId}/edit`">
              Edit profile
            </NuxtLink>
          </Button>
          <Button variant="outline" :disabled="pending" @click="refresh()">
            {{ pending ? 'Reloading...' : 'Reload' }}
          </Button>
        </div>
      </div>
    </div>

    <div class="px-4 lg:px-6">
      <Card v-if="pending && !profile">
        <CardContent class="p-6 text-sm text-muted-foreground">
          Loading automation workflows…
        </CardContent>
      </Card>

      <TelemetryAutomationWorkflowList
        v-else
        :profile-id="profileId"
        :graphs="automationStudio.graphs"
      />
    </div>
  </div>
</template>