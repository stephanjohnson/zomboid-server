<script setup lang="ts">
import { ArrowUpRight, Sparkles, Workflow } from 'lucide-vue-next'

import {
  automationBlueprintOptions,
  type AutomationBlueprintKey,
  type AutomationStudioGraph,
} from '~~/shared/telemetry-automation'

const props = defineProps<{
  profileId: string
  graphs: AutomationStudioGraph[]
}>()

function createEditorHref(segments: string[]) {
  return `/profiles/${props.profileId}/automations/edit/${segments.map(segment => encodeURIComponent(segment)).join('/')}`
}

function createBlueprintHref(key: AutomationBlueprintKey) {
  return createEditorHref(['new', key])
}

function createGraphHref(graphId: string) {
  return createEditorHref(['graph', graphId])
}
</script>

<template>
  <div class="space-y-6">
    <Card class="border-border/70 bg-gradient-to-t from-primary/5 to-card shadow-xs">
      <CardHeader class="space-y-3">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div class="space-y-1.5">
            <CardTitle class="text-xl font-semibold">
              Automation workflows
            </CardTitle>
            <CardDescription class="max-w-3xl text-sm leading-6">
              Visual workflows turn raw telemetry events into branching gameplay rules. Start from a blueprint,
              then switch into the fullscreen editor to drag typed nodes onto the canvas and configure them in the side panel.
            </CardDescription>
          </div>

          <div class="flex flex-wrap gap-2">
            <Badge variant="secondary">{{ props.graphs.length }} saved</Badge>
            <Badge variant="outline">Fullscreen editor</Badge>
          </div>
        </div>
      </CardHeader>
    </Card>

    <div class="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
      <Card class="border-border/70 shadow-xs">
        <CardHeader>
          <CardTitle class="text-base font-semibold">
            Start From Blueprint
          </CardTitle>
          <CardDescription>
            Create a new workflow with a pre-wired layout instead of starting from an empty canvas.
          </CardDescription>
        </CardHeader>
        <CardContent class="grid gap-3">
          <Button
            v-for="blueprint in automationBlueprintOptions"
            :key="blueprint.key"
            variant="outline"
            class="h-auto justify-start whitespace-normal px-4 py-3 text-left"
            as-child
          >
            <NuxtLink :to="createBlueprintHref(blueprint.key)">
              <span class="flex flex-col items-start gap-1">
                <span class="flex items-center gap-2">
                  <Sparkles class="size-4 text-muted-foreground" />
                  <span class="font-medium text-foreground">{{ blueprint.title }}</span>
                </span>
                <span class="text-xs leading-5 text-muted-foreground">{{ blueprint.description }}</span>
              </span>
            </NuxtLink>
          </Button>
        </CardContent>
      </Card>

      <Card class="border-border/70 shadow-xs">
        <CardHeader>
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle class="text-base font-semibold">
                Workflow Library
              </CardTitle>
              <CardDescription>
                Reopen any saved visual workflow in the dedicated editor.
              </CardDescription>
            </div>

            <Badge variant="secondary">{{ props.graphs.length }}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div v-if="props.graphs.length" class="grid gap-4 lg:grid-cols-2">
            <NuxtLink
              v-for="graph in props.graphs"
              :key="graph.id"
              :to="createGraphHref(graph.id)"
              class="group block rounded bg-muted/10 p-4 transition-colors hover:bg-muted/20"
            >
              <div class="flex h-full flex-col justify-between gap-4">
                <div class="space-y-3">
                  <div class="flex items-start justify-between gap-3">
                    <div class="space-y-1">
                      <p class="font-medium text-foreground">{{ graph.name }}</p>
                      <p class="text-sm leading-6 text-muted-foreground">
                        {{ graph.description || 'No description yet.' }}
                      </p>
                    </div>

                    <Badge :variant="graph.isEnabled ? 'secondary' : 'outline'">
                      {{ graph.isEnabled ? 'Enabled' : 'Disabled' }}
                    </Badge>
                  </div>

                  <div class="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span class="rounded bg-background px-2 py-1">{{ graph.nodes.length }} nodes</span>
                    <span class="rounded bg-background px-2 py-1">{{ graph.edges.length }} links</span>
                    <span class="rounded bg-background px-2 py-1">{{ graph.id }}</span>
                  </div>
                </div>

                <div class="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Workflow class="size-4 text-muted-foreground" />
                  Open fullscreen editor
                  <ArrowUpRight class="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </div>
            </NuxtLink>
          </div>

          <div
            v-else
            class="flex flex-col items-center justify-center gap-3 rounded border border-dashed border-border/60 bg-card/60 px-6 py-12 text-center"
          >
            <p class="text-base font-medium text-foreground">
              No automation workflows yet
            </p>
            <p class="max-w-lg text-sm leading-6 text-muted-foreground">
              Start with a blank rule or a gameplay blueprint, then build the branching logic in the dedicated editor.
            </p>
            <Button as-child>
              <NuxtLink :to="createBlueprintHref('blank-rule')">
                Create blank workflow
              </NuxtLink>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>