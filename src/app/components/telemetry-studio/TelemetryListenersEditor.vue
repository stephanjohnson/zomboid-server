<script setup lang="ts">
import type { TelemetryListenerEditor } from '@/composables/useTelemetryStudio'

const model = defineModel<TelemetryListenerEditor[]>({ required: true })

const props = defineProps<{
  onAdd: () => void
  onRemove: (index: number) => void
}>()

const adapterExamples = [
  'pz.player_snapshot',
  'pz.pvp_kill_tracker',
  'pz.item_found',
  'pz.build_action',
  'custom.objective_adapter',
]
</script>

<template>
  <div class="space-y-4">
    <Card>
      <CardHeader class="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <CardTitle>Listeners</CardTitle>
          <CardDescription>
            Listeners map runtime adapters to normalized event keys. Keep these focused on raw capture, not rewards.
          </CardDescription>
        </div>
        <Button @click="props.onAdd">
          Add listener
        </Button>
      </CardHeader>
      <CardContent class="space-y-4">
        <div class="flex flex-wrap gap-2 text-xs text-muted-foreground">
          <Badge v-for="adapter in adapterExamples" :key="adapter" variant="outline">
            {{ adapter }}
          </Badge>
        </div>

        <div v-if="model.length" class="space-y-4">
          <div
            v-for="(listener, index) in model"
            :key="`${listener.adapterKey}-${index}`"
            class="rounded-xl border border-border/70 bg-muted/20 p-4"
          >
            <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
              <div class="grid flex-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div class="space-y-2">
                  <Label>Name</Label>
                  <Input v-model="listener.name" placeholder="Build action events" />
                </div>
                <div class="space-y-2">
                  <Label>Adapter Key</Label>
                  <Input v-model="listener.adapterKey" placeholder="pz.build_action" />
                </div>
                <div class="space-y-2 md:col-span-2">
                  <Label>Event Key</Label>
                  <Input v-model="listener.eventKey" placeholder="pz.build.action" />
                </div>
              </div>

              <div class="flex items-center gap-3 xl:pt-8">
                <div class="flex items-center gap-2">
                  <Switch
                    :checked="listener.isEnabled"
                    @update:checked="listener.isEnabled = $event"
                  />
                  <Label>Enabled</Label>
                </div>
                <Button variant="destructive" size="sm" @click="props.onRemove(index)">
                  Remove
                </Button>
              </div>
            </div>

            <div class="mt-4 space-y-2">
              <Label>Config JSON</Label>
              <Textarea
                v-model="listener.configText"
                :rows="6"
                placeholder='{"snapshotIntervalMinutes": 12}'
              />
            </div>
          </div>
        </div>

        <p v-else class="text-sm text-muted-foreground">
          No listeners configured yet. Start with a Project Zomboid adapter or a custom objective adapter.
        </p>
      </CardContent>
    </Card>
  </div>
</template>