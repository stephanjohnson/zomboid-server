<script setup lang="ts">
import type {
  AchievementPlatform,
  AchievementTier,
  ObjectiveCard,
  ObjectiveDetailsPatch,
  ObjectiveRewardDetailsPatch,
  ObjectiveTeamScope,
  ObjectiveType,
  ObjectiveVisibility,
  WorkflowKind,
} from '@/composables/useTelemetryStudio'

const props = defineProps<{
  cards: ObjectiveCard[]
  onAdd: (kind?: WorkflowKind) => void
  onRemove: (workflowIndex: number) => void
  onAddStep: (workflowIndex: number) => void
  onRemoveStep: (workflowIndex: number, stepIndex: number) => void
  onUpdateKey: (workflowIndex: number, nextKey: string) => void
  onEnsureReward: (workflowIndex: number) => number | null
  onUpdateDetails: (workflowIndex: number, patch: ObjectiveDetailsPatch) => void
  onUpdateRewardDetails: (workflowIndex: number, patch: ObjectiveRewardDetailsPatch) => void
}>()

const objectiveTypes: Array<{ value: ObjectiveType, label: string }> = [
  { value: 'flag', label: 'Flag' },
  { value: 'checkpoint', label: 'Checkpoint' },
  { value: 'zone', label: 'Zone' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'extraction', label: 'Extraction' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'trophy', label: 'Trophy' },
]

const visibilityOptions: Array<{ value: ObjectiveVisibility, label: string }> = [
  { value: 'tracked', label: 'Tracked' },
  { value: 'public', label: 'Public' },
  { value: 'hidden', label: 'Hidden' },
]

const teamScopeOptions: Array<{ value: ObjectiveTeamScope, label: string }> = [
  { value: 'solo', label: 'Solo' },
  { value: 'team', label: 'Team' },
  { value: 'global', label: 'Global' },
]

const platformOptions: Array<{ value: AchievementPlatform, label: string }> = [
  { value: 'universal', label: 'Universal' },
  { value: 'steam', label: 'Steam' },
  { value: 'xbox', label: 'Xbox' },
  { value: 'playstation', label: 'PlayStation' },
]

const tierOptions: Array<{ value: AchievementTier, label: string }> = [
  { value: 'bronze', label: 'Bronze' },
  { value: 'silver', label: 'Silver' },
  { value: 'gold', label: 'Gold' },
  { value: 'platinum', label: 'Platinum' },
]

function ensureReward(workflowIndex: number) {
  props.onEnsureReward(workflowIndex)
}

function updateDetails(workflowIndex: number, patch: ObjectiveDetailsPatch) {
  props.onUpdateDetails(workflowIndex, patch)
}

function updateRewardDetails(workflowIndex: number, patch: ObjectiveRewardDetailsPatch) {
  props.onUpdateRewardDetails(workflowIndex, patch)
}
</script>

<template>
  <div class="space-y-5">
    <Card class="border-slate-300/70 bg-gradient-to-br from-white via-slate-50 to-amber-50/70 shadow-sm">
      <CardHeader class="space-y-4">
        <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div class="space-y-2">
            <CardTitle>Objectives and Achievements</CardTitle>
            <CardDescription class="max-w-3xl text-sm leading-6">
              Use structured fields for world objectives, capture flows, deliveries, and platform-style trophies.
              The advanced Workflows and Actions tabs stay available for lower-level tuning, but this tab is the main editor.
            </CardDescription>
          </div>
          <div class="flex flex-wrap gap-2">
            <Button variant="outline" @click="props.onAdd('objective')">
              Add objective
            </Button>
            <Button variant="outline" @click="props.onAdd('achievement')">
              Add achievement
            </Button>
          </div>
        </div>

        <div class="grid gap-3 md:grid-cols-3">
          <div class="rounded-2xl border border-border/70 bg-background/80 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">World objectives</p>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              Build named activities like checkpoint runs, extractions, zone captures, or delivery chains.
            </p>
          </div>
          <div class="rounded-2xl border border-border/70 bg-background/80 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Achievement UX</p>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              Add badge IDs, platform labels, and trophy tiers without forcing admins to edit raw JSON first.
            </p>
          </div>
          <div class="rounded-2xl border border-border/70 bg-background/80 p-4">
            <p class="text-xs font-semibold uppercase tracking-[0.24em] text-muted-foreground">Rewards</p>
            <p class="mt-2 text-sm leading-6 text-muted-foreground">
              Attach wallet, XP, category XP, and unlock metadata directly to the objective flow.
            </p>
          </div>
        </div>
      </CardHeader>
    </Card>

    <div v-if="props.cards.length" class="space-y-5">
      <Card
        v-for="card in props.cards"
        :key="`${card.workflow.key}-${card.workflowIndex}`"
        class="overflow-hidden border-border/70 shadow-sm"
      >
        <CardHeader class="border-b border-border/70 bg-slate-50/70">
          <div class="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
            <div class="space-y-3">
              <div class="flex flex-wrap items-center gap-2">
                <Badge :variant="card.workflow.kind === 'achievement' ? 'secondary' : 'outline'">
                  {{ card.workflow.kind === 'achievement' ? 'Achievement' : 'Objective' }}
                </Badge>
                <Badge variant="outline">{{ card.workflow.steps.length }} steps</Badge>
                <Badge v-if="card.rewardRule" variant="outline">
                  Reward linked
                </Badge>
                <Badge v-if="card.extraRewardCount > 0" variant="outline">
                  +{{ card.extraRewardCount }} extra rewards
                </Badge>
                <Badge v-if="card.details.badgeId" variant="outline">
                  {{ card.details.badgeId }}
                </Badge>
              </div>
              <div>
                <CardTitle class="text-2xl">{{ card.workflow.name || 'Untitled objective' }}</CardTitle>
                <CardDescription class="mt-1 text-sm leading-6">
                  {{ card.details.summary || 'Add a player-facing summary so admins know what this automation is meant to do.' }}
                </CardDescription>
              </div>
            </div>

            <div class="flex items-center gap-3 xl:pt-2">
              <div class="flex items-center gap-2 rounded-full border border-border/70 bg-background px-3 py-2">
                <Switch
                  :checked="card.workflow.isEnabled"
                  @update:checked="card.workflow.isEnabled = $event"
                />
                <Label>Enabled</Label>
              </div>
              <Button variant="destructive" size="sm" @click="props.onRemove(card.workflowIndex)">
                Remove
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent class="space-y-6 p-6">
          <div class="grid gap-6 2xl:grid-cols-[minmax(0,1.6fr)_minmax(340px,1fr)]">
            <div class="space-y-6">
              <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div class="space-y-2 xl:col-span-2">
                  <Label>Name</Label>
                  <Input v-model="card.workflow.name" placeholder="Capture the Riverside route" />
                </div>
                <div class="space-y-2 xl:col-span-2">
                  <Label>Key</Label>
                  <Input
                    :model-value="card.workflow.key"
                    placeholder="objective.capture-the-riverside-route"
                    @update:model-value="props.onUpdateKey(card.workflowIndex, $event)"
                  />
                </div>
                <div class="space-y-2">
                  <Label>Type</Label>
                  <Select
                    :model-value="card.details.objectiveType"
                    @update:model-value="updateDetails(card.workflowIndex, { objectiveType: $event as ObjectiveType })"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select objective type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="option in objectiveTypes" :key="option.value" :value="option.value">
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="space-y-2">
                  <Label>Visibility</Label>
                  <Select
                    :model-value="card.details.visibility"
                    @update:model-value="updateDetails(card.workflowIndex, { visibility: $event as ObjectiveVisibility })"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select visibility" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="option in visibilityOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="space-y-2">
                  <Label>Team Scope</Label>
                  <Select
                    :model-value="card.details.teamScope"
                    @update:model-value="updateDetails(card.workflowIndex, { teamScope: $event as ObjectiveTeamScope })"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select team scope" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="option in teamScopeOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="space-y-2">
                  <Label>Icon</Label>
                  <Input
                    :model-value="card.details.icon"
                    placeholder="flag"
                    @update:model-value="updateDetails(card.workflowIndex, { icon: $event })"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <Label>Player-Facing Summary</Label>
                <Textarea
                  :model-value="card.details.summary"
                  :rows="3"
                  placeholder="Claim Alpha, then Bravo, then score at extraction before the route timer expires."
                  @update:model-value="updateDetails(card.workflowIndex, { summary: $event })"
                />
              </div>

              <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div class="space-y-2">
                  <Label>Marker Label</Label>
                  <Input
                    :model-value="card.details.markerLabel"
                    placeholder="Alpha > Bravo > Extract"
                    @update:model-value="updateDetails(card.workflowIndex, { markerLabel: $event })"
                  />
                </div>
                <div class="space-y-2">
                  <Label>Location Label</Label>
                  <Input
                    :model-value="card.details.locationLabel"
                    placeholder="Riverside route"
                    @update:model-value="updateDetails(card.workflowIndex, { locationLabel: $event })"
                  />
                </div>
                <div class="space-y-2">
                  <Label>Zone Id</Label>
                  <Input
                    :model-value="card.details.zoneId"
                    placeholder="ctf.riverside.route"
                    @update:model-value="updateDetails(card.workflowIndex, { zoneId: $event })"
                  />
                </div>
                <div class="space-y-2">
                  <Label>Accent Color</Label>
                  <Input
                    :model-value="card.details.accentColor"
                    placeholder="amber"
                    @update:model-value="updateDetails(card.workflowIndex, { accentColor: $event })"
                  />
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <div class="space-y-2">
                  <Label>Badge / Unlock Id</Label>
                  <Input
                    :model-value="card.details.badgeId"
                    placeholder="ctf-victory"
                    @update:model-value="updateDetails(card.workflowIndex, { badgeId: $event })"
                  />
                </div>
                <div class="space-y-2">
                  <Label>Platform</Label>
                  <Select
                    :model-value="card.details.platform"
                    @update:model-value="updateDetails(card.workflowIndex, { platform: $event as AchievementPlatform })"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select platform" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="option in platformOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="space-y-2">
                  <Label>Trophy Tier</Label>
                  <Select
                    :model-value="card.details.trophyTier"
                    @update:model-value="updateDetails(card.workflowIndex, { trophyTier: $event as AchievementTier })"
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select tier" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem v-for="option in tierOptions" :key="option.value" :value="option.value">
                        {{ option.label }}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div class="flex items-end">
                  <div class="flex items-center gap-2 rounded-xl border border-border/70 bg-muted/30 px-3 py-2">
                    <Switch
                      :checked="card.details.hiddenUntilUnlocked"
                      @update:checked="updateDetails(card.workflowIndex, { hiddenUntilUnlocked: $event })"
                    />
                    <Label>Hidden until unlocked</Label>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <Label>Workflow Steps</Label>
                  <Button variant="outline" size="sm" @click="props.onAddStep(card.workflowIndex)">
                    Add step
                  </Button>
                </div>

                <div class="space-y-3">
                  <div
                    v-for="(step, stepIndex) in card.workflow.steps"
                    :key="`${card.workflow.key}-${stepIndex}`"
                    class="rounded-2xl border border-border/70 bg-slate-50/60 p-4"
                  >
                    <div class="grid gap-3 lg:grid-cols-[96px_minmax(0,1fr)_160px_auto] lg:items-end">
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
                      <Button variant="ghost" size="sm" @click="props.onRemoveStep(card.workflowIndex, stepIndex)">
                        Remove step
                      </Button>
                    </div>

                    <div class="mt-3 space-y-2">
                      <Label>Match Config JSON</Label>
                      <Textarea
                        v-model="step.matchConfigText"
                        :rows="3"
                        placeholder='{"team": "red"}'
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div class="space-y-2">
                <Label>Operator Notes</Label>
                <Textarea
                  :model-value="card.details.notes"
                  :rows="4"
                  placeholder="Use this space for GM notes, event sequencing constraints, or admin runbook details."
                  @update:model-value="updateDetails(card.workflowIndex, { notes: $event })"
                />
              </div>
            </div>

            <div class="space-y-4">
              <div class="rounded-3xl border border-border/70 bg-muted/20 p-5">
                <div class="flex items-center justify-between gap-3">
                  <div>
                    <p class="text-sm font-semibold">Reward Summary</p>
                    <p class="mt-1 text-sm leading-6 text-muted-foreground">
                      Attach grants and unlock metadata to the completed workflow.
                    </p>
                  </div>
                  <Button v-if="!card.rewardRule" variant="outline" size="sm" @click="ensureReward(card.workflowIndex)">
                    Attach reward
                  </Button>
                </div>

                <div v-if="card.rewardRule" class="mt-4 space-y-4">
                  <div class="grid gap-3 md:grid-cols-2">
                    <div class="space-y-2">
                      <Label>Reward Rule Name</Label>
                      <Input v-model="card.rewardRule.name" placeholder="Objective completion reward" />
                    </div>
                    <div class="flex items-end">
                      <div class="flex items-center gap-2 rounded-xl border border-border/70 bg-background px-3 py-2">
                        <Switch
                          :checked="card.rewardRule.isEnabled"
                          @update:checked="card.rewardRule.isEnabled = $event"
                        />
                        <Label>Reward enabled</Label>
                      </div>
                    </div>
                  </div>

                  <div class="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <div class="space-y-2">
                      <Label>Money</Label>
                      <Input v-model.number="card.rewardRule.moneyAmount" type="number" min="0" />
                    </div>
                    <div class="space-y-2">
                      <Label>Total XP</Label>
                      <Input v-model.number="card.rewardRule.xpAmount" type="number" min="0" />
                    </div>
                    <div class="space-y-2">
                      <Label>XP Category</Label>
                      <Input v-model="card.rewardRule.xpCategory" placeholder="objectives" />
                    </div>
                    <div class="space-y-2">
                      <Label>Category XP</Label>
                      <Input v-model.number="card.rewardRule.xpCategoryAmount" type="number" min="0" />
                    </div>
                  </div>

                  <Separator />

                  <div class="grid gap-3 md:grid-cols-2">
                    <div class="space-y-2">
                      <Label>Reward Badge</Label>
                      <Input
                        :model-value="card.rewardDetails?.badge ?? ''"
                        placeholder="ctf-victory"
                        @update:model-value="updateRewardDetails(card.workflowIndex, { badge: $event })"
                      />
                    </div>
                    <div class="space-y-2">
                      <Label>Reward Type</Label>
                      <Input
                        :model-value="card.rewardDetails?.rewardType ?? card.workflow.kind"
                        placeholder="objective"
                        @update:model-value="updateRewardDetails(card.workflowIndex, { rewardType: $event })"
                      />
                    </div>
                    <div class="space-y-2">
                      <Label>Reward Platform</Label>
                      <Select
                        :model-value="card.rewardDetails?.platform ?? card.details.platform"
                        @update:model-value="updateRewardDetails(card.workflowIndex, { platform: $event as AchievementPlatform })"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select reward platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem v-for="option in platformOptions" :key="option.value" :value="option.value">
                            {{ option.label }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div class="space-y-2">
                      <Label>Reward Tier</Label>
                      <Select
                        :model-value="card.rewardDetails?.tier ?? card.details.trophyTier"
                        @update:model-value="updateRewardDetails(card.workflowIndex, { tier: $event as AchievementTier })"
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select reward tier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem v-for="option in tierOptions" :key="option.value" :value="option.value">
                            {{ option.label }}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div class="flex items-center gap-2 rounded-2xl border border-border/70 bg-background px-3 py-2">
                    <Switch
                      :checked="card.rewardDetails?.unlock ?? false"
                      @update:checked="updateRewardDetails(card.workflowIndex, { unlock: $event })"
                    />
                    <Label>Create unlock/badge event metadata</Label>
                  </div>
                </div>

                <p v-else class="mt-4 text-sm text-muted-foreground">
                  No reward is linked yet. Attach one if completing this objective should grant money, XP, or an unlock.
                </p>
              </div>

              <Alert>
                <AlertTitle>Advanced editing stays available</AlertTitle>
                <AlertDescription>
                  Use this tab for the common objective fields, then switch to Workflows or Actions if you need to hand-edit raw metadata or attach additional reward rules.
                </AlertDescription>
              </Alert>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>

    <Card v-else>
      <CardContent class="space-y-4 p-6">
        <div class="space-y-2">
          <p class="text-sm font-medium">No objectives or achievements yet.</p>
          <p class="text-sm leading-6 text-muted-foreground">
            Start here when you want a cleaner editor for flags, checkpoints, extractions, trophies, and unlock rewards.
          </p>
        </div>
        <div class="flex flex-wrap gap-2">
          <Button variant="outline" @click="props.onAdd('objective')">
            Add objective
          </Button>
          <Button variant="outline" @click="props.onAdd('achievement')">
            Add achievement
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>