<script setup lang="ts">
import type { ActionRuleEditor } from '@/composables/useTelemetryStudio'

const model = defineModel<ActionRuleEditor[]>({ required: true })

const props = defineProps<{
  onAdd: () => void
  onRemove: (index: number) => void
}>()
</script>

<template>
  <div class="space-y-4">
    <Card>
      <CardHeader class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Action Rules</CardTitle>
          <CardDescription>
            Attach money, global XP, category XP, and future unlock metadata to event keys or completed workflows.
          </CardDescription>
        </div>
        <Button @click="props.onAdd">
          Add action rule
        </Button>
      </CardHeader>
      <CardContent class="space-y-4">
        <Alert>
          <AlertTitle>Use workflow triggers for objectives and trophies</AlertTitle>
          <AlertDescription>
            For objective completions or achievement unlocks, point an action rule at a workflow key instead of a raw event key.
          </AlertDescription>
        </Alert>

        <div v-if="model.length" class="space-y-4">
          <div
            v-for="(rule, index) in model"
            :key="`${rule.name}-${index}`"
            class="rounded-xl border border-border/70 bg-muted/20 p-4"
          >
            <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div class="grid flex-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
                <div class="space-y-2">
                  <Label>Name</Label>
                  <Input v-model="rule.name" placeholder="Capture the Flags reward" />
                </div>
                <div class="space-y-2">
                  <Label>Trigger Kind</Label>
                  <Select v-model="rule.triggerKind">
                    <SelectTrigger>
                      <SelectValue placeholder="Select trigger kind" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EVENT">Event</SelectItem>
                      <SelectItem value="WORKFLOW">Workflow</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="space-y-2 lg:col-span-2">
                  <Label>Trigger Key</Label>
                  <Input v-model="rule.triggerKey" placeholder="objective.capture-the-flags" />
                </div>
              </div>

              <div class="flex items-center gap-3 xl:pt-8">
                <div class="flex items-center gap-2">
                  <Switch
                    :checked="rule.isEnabled"
                    @update:checked="rule.isEnabled = $event"
                  />
                  <Label>Enabled</Label>
                </div>
                <Button variant="destructive" size="sm" @click="props.onRemove(index)">
                  Remove
                </Button>
              </div>
            </div>

            <div class="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div class="space-y-2">
                <Label>Money Amount</Label>
                <Input v-model.number="rule.moneyAmount" type="number" min="0" />
              </div>
              <div class="space-y-2">
                <Label>Total XP</Label>
                <Input v-model.number="rule.xpAmount" type="number" min="0" />
              </div>
              <div class="space-y-2">
                <Label>XP Category</Label>
                <Input v-model="rule.xpCategory" placeholder="achievements" />
              </div>
              <div class="space-y-2">
                <Label>Category XP</Label>
                <Input v-model.number="rule.xpCategoryAmount" type="number" min="0" />
              </div>
            </div>

            <div class="mt-4 space-y-2">
              <Label>Action Config JSON</Label>
              <Textarea
                v-model="rule.configText"
                :rows="6"
                placeholder='{"badge": "first-blood", "rarity": "bronze"}'
              />
            </div>
          </div>
        </div>

        <p v-else class="text-sm text-muted-foreground">
          No action rules yet. Add one to turn an event or workflow into wallet rewards, XP, or future unlock metadata.
        </p>
      </CardContent>
    </Card>
  </div>
</template>