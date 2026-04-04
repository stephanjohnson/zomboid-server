<script setup lang="ts">
import type { WorkflowEditor, WorkflowKind } from '@/composables/useTelemetryStudio'

const model = defineModel<WorkflowEditor[]>({ required: true })

const props = defineProps<{
  onAdd: (kind?: WorkflowKind) => void
  onRemove: (index: number) => void
  onAddStep: (workflowIndex: number) => void
  onRemoveStep: (workflowIndex: number, stepIndex: number) => void
  onUpdateKey: (workflowIndex: number, nextKey: string) => void
}>()
</script>

<template>
  <div class="space-y-4">
    <Card>
      <CardHeader class="space-y-4">
        <div class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <CardTitle>Workflows</CardTitle>
            <CardDescription>
              Sequence raw event keys into reusable triggers. Mark them as objectives or achievements to classify the unlock.
            </CardDescription>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button variant="outline" @click="props.onAdd('workflow')">
              Add workflow
            </Button>
            <Button variant="outline" @click="props.onAdd('objective')">
              Add objective
            </Button>
            <Button variant="outline" @click="props.onAdd('achievement')">
              Add achievement
            </Button>
          </div>
        </div>
        <Alert>
          <AlertTitle>Objective and achievement ready</AlertTitle>
          <AlertDescription>
            A workflow key can power a timed objective, a trophy unlock, or a server achievement. The distinction lives in the workflow kind and metadata, not in separate reward code.
          </AlertDescription>
        </Alert>
      </CardHeader>
      <CardContent class="space-y-4">
        <div v-if="model.length" class="space-y-4">
          <div
            v-for="(workflow, workflowIndex) in model"
            :key="`${workflow.key}-${workflowIndex}`"
            class="rounded-xl border border-border/70 bg-muted/20 p-4"
          >
            <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div class="grid flex-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
                <div class="space-y-2">
                  <Label>Name</Label>
                  <Input v-model="workflow.name" placeholder="Capture the Flags in Order" />
                </div>
                <div class="space-y-2">
                  <Label>Workflow Key</Label>
                  <Input
                    :model-value="workflow.key"
                    placeholder="objective.capture-the-flags"
                    @update:model-value="props.onUpdateKey(workflowIndex, $event)"
                  />
                </div>
                <div class="space-y-2">
                  <Label>Kind</Label>
                  <Select v-model="workflow.kind">
                    <SelectTrigger>
                      <SelectValue placeholder="Select workflow kind" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workflow">Workflow</SelectItem>
                      <SelectItem value="objective">Objective</SelectItem>
                      <SelectItem value="achievement">Achievement</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="flex items-end gap-3">
                  <div class="flex items-center gap-2 pb-2">
                    <Switch
                      :checked="workflow.isEnabled"
                      @update:checked="workflow.isEnabled = $event"
                    />
                    <Label>Enabled</Label>
                  </div>
                </div>
              </div>

              <Button variant="destructive" size="sm" @click="props.onRemove(workflowIndex)">
                Remove workflow
              </Button>
            </div>

            <div class="mt-4 space-y-3">
              <div class="flex items-center justify-between">
                <Label>Steps</Label>
                <Button variant="outline" size="sm" @click="props.onAddStep(workflowIndex)">
                  Add step
                </Button>
              </div>

              <div class="space-y-3">
                <div
                  v-for="(step, stepIndex) in workflow.steps"
                  :key="`${workflow.key}-${stepIndex}`"
                  class="rounded-lg border border-border/70 bg-background/80 p-3"
                >
                  <div class="grid gap-3 lg:grid-cols-[120px_minmax(0,1fr)_160px_auto] lg:items-end">
                    <div class="space-y-2">
                      <Label>Step</Label>
                      <Input v-model.number="step.stepOrder" type="number" min="1" />
                    </div>
                    <div class="space-y-2">
                      <Label>Event Key</Label>
                      <Input v-model="step.eventKey" placeholder="objective.flag.alpha.claimed" />
                    </div>
                    <div class="space-y-2">
                      <Label>Within Seconds</Label>
                      <Input v-model="step.withinSeconds" type="number" min="1" placeholder="Optional" />
                    </div>
                    <Button variant="ghost" size="sm" @click="props.onRemoveStep(workflowIndex, stepIndex)">
                      Remove step
                    </Button>
                  </div>

                  <div class="mt-3 space-y-2">
                    <Label>Match Config JSON</Label>
                    <Textarea
                      v-model="step.matchConfigText"
                      :rows="4"
                      placeholder='{"team": "red"}'
                    />
                  </div>
                </div>
              </div>
            </div>

            <Separator class="my-4" />

            <div class="space-y-2">
              <Label>Workflow Metadata JSON</Label>
              <Textarea
                v-model="workflow.configText"
                :rows="6"
                placeholder='{"title": "Capture the Flags", "tier": "gold"}'
              />
            </div>
          </div>
        </div>

        <p v-else class="text-sm text-muted-foreground">
          No workflows yet. Add one to transform raw events into reusable triggers for objectives, trophies, or achievements.
        </p>
      </CardContent>
    </Card>
  </div>
</template>