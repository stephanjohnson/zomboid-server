<script setup lang="ts">
import type { PresetType } from '@/composables/useTelemetryStudio'

const props = defineProps<{
  profileName: string
  automationGraphCount: number
  listenerCount: number
  workflowCount: number
  objectiveCount: number
  achievementCount: number
  actionRuleCount: number
  topXpPlayers: Array<{ username: string, totalXp: number }>
}>()

const emit = defineEmits<{
  (e: 'apply-preset', preset: PresetType): void
}>()

const presets: Array<{
  key: PresetType
  title: string
  description: string
  detail: string
}> = [
  {
    key: 'ordered-objective',
    title: 'Ordered objective',
    description: 'Scaffold a capture-the-flag style objective with ordered steps, time windows, XP, and wallet rewards.',
    detail: 'Best for admin-spawned objectives, checkpoints, extractions, and team race modes.',
  },
  {
    key: 'achievement-trophy',
    title: 'Achievement trophy',
    description: 'Create a one-time unlock flow that feels like a Steam, Xbox, or PlayStation trophy event.',
    detail: 'Best for platform-style achievements, milestones, rare finds, and named unlocks.',
  },
  {
    key: 'sequence-challenge',
    title: 'Custom sequence',
    description: 'Start from a blank three-step sequence and replace the event keys with your own custom or mod-generated events.',
    detail: 'Best for future objective systems and custom game modes that emit their own internal events.',
  },
]
</script>

<template>
  <div class="space-y-6">
    <Card class="border-slate-300/70 bg-gradient-to-br from-slate-50 via-white to-amber-50/50">
      <CardHeader class="space-y-3">
        <div class="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{{ props.profileName }}</Badge>
          <Badge variant="outline">{{ props.automationGraphCount }} rule graphs</Badge>
          <Badge variant="outline">{{ props.listenerCount }} listeners</Badge>
          <Badge variant="outline">{{ props.workflowCount }} workflows</Badge>
          <Badge variant="outline">{{ props.actionRuleCount }} actions</Badge>
          <Badge variant="outline">{{ props.objectiveCount }} objectives</Badge>
          <Badge variant="outline">{{ props.achievementCount }} achievements</Badge>
        </div>
        <div class="space-y-2">
          <CardTitle class="text-3xl">Telemetry Studio</CardTitle>
          <CardDescription class="max-w-3xl text-sm leading-6">
            Configure which adapters listen to Project Zomboid events, compose those raw facts into ordered workflows,
            then attach money, XP, objective rewards, or achievement-style unlocks without coupling rewards directly to one hook.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div class="grid gap-4 md:grid-cols-3">
          <div class="rounded-xl border border-border/70 bg-background/80 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Rule Graphs</p>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              Design branching trigger and reward logic visually, then drop back to the raw editors when you need lower-level control.
            </p>
          </div>
          <div class="rounded-xl border border-border/70 bg-background/80 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Objectives</p>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              Model server activities as ordered steps like claim flag, reach zone, deliver item, or survive wave.
            </p>
          </div>
          <div class="rounded-xl border border-border/70 bg-background/80 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Achievements</p>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              Mark workflows as achievements to power trophy, badge, or platform-style unlock metadata later.
            </p>
          </div>
          <div class="rounded-xl border border-border/70 bg-background/80 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Economy + XP</p>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              Award wallet balance, universal XP, category XP, or achievement progression from the same trigger pipeline.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>

    <div class="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(280px,0.9fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Preset Blueprints</CardTitle>
          <CardDescription>
            Start from objective and achievement scaffolds, then edit the event keys and metadata to fit your game mode.
          </CardDescription>
        </CardHeader>
        <CardContent class="grid gap-4 md:grid-cols-3">
          <div
            v-for="preset in presets"
            :key="preset.key"
            class="flex h-full flex-col justify-between rounded-xl border border-border/70 bg-muted/30 p-4"
          >
            <div class="space-y-2">
              <p class="font-medium">{{ preset.title }}</p>
              <p class="text-sm leading-6 text-muted-foreground">{{ preset.description }}</p>
              <p class="text-xs leading-5 text-muted-foreground">{{ preset.detail }}</p>
            </div>
            <Button class="mt-4 w-full" variant="outline" @click="emit('apply-preset', preset.key)">
              Add {{ preset.title }}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Top XP Players</CardTitle>
          <CardDescription>
            Current XP leaders for this profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div v-if="props.topXpPlayers.length" class="space-y-3">
            <div
              v-for="player in props.topXpPlayers"
              :key="player.username"
              class="flex items-center justify-between rounded-lg border border-border/70 px-3 py-2"
            >
              <span class="font-medium">{{ player.username }}</span>
              <Badge variant="secondary">{{ player.totalXp.toLocaleString() }} XP</Badge>
            </div>
          </div>
          <p v-else class="text-sm text-muted-foreground">
            No XP has been granted yet for this profile.
          </p>
        </CardContent>
      </Card>
    </div>
  </div>
</template>