import { computed, ref, shallowRef, watch } from 'vue'

import {
  createEmptyAutomationStudioDocument,
  normalizeAutomationStudioDocument,
  type AutomationStudioDocument,
} from '~~/shared/telemetry-automation'

export type WorkflowKind = 'workflow' | 'objective' | 'achievement'
export type PresetType = 'ordered-objective' | 'achievement-trophy' | 'unlock-pvp-objective' | 'sequence-challenge'
export type ObjectiveType = 'flag' | 'checkpoint' | 'zone' | 'delivery' | 'extraction' | 'milestone' | 'trophy'
export type ObjectiveVisibility = 'tracked' | 'public' | 'hidden'
export type ObjectiveTeamScope = 'solo' | 'team' | 'global'
export type AchievementPlatform = 'universal' | 'steam' | 'xbox' | 'playstation'
export type AchievementTier = 'bronze' | 'silver' | 'gold' | 'platinum'

export interface TelemetryListenerEditor {
  adapterKey: string
  name: string
  eventKey: string
  isEnabled: boolean
  configText: string
}

export interface WorkflowStepEditor {
  stepOrder: number
  eventKey: string
  withinSeconds: string
  matchConfigText: string
}

export interface WorkflowEditor {
  key: string
  name: string
  kind: WorkflowKind
  isEnabled: boolean
  configText: string
  steps: WorkflowStepEditor[]
}

export interface ActionRuleEditor {
  name: string
  triggerKind: 'EVENT' | 'WORKFLOW'
  triggerKey: string
  isEnabled: boolean
  moneyAmount: number
  xpAmount: number
  xpCategory: string
  xpCategoryAmount: number
  configText: string
}

export interface ObjectiveDetails {
  objectiveType: ObjectiveType
  summary: string
  visibility: ObjectiveVisibility
  teamScope: ObjectiveTeamScope
  markerLabel: string
  locationLabel: string
  zoneId: string
  icon: string
  accentColor: string
  badgeId: string
  platform: AchievementPlatform
  trophyTier: AchievementTier
  hiddenUntilUnlocked: boolean
  notes: string
}

export interface ObjectiveRewardDetails {
  badge: string
  unlock: boolean
  rewardType: string
  platform: AchievementPlatform
  tier: AchievementTier
}

export interface ObjectiveCard {
  workflowIndex: number
  workflow: WorkflowEditor
  details: ObjectiveDetails
  rewardRuleIndex: number | null
  rewardRule: ActionRuleEditor | null
  rewardDetails: ObjectiveRewardDetails | null
  extraRewardCount: number
}

export interface ObjectiveDetailsPatch {
  summary?: string
  visibility?: ObjectiveVisibility
  teamScope?: ObjectiveTeamScope
  markerLabel?: string
  locationLabel?: string
  zoneId?: string
  icon?: string
  accentColor?: string
  badgeId?: string
  platform?: AchievementPlatform
  trophyTier?: AchievementTier
  hiddenUntilUnlocked?: boolean
  notes?: string
  objectiveType?: ObjectiveType
}

export interface ObjectiveRewardDetailsPatch {
  badge?: string
  unlock?: boolean
  rewardType?: string
  platform?: AchievementPlatform
  tier?: AchievementTier
}

export interface TelemetryPresetBundle {
  workflow: WorkflowEditor
  actionRule: ActionRuleEditor
}

interface TelemetryStudioResponse {
  profile: {
    id: string
    name: string
    servername: string
    automationStudioConfig: unknown | null
    telemetryListeners: Array<{
      adapterKey: string
      name: string
      eventKey: string | null
      isEnabled: boolean
      config: Record<string, unknown> | null
    }>
    workflows: Array<{
      key: string
      name: string
      isEnabled: boolean
      config: Record<string, unknown> | null
      steps: Array<{
        stepOrder: number
        eventKey: string
        withinSeconds: number | null
        matchConfig: Record<string, unknown> | null
      }>
    }>
    actionRules: Array<{
      name: string
      triggerKind: 'EVENT' | 'WORKFLOW'
      triggerKey: string
      isEnabled: boolean
      moneyAmount: number
      xpAmount: number
      xpCategory: string | null
      xpCategoryAmount: number
      config: Record<string, unknown> | null
    }>
  }
  xpBalances: Array<{
    totalXp: number
    player: { username: string }
  }>
  xpCategories: Array<{
    category: string
    totalXp: number
    player: { username: string }
  }>
}

function asRecord(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {}
  }

  return value as Record<string, unknown>
}

function getString(config: Record<string, unknown>, key: string, fallback = ''): string {
  const value = config[key]
  return typeof value === 'string' ? value : fallback
}

function getBoolean(config: Record<string, unknown>, key: string, fallback = false): boolean {
  const value = config[key]
  return typeof value === 'boolean' ? value : fallback
}

function prettyJson(value?: Record<string, unknown> | null): string {
  if (!value || Object.keys(value).length === 0) {
    return ''
  }

  return JSON.stringify(value, null, 2)
}

function parseJsonText(text: string, label: string): Record<string, unknown> | undefined {
  const trimmed = text.trim()
  if (!trimmed) {
    return undefined
  }

  try {
    const parsed = JSON.parse(trimmed)
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      throw new Error(`${label} must be a JSON object`)
    }

    return parsed as Record<string, unknown>
  }
  catch (error) {
    throw new Error(error instanceof Error ? `${label}: ${error.message}` : `${label}: Invalid JSON`)
  }
}

function safeParseJsonText(text: string): Record<string, unknown> {
  try {
    return parseJsonText(text, 'Config') ?? {}
  }
  catch {
    return {}
  }
}

function cleanConfigRecord(value: Record<string, unknown>): Record<string, unknown> {
  return Object.entries(value).reduce<Record<string, unknown>>((acc, [key, innerValue]) => {
    if (innerValue == null || innerValue === '') {
      return acc
    }

    if (Array.isArray(innerValue)) {
      if (innerValue.length > 0) {
        acc[key] = innerValue
      }
      return acc
    }

    if (typeof innerValue === 'object') {
      const cleaned = cleanConfigRecord(asRecord(innerValue))
      if (Object.keys(cleaned).length > 0) {
        acc[key] = cleaned
      }
      return acc
    }

    acc[key] = innerValue
    return acc
  }, {})
}

function createUniqueKey(baseKey: string, existingKeys: string[]): string {
  if (!existingKeys.includes(baseKey)) {
    return baseKey
  }

  let suffix = 2
  while (existingKeys.includes(`${baseKey}.${suffix}`)) {
    suffix = suffix + 1
  }

  return `${baseKey}.${suffix}`
}

function normalizeWorkflowKind(config: Record<string, unknown>): WorkflowKind {
  const kind = config.kind
  if (kind === 'objective' || kind === 'achievement') {
    return kind
  }

  return 'workflow'
}

function stripKind(config: Record<string, unknown>): Record<string, unknown> {
  const next = { ...config }
  delete next.kind
  return next
}

function defaultObjectiveType(kind: WorkflowKind): ObjectiveType {
  if (kind === 'achievement') {
    return 'trophy'
  }

  return 'flag'
}

function defaultListener(): TelemetryListenerEditor {
  return {
    adapterKey: 'pz.custom_adapter',
    name: 'Custom listener',
    eventKey: 'custom.event.key',
    isEnabled: true,
    configText: '',
  }
}

function defaultWorkflow(kind: WorkflowKind = 'workflow'): WorkflowEditor {
  const config = kind === 'objective'
    ? {
        title: 'New objective',
        objectiveType: 'flag',
        visibility: 'tracked',
        teamScope: 'team',
      }
    : kind === 'achievement'
      ? {
          title: 'New achievement',
          objectiveType: 'trophy',
          platform: 'universal',
          trophyTier: 'bronze',
        }
      : {}

  return {
    key: kind === 'objective' ? 'objective.new-sequence' : kind === 'achievement' ? 'achievement.new-unlock' : 'workflow.new-sequence',
    name: kind === 'objective' ? 'New objective sequence' : kind === 'achievement' ? 'New achievement unlock' : 'New workflow',
    kind,
    isEnabled: true,
    configText: prettyJson(config),
    steps: [
      {
        stepOrder: 1,
        eventKey: kind === 'objective' ? 'objective.custom.started' : kind === 'achievement' ? 'pz.zombie.kill' : 'custom.event.one',
        withinSeconds: '',
        matchConfigText: '',
      },
    ],
  }
}

function defaultActionRule(): ActionRuleEditor {
  return {
    name: 'New action rule',
    triggerKind: 'EVENT',
    triggerKey: 'pz.zombie.kill',
    isEnabled: true,
    moneyAmount: 0,
    xpAmount: 0,
    xpCategory: '',
    xpCategoryAmount: 0,
    configText: '',
  }
}

export function createTelemetryPresetBundle(preset: PresetType, existingKeys: string[]): TelemetryPresetBundle {
  if (preset === 'ordered-objective') {
    const key = createUniqueKey('objective.capture-the-flags', existingKeys)

    return {
      workflow: {
        key,
        name: 'Capture the Flags in Order',
        kind: 'objective',
        isEnabled: true,
        configText: prettyJson({
          title: 'Capture the Flags',
          objectiveType: 'flag',
          visibility: 'public',
          teamScope: 'team',
          summary: 'Claim the alpha flag, then the bravo flag, then score at extraction before the timer expires.',
          markerLabel: 'Alpha > Bravo > Extract',
          locationLabel: 'Riverside route',
          zoneId: 'ctf.riverside.route',
          icon: 'flag',
          accentColor: 'amber',
          badgeId: 'ctf-victory',
        }),
        steps: [
          { stepOrder: 1, eventKey: 'objective.flag.alpha.claimed', withinSeconds: '', matchConfigText: '' },
          { stepOrder: 2, eventKey: 'objective.flag.bravo.claimed', withinSeconds: '180', matchConfigText: '' },
          { stepOrder: 3, eventKey: 'objective.flag.extract.scored', withinSeconds: '120', matchConfigText: '' },
        ],
      },
      actionRule: {
        name: 'Capture the Flags reward',
        triggerKind: 'WORKFLOW',
        triggerKey: key,
        isEnabled: true,
        moneyAmount: 2500,
        xpAmount: 0,
        xpCategory: 'objectives',
        xpCategoryAmount: 500,
        configText: prettyJson({
          badge: 'ctf-victory',
          rewardType: 'objective',
        }),
      },
    }
  }

  if (preset === 'achievement-trophy') {
    const key = createUniqueKey('achievement.first-blood', existingKeys)

    return {
      workflow: {
        key,
        name: 'First Blood Trophy',
        kind: 'achievement',
        isEnabled: true,
        configText: prettyJson({
          title: 'First Blood',
          objectiveType: 'trophy',
          summary: 'Earn your first PvP kill on this profile.',
          platform: 'universal',
          trophyTier: 'bronze',
          badgeId: 'first-blood',
          hiddenUntilUnlocked: false,
          icon: 'sword',
          accentColor: 'rose',
        }),
        steps: [
          { stepOrder: 1, eventKey: 'pz.pvp.kill', withinSeconds: '', matchConfigText: '' },
        ],
      },
      actionRule: {
        name: 'First Blood unlock',
        triggerKind: 'WORKFLOW',
        triggerKey: key,
        isEnabled: true,
        moneyAmount: 0,
        xpAmount: 100,
        xpCategory: 'achievements',
        xpCategoryAmount: 250,
        configText: prettyJson({
          badge: 'first-blood',
          unlock: true,
          rewardType: 'achievement',
          platform: 'universal',
          tier: 'bronze',
        }),
      },
    }
  }

  if (preset === 'unlock-pvp-objective') {
    const key = createUniqueKey('objective.unlock-pvp', existingKeys)

    return {
      workflow: {
        key,
        name: 'Unlock PvP Objective',
        kind: 'objective',
        isEnabled: true,
        configText: prettyJson({
          title: 'Unlock PvP',
          objectiveType: 'milestone',
          visibility: 'public',
          teamScope: 'global',
          summary: 'Complete the hidden objective, then enable PvP for the whole profile.',
          markerLabel: 'Unlock PvP',
          locationLabel: 'Hidden objective site',
          zoneId: 'objective.unlock-pvp',
          icon: 'swords',
          accentColor: 'crimson',
          badgeId: 'pvp-unlocked',
          notes: 'Replace the placeholder event key with the item discovery, zone capture, or objective completion event that should flip PvP on.',
        }),
        steps: [
          { stepOrder: 1, eventKey: 'objective.hidden-item.discovered', withinSeconds: '', matchConfigText: '' },
        ],
      },
      actionRule: {
        name: 'Unlock PvP on completion',
        triggerKind: 'WORKFLOW',
        triggerKey: key,
        isEnabled: true,
        moneyAmount: 0,
        xpAmount: 0,
        xpCategory: '',
        xpCategoryAmount: 0,
        configText: prettyJson({
          badge: 'pvp-unlocked',
          rewardType: 'objective',
          serverSettings: {
            PVP: true,
          },
          serverSettingsApplyMode: 'restart-server',
        }),
      },
    }
  }

  const key = createUniqueKey('objective.sequence.challenge', existingKeys)

  return {
    workflow: {
      key,
      name: 'Custom Sequence Challenge',
      kind: 'objective',
      isEnabled: true,
      configText: prettyJson({
        title: 'Custom Sequence Challenge',
        objectiveType: 'checkpoint',
        visibility: 'tracked',
        teamScope: 'solo',
        summary: 'Replace the placeholder event keys with your own objective or mod events.',
        notes: 'Good starting point for custom game modes and objective experiments.',
      }),
      steps: [
        { stepOrder: 1, eventKey: 'custom.sequence.start', withinSeconds: '', matchConfigText: '' },
        { stepOrder: 2, eventKey: 'custom.sequence.middle', withinSeconds: '90', matchConfigText: '' },
        { stepOrder: 3, eventKey: 'custom.sequence.finish', withinSeconds: '60', matchConfigText: '' },
      ],
    },
    actionRule: {
      name: 'Custom sequence reward',
      triggerKind: 'WORKFLOW',
      triggerKey: key,
      isEnabled: true,
      moneyAmount: 1000,
      xpAmount: 0,
      xpCategory: 'objectives',
      xpCategoryAmount: 250,
      configText: prettyJson({
        badge: 'sequence-runner',
        rewardType: 'objective',
      }),
    },
  }
}

export async function useTelemetryStudio(profileId: string) {
  const profile = ref<{ id: string, name: string, servername: string } | null>(null)
  const listeners = ref<TelemetryListenerEditor[]>([])
  const workflows = ref<WorkflowEditor[]>([])
  const actionRules = ref<ActionRuleEditor[]>([])
  const automationStudio = ref<AutomationStudioDocument>(createEmptyAutomationStudioDocument())
  const xpBalances = ref<Array<{ username: string, totalXp: number }>>([])
  const xpCategories = ref<Array<{ category: string, username: string, totalXp: number }>>([])
  const saveError = shallowRef('')
  const saveSuccess = shallowRef('')
  const saving = shallowRef(false)

  const { data, pending, refresh } = await useFetch<TelemetryStudioResponse>(`/api/profiles/${profileId}/telemetry-config`, {
    key: `telemetry-studio-${profileId}`,
  })

  watch(() => data.value, (value) => {
    if (!value?.profile) {
      return
    }

    profile.value = {
      id: value.profile.id,
      name: value.profile.name,
      servername: value.profile.servername,
    }
    automationStudio.value = normalizeAutomationStudioDocument(value.profile.automationStudioConfig)
    listeners.value = value.profile.telemetryListeners.map(listener => ({
      adapterKey: listener.adapterKey,
      name: listener.name,
      eventKey: listener.eventKey ?? '',
      isEnabled: listener.isEnabled,
      configText: prettyJson(listener.config),
    }))
    workflows.value = value.profile.workflows.map(workflow => {
      const config = asRecord(workflow.config)
      return {
        key: workflow.key,
        name: workflow.name,
        kind: normalizeWorkflowKind(config),
        isEnabled: workflow.isEnabled,
        configText: prettyJson(stripKind(config)),
        steps: workflow.steps.map(step => ({
          stepOrder: step.stepOrder,
          eventKey: step.eventKey,
          withinSeconds: step.withinSeconds == null ? '' : String(step.withinSeconds),
          matchConfigText: prettyJson(step.matchConfig),
        })),
      }
    })
    actionRules.value = value.profile.actionRules.map(rule => ({
      name: rule.name,
      triggerKind: rule.triggerKind,
      triggerKey: rule.triggerKey,
      isEnabled: rule.isEnabled,
      moneyAmount: rule.moneyAmount,
      xpAmount: rule.xpAmount,
      xpCategory: rule.xpCategory ?? '',
      xpCategoryAmount: rule.xpCategoryAmount,
      configText: prettyJson(rule.config),
    }))
    xpBalances.value = value.xpBalances.map(entry => ({
      username: entry.player.username,
      totalXp: entry.totalXp,
    }))
    xpCategories.value = value.xpCategories.map(entry => ({
      category: entry.category,
      username: entry.player.username,
      totalXp: entry.totalXp,
    }))
    saveError.value = ''
  }, { immediate: true })

  const objectiveCount = computed(() => workflows.value.filter(workflow => workflow.kind === 'objective').length)
  const achievementCount = computed(() => workflows.value.filter(workflow => workflow.kind === 'achievement').length)
  const automationGraphCount = computed(() => automationStudio.value.graphs.length)
  const topXpPlayers = computed(() => xpBalances.value.slice(0, 5))
  const canSave = computed(() => !pending.value && !saving.value && Boolean(profile.value))

  function addListener() {
    listeners.value = [...listeners.value, defaultListener()]
  }

  function removeListener(index: number) {
    listeners.value = listeners.value.filter((_, currentIndex) => currentIndex !== index)
  }

  function addWorkflow(kind: WorkflowKind = 'workflow') {
    const nextWorkflow = defaultWorkflow(kind)
    nextWorkflow.key = createUniqueKey(nextWorkflow.key, workflows.value.map(workflow => workflow.key))
    workflows.value = [...workflows.value, nextWorkflow]
  }

  function removeWorkflow(index: number) {
    const workflow = workflows.value[index]
    if (!workflow) {
      return
    }

    actionRules.value = actionRules.value.filter(rule => !(rule.triggerKind === 'WORKFLOW' && rule.triggerKey === workflow.key))
    workflows.value = workflows.value.filter((_, currentIndex) => currentIndex !== index)
  }

  function addWorkflowStep(workflowIndex: number) {
    const workflow = workflows.value[workflowIndex]
    if (!workflow) {
      return
    }

    const nextOrder = workflow.steps.length + 1
    workflow.steps.push({
      stepOrder: nextOrder,
      eventKey: workflow.kind === 'objective' ? 'objective.custom.next' : workflow.kind === 'achievement' ? 'pz.custom.event' : `custom.event.${nextOrder}`,
      withinSeconds: '',
      matchConfigText: '',
    })
  }

  function removeWorkflowStep(workflowIndex: number, stepIndex: number) {
    const workflow = workflows.value[workflowIndex]
    if (!workflow) {
      return
    }

    workflow.steps = workflow.steps
      .filter((_, currentIndex) => currentIndex !== stepIndex)
      .map((step, index) => ({
        ...step,
        stepOrder: index + 1,
      }))
  }

  function addActionRule() {
    actionRules.value = [...actionRules.value, defaultActionRule()]
  }

  function removeActionRule(index: number) {
    actionRules.value = actionRules.value.filter((_, currentIndex) => currentIndex !== index)
  }

  function updateWorkflowKey(workflowIndex: number, nextKey: string) {
    const workflow = workflows.value[workflowIndex]
    if (!workflow) {
      return
    }

    const previousKey = workflow.key
    workflow.key = nextKey
    if (!previousKey || previousKey === nextKey) {
      return
    }

    actionRules.value.forEach((rule) => {
      if (rule.triggerKind === 'WORKFLOW' && rule.triggerKey === previousKey) {
        rule.triggerKey = nextKey
      }
    })
  }

  function getWorkflowConfig(workflowIndex: number): Record<string, unknown> {
    const workflow = workflows.value[workflowIndex]
    return workflow ? safeParseJsonText(workflow.configText) : {}
  }

  function setWorkflowConfig(workflowIndex: number, config: Record<string, unknown>) {
    const workflow = workflows.value[workflowIndex]
    if (!workflow) {
      return
    }

    workflow.configText = prettyJson(cleanConfigRecord(config))
  }

  function updateObjectiveDetails(workflowIndex: number, patch: ObjectiveDetailsPatch) {
    const workflow = workflows.value[workflowIndex]
    if (!workflow) {
      return
    }

    const current = getWorkflowConfig(workflowIndex)
    setWorkflowConfig(workflowIndex, {
      ...current,
      objectiveType: patch.objectiveType ?? getString(current, 'objectiveType', defaultObjectiveType(workflow.kind)),
      summary: patch.summary ?? getString(current, 'summary'),
      visibility: patch.visibility ?? getString(current, 'visibility', workflow.kind === 'achievement' ? 'public' : 'tracked'),
      teamScope: patch.teamScope ?? getString(current, 'teamScope', workflow.kind === 'achievement' ? 'solo' : 'team'),
      markerLabel: patch.markerLabel ?? getString(current, 'markerLabel'),
      locationLabel: patch.locationLabel ?? getString(current, 'locationLabel'),
      zoneId: patch.zoneId ?? getString(current, 'zoneId'),
      icon: patch.icon ?? getString(current, 'icon'),
      accentColor: patch.accentColor ?? getString(current, 'accentColor'),
      badgeId: patch.badgeId ?? getString(current, 'badgeId'),
      platform: patch.platform ?? getString(current, 'platform', 'universal'),
      trophyTier: patch.trophyTier ?? getString(current, 'trophyTier', 'bronze'),
      hiddenUntilUnlocked: patch.hiddenUntilUnlocked ?? getBoolean(current, 'hiddenUntilUnlocked', workflow.kind === 'achievement'),
      notes: patch.notes ?? getString(current, 'notes'),
    })
  }

  function findWorkflowRewardRuleIndexes(workflowKey: string): number[] {
    return actionRules.value
      .map((rule, index) => ({ rule, index }))
      .filter(entry => entry.rule.triggerKind === 'WORKFLOW' && entry.rule.triggerKey === workflowKey)
      .map(entry => entry.index)
  }

  function ensureObjectiveRewardRule(workflowIndex: number): number | null {
    const workflow = workflows.value[workflowIndex]
    if (!workflow) {
      return null
    }

    const existingIndexes = findWorkflowRewardRuleIndexes(workflow.key)
    if (existingIndexes.length > 0) {
      return existingIndexes[0] ?? null
    }

    const workflowConfig = getWorkflowConfig(workflowIndex)
    const defaultRewardConfig = cleanConfigRecord({
      badge: getString(workflowConfig, 'badgeId'),
      rewardType: workflow.kind,
      unlock: workflow.kind === 'achievement' ? true : undefined,
      platform: workflow.kind === 'achievement' ? getString(workflowConfig, 'platform', 'universal') : undefined,
      tier: workflow.kind === 'achievement' ? getString(workflowConfig, 'trophyTier', 'bronze') : undefined,
    })

    const nextRule: ActionRuleEditor = {
      name: `${workflow.name} reward`,
      triggerKind: 'WORKFLOW',
      triggerKey: workflow.key,
      isEnabled: true,
      moneyAmount: workflow.kind === 'objective' ? 1000 : 0,
      xpAmount: workflow.kind === 'achievement' ? 100 : 0,
      xpCategory: workflow.kind === 'achievement' ? 'achievements' : 'objectives',
      xpCategoryAmount: workflow.kind === 'achievement' ? 250 : 250,
      configText: prettyJson(defaultRewardConfig),
    }

    actionRules.value = [...actionRules.value, nextRule]
    return actionRules.value.length - 1
  }

  function updateObjectiveRewardDetails(workflowIndex: number, patch: ObjectiveRewardDetailsPatch) {
    const rewardRuleIndex = ensureObjectiveRewardRule(workflowIndex)
    if (rewardRuleIndex == null) {
      return
    }

    const rewardRule = actionRules.value[rewardRuleIndex]
    if (!rewardRule) {
      return
    }

    const current = safeParseJsonText(rewardRule.configText)
    rewardRule.configText = prettyJson(cleanConfigRecord({
      ...current,
      badge: patch.badge ?? getString(current, 'badge'),
      unlock: patch.unlock ?? getBoolean(current, 'unlock', false),
      rewardType: patch.rewardType ?? getString(current, 'rewardType', 'workflow'),
      platform: patch.platform ?? getString(current, 'platform', 'universal'),
      tier: patch.tier ?? getString(current, 'tier', 'bronze'),
    }))
  }

  const objectiveCards = computed<ObjectiveCard[]>(() => {
    return workflows.value.flatMap((workflow, workflowIndex) => {
      if (workflow.kind !== 'objective' && workflow.kind !== 'achievement') {
        return []
      }

      const config = getWorkflowConfig(workflowIndex)
      const rewardRuleIndexes = findWorkflowRewardRuleIndexes(workflow.key)
      const primaryRewardIndex = rewardRuleIndexes[0] ?? null
      const primaryReward = primaryRewardIndex == null ? null : actionRules.value[primaryRewardIndex] ?? null
      const rewardConfig = primaryReward ? safeParseJsonText(primaryReward.configText) : null

      return [{
        workflowIndex,
        workflow,
        details: {
          objectiveType: (getString(config, 'objectiveType', defaultObjectiveType(workflow.kind)) as ObjectiveType),
          summary: getString(config, 'summary'),
          visibility: (getString(config, 'visibility', workflow.kind === 'achievement' ? 'public' : 'tracked') as ObjectiveVisibility),
          teamScope: (getString(config, 'teamScope', workflow.kind === 'achievement' ? 'solo' : 'team') as ObjectiveTeamScope),
          markerLabel: getString(config, 'markerLabel'),
          locationLabel: getString(config, 'locationLabel'),
          zoneId: getString(config, 'zoneId'),
          icon: getString(config, 'icon'),
          accentColor: getString(config, 'accentColor'),
          badgeId: getString(config, 'badgeId'),
          platform: (getString(config, 'platform', 'universal') as AchievementPlatform),
          trophyTier: (getString(config, 'trophyTier', 'bronze') as AchievementTier),
          hiddenUntilUnlocked: getBoolean(config, 'hiddenUntilUnlocked', workflow.kind === 'achievement'),
          notes: getString(config, 'notes'),
        },
        rewardRuleIndex: primaryRewardIndex,
        rewardRule: primaryReward,
        rewardDetails: rewardConfig ? {
          badge: getString(rewardConfig, 'badge'),
          unlock: getBoolean(rewardConfig, 'unlock', workflow.kind === 'achievement'),
          rewardType: getString(rewardConfig, 'rewardType', workflow.kind),
          platform: (getString(rewardConfig, 'platform', 'universal') as AchievementPlatform),
          tier: (getString(rewardConfig, 'tier', 'bronze') as AchievementTier),
        } : null,
        extraRewardCount: Math.max(0, rewardRuleIndexes.length - 1),
      }]
    })
  })

  function applyPreset(preset: PresetType) {
    const presetBundle = createTelemetryPresetBundle(preset, workflows.value.map(workflow => workflow.key))

    workflows.value = [...workflows.value, presetBundle.workflow]
    actionRules.value = [...actionRules.value, presetBundle.actionRule]
  }

  async function save() {
    if (!profile.value) {
      return
    }

    saveError.value = ''
    saveSuccess.value = ''
    saving.value = true

    try {
      const payload = {
        automationStudioConfig: automationStudio.value,
        listeners: listeners.value.map((listener, index) => ({
          adapterKey: listener.adapterKey.trim(),
          name: listener.name.trim(),
          eventKey: listener.eventKey.trim() || null,
          isEnabled: listener.isEnabled,
          config: parseJsonText(listener.configText, `Listener ${index + 1} config`),
        })),
        workflows: workflows.value.map((workflow, workflowIndex) => {
          const parsedConfig = parseJsonText(workflow.configText, `Workflow ${workflow.name || workflowIndex + 1} config`) ?? {}
          return {
            key: workflow.key.trim(),
            name: workflow.name.trim(),
            isEnabled: workflow.isEnabled,
            config: {
              ...parsedConfig,
              kind: workflow.kind,
            },
            steps: workflow.steps
              .slice()
              .sort((left, right) => left.stepOrder - right.stepOrder)
              .map((step, stepIndex) => ({
                stepOrder: stepIndex + 1,
                eventKey: step.eventKey.trim(),
                withinSeconds: step.withinSeconds.trim() ? Number(step.withinSeconds.trim()) : null,
                matchConfig: parseJsonText(step.matchConfigText, `Workflow ${workflow.name || workflowIndex + 1} step ${stepIndex + 1} match config`),
              })),
          }
        }),
        actionRules: actionRules.value.map((rule, index) => ({
          name: rule.name.trim(),
          triggerKind: rule.triggerKind,
          triggerKey: rule.triggerKey.trim(),
          isEnabled: rule.isEnabled,
          moneyAmount: Number(rule.moneyAmount) || 0,
          xpAmount: Number(rule.xpAmount) || 0,
          xpCategory: rule.xpCategory.trim() || null,
          xpCategoryAmount: Number(rule.xpCategoryAmount) || 0,
          config: parseJsonText(rule.configText, `Action rule ${rule.name || index + 1} config`),
        })),
      }

      await $fetch(`/api/profiles/${profile.value.id}/telemetry-config`, {
        method: 'PUT',
        body: payload,
      })
      saveSuccess.value = 'Telemetry configuration saved successfully'
      await refresh()
    }
    catch (error) {
      saveError.value = error instanceof Error
        ? error.message
        : (error as { data?: { message?: string } })?.data?.message || 'Failed to save telemetry configuration'
    }
    finally {
      saving.value = false
    }
  }

  return {
    profile,
    listeners,
    workflows,
    actionRules,
    automationStudio,
    xpBalances,
    xpCategories,
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
  }
}