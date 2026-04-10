<script setup lang="ts">
import TelemetryAutomationStudio from '@/components/telemetry-studio/TelemetryAutomationStudio.vue'

import {
  automationBlueprintKeys,
  createAutomationBlueprintGraph,
  type AutomationBlueprintKey,
} from '~~/shared/telemetry-automation'

type EditorTarget =
  | { mode: 'graph', graphId: string }
  | { mode: 'new', blueprintKey: AutomationBlueprintKey }
  | { mode: 'invalid' }

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
  saving,
  saveError,
  saveSuccess,
  refresh,
  save,
} = await useTelemetryStudio(profileId)

const pathSegments = computed(() => {
  const raw = route.params.path
  if (!raw) {
    return [] as string[]
  }

  return (Array.isArray(raw) ? raw : [raw])
    .map(segment => String(segment).trim())
    .filter(Boolean)
})

const editorTarget = computed<EditorTarget>(() => {
  const [mode, value] = pathSegments.value

  if (mode === 'new' && automationBlueprintKeys.includes(value as AutomationBlueprintKey)) {
    return {
      mode: 'new',
      blueprintKey: value as AutomationBlueprintKey,
    }
  }

  if (mode === 'graph' && value) {
    return {
      mode: 'graph',
      graphId: value,
    }
  }

  if (pathSegments.value.length === 1 && mode) {
    return {
      mode: 'graph',
      graphId: mode,
    }
  }

  return { mode: 'invalid' }
})

const seededBlueprintKey = shallowRef<AutomationBlueprintKey | null>(null)
const seededGraphId = shallowRef<string | null>(null)

watch([() => profile.value?.id, editorTarget], ([loadedProfileId, target]) => {
  if (!loadedProfileId || target.mode !== 'new') {
    return
  }

  if (seededBlueprintKey.value === target.blueprintKey && seededGraphId.value) {
    return
  }

  const nextGraph = createAutomationBlueprintGraph(target.blueprintKey)
  automationStudio.value = {
    ...automationStudio.value,
    graphs: [...automationStudio.value.graphs, nextGraph],
  }
  seededBlueprintKey.value = target.blueprintKey
  seededGraphId.value = nextGraph.id
}, { immediate: true })

const currentGraphId = computed(() => {
  if (editorTarget.value.mode === 'graph') {
    return editorTarget.value.graphId
  }

  if (editorTarget.value.mode === 'new') {
    return seededGraphId.value
  }

  return null
})

const currentGraph = computed(() => {
  if (!currentGraphId.value) {
    return null
  }

  return automationStudio.value.graphs.find(graph => graph.id === currentGraphId.value) ?? null
})

const pageTitle = computed(() => {
  if (currentGraph.value?.name) {
    return currentGraph.value.name
  }

  if (editorTarget.value.mode === 'new') {
    return 'New automation workflow'
  }

  return 'Automation workflow'
})

const pageDescription = computed(() => {
  if (editorTarget.value.mode === 'new') {
    return 'Build a new visual workflow in the fullscreen editor, then save it back into the profile automation config.'
  }

  return 'Edit the selected visual workflow in a fullscreen canvas so node layout and inspector changes have room to breathe.'
})

const isNewWorkflow = computed(() => editorTarget.value.mode === 'new')

async function handleSave() {
  await save()

  if (!saveError.value && isNewWorkflow.value && currentGraphId.value) {
    await navigateTo(`/profiles/${profileId}/automations/edit/graph/${currentGraphId.value}`, { replace: true })
  }
}

async function handleDelete() {
  if (!currentGraph.value) {
    return
  }

  if (!confirm(`Delete automation workflow "${currentGraph.value.name}"?`)) {
    return
  }

  if (isNewWorkflow.value) {
    await navigateTo(`/profiles/${profileId}/automations`)
    return
  }

  const previousGraphs = automationStudio.value.graphs

  automationStudio.value = {
    ...automationStudio.value,
    graphs: previousGraphs.filter(graph => graph.id !== currentGraph.value?.id),
  }

  await save()

  if (saveError.value) {
    automationStudio.value = {
      ...automationStudio.value,
      graphs: previousGraphs,
    }
    return
  }

  await navigateTo(`/profiles/${profileId}/automations`)
}
</script>

<template>
  <div class="flex min-h-0 flex-1 flex-col gap-4">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div class="min-w-0 flex-1 space-y-1">
        <p class="text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground">
          Automation Workflows
        </p>
        <h2 class="text-2xl font-bold">
          {{ pageTitle }}
        </h2>
        <p class="max-w-3xl text-sm text-balance text-muted-foreground">
          {{ pageDescription }}
        </p>
      </div>

      <div class="flex flex-wrap gap-2">
        <Button variant="outline" as-child>
          <NuxtLink :to="`/profiles/${profileId}/automations`">
            Back to workflows
          </NuxtLink>
        </Button>
        <Button variant="outline" as-child>
          <NuxtLink :to="`/profiles/${profileId}/telemetry`">
            Telemetry hub
          </NuxtLink>
        </Button>
        <Button variant="outline" :disabled="pending || saving" @click="refresh()">
          {{ pending ? 'Reloading...' : 'Reload' }}
        </Button>
        <Button
          v-if="currentGraph"
          variant="destructive"
          :disabled="saving"
          @click="handleDelete"
        >
          Delete workflow
        </Button>
        <Button :disabled="pending || saving || !currentGraph" @click="handleSave">
          {{ saving ? 'Saving...' : isNewWorkflow ? 'Create workflow' : 'Save workflow' }}
        </Button>
      </div>
    </div>

    <Alert v-if="saveError" variant="destructive">
      <AlertDescription>{{ saveError }}</AlertDescription>
    </Alert>
    <Alert v-if="saveSuccess">
      <AlertDescription>{{ saveSuccess }}</AlertDescription>
    </Alert>

    <Card v-if="pending && !profile" class="border-border/70 shadow-sm">
      <CardContent class="p-6 text-sm text-muted-foreground">
        Loading automation workflow…
      </CardContent>
    </Card>

    <Card
      v-else-if="editorTarget.mode === 'invalid' || (!currentGraph && !pending)"
      class="border-border/70 shadow-sm"
    >
      <CardContent class="flex min-h-[320px] flex-col items-center justify-center gap-4 p-8 text-center">
        <p class="text-lg font-medium text-foreground">
          Workflow not found
        </p>
        <p class="max-w-lg text-sm leading-6 text-muted-foreground">
          The requested workflow could not be resolved from this profile automation config.
          Return to the workflow list and open an existing item or create a new blueprint.
        </p>
        <Button as-child>
          <NuxtLink :to="`/profiles/${profileId}/automations`">
            Back to workflow list
          </NuxtLink>
        </Button>
      </CardContent>
    </Card>

    <div v-else class="min-h-0 flex-1 overflow-hidden">
      <TelemetryAutomationStudio
        v-model="automationStudio"
        :graph-id="currentGraphId ?? ''"
      />
    </div>
  </div>
</template>