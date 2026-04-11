<script setup lang="ts">
const route = useRoute()
const profileId = route.params.profileId as string

const { isAdmin } = useAuth()
if (!isAdmin.value) {
  await navigateTo('/profiles')
}

const tab = shallowRef<'overview' | 'objectives' | 'listeners' | 'workflows' | 'actions'>('overview')

const {
  profile,
  listeners,
  workflows,
  actionRules,
  topXpPlayers,
  objectiveCards,
  objectiveCount,
  achievementCount,
  automationGraphCount,
  pending,
  saving,
  saveError,
  saveSuccess,
  canSave,
  refresh,
  addListener,
  removeListener,
  addWorkflow,
  removeWorkflow,
  addWorkflowStep,
  removeWorkflowStep,
  addActionRule,
  removeActionRule,
  updateWorkflowKey,
  updateObjectiveDetails,
  ensureObjectiveRewardRule,
  updateObjectiveRewardDetails,
  applyPreset,
  save,
} = await useTelemetryStudio(profileId)
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div class="space-y-2">
        <p class="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
          Profile Automation
        </p>
        <div class="space-y-1">
          <h1 class="text-2xl font-semibold tracking-tight">
            {{ profile?.name ?? 'Telemetry Studio' }}
          </h1>
          <p class="max-w-3xl text-sm leading-6 text-muted-foreground">
            Build profile-specific listeners, event workflows, objectives, and achievement-style unlocks.
            This is where raw telemetry becomes game modes, trophies, economy rewards, and XP progression.
          </p>
        </div>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button variant="outline" as-child>
          <NuxtLink to="/profiles">
            Back to profiles
          </NuxtLink>
        </Button>
        <Button variant="outline" as-child>
          <NuxtLink :to="`/profiles/${profileId}`">
            Edit profile
          </NuxtLink>
        </Button>
        <Button variant="outline" as-child>
          <NuxtLink :to="`/profiles/${profileId}/automations`">
            Automations
          </NuxtLink>
        </Button>
        <Button variant="outline" :disabled="pending || saving" @click="refresh()">
          {{ pending ? 'Reloading...' : 'Reload' }}
        </Button>
        <Button :disabled="!canSave" @click="save()">
          {{ saving ? 'Saving...' : 'Save telemetry config' }}
        </Button>
      </div>
    </div>

    <Alert v-if="saveError" variant="destructive">
      <AlertDescription>{{ saveError }}</AlertDescription>
    </Alert>
    <Alert v-if="saveSuccess">
      <AlertDescription>{{ saveSuccess }}</AlertDescription>
    </Alert>

    <Card v-if="pending && !profile">
      <CardContent class="p-6 text-sm text-muted-foreground">
        Loading telemetry studio…
      </CardContent>
    </Card>

    <Tabs v-else v-model="tab" default-value="overview" class="space-y-4">
      <TabsList class="flex h-auto flex-wrap gap-2 bg-transparent p-0">
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="objectives">Objectives</TabsTrigger>
        <TabsTrigger value="listeners">Listeners</TabsTrigger>
        <TabsTrigger value="workflows">Workflows</TabsTrigger>
        <TabsTrigger value="actions">Actions</TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <TelemetryStudioOverview
          :profile-name="profile?.name ?? 'Profile'"
          :automation-graph-count="automationGraphCount"
          :listener-count="listeners.length"
          :workflow-count="workflows.length"
          :objective-count="objectiveCount"
          :achievement-count="achievementCount"
          :action-rule-count="actionRules.length"
          :top-xp-players="topXpPlayers"
          @apply-preset="applyPreset"
        />
      </TabsContent>

      <TabsContent value="objectives">
        <TelemetryObjectivesEditor
          :cards="objectiveCards"
          :on-add="addWorkflow"
          :on-remove="removeWorkflow"
          :on-add-step="addWorkflowStep"
          :on-remove-step="removeWorkflowStep"
          :on-update-key="updateWorkflowKey"
          :on-ensure-reward="ensureObjectiveRewardRule"
          :on-update-details="updateObjectiveDetails"
          :on-update-reward-details="updateObjectiveRewardDetails"
        />
      </TabsContent>

      <TabsContent value="listeners">
        <TelemetryListenersEditor
          v-model="listeners"
          :on-add="addListener"
          :on-remove="removeListener"
        />
      </TabsContent>

      <TabsContent value="workflows">
        <TelemetryWorkflowsEditor
          v-model="workflows"
          :on-add="addWorkflow"
          :on-remove="removeWorkflow"
          :on-add-step="addWorkflowStep"
          :on-remove-step="removeWorkflowStep"
          :on-update-key="updateWorkflowKey"
        />
      </TabsContent>

      <TabsContent value="actions">
        <TelemetryActionRulesEditor
          v-model="actionRules"
          :on-add="addActionRule"
          :on-remove="removeActionRule"
        />
      </TabsContent>
    </Tabs>
  </div>
</template>