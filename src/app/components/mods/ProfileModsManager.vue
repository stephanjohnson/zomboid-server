<script setup lang="ts">
import { toast } from 'vue-sonner'
import {
  ExternalLink,
  Link2,
  Loader2,
  RotateCcw,
  Search,
  Trash2,
  WandSparkles,
} from 'lucide-vue-next'

import ModStatusBadge from '@/components/mods/ModStatusBadge.vue'
import WorkshopThumbnail from '@/components/mods/WorkshopThumbnail.vue'

interface ProfileModRecord {
  id: string
  workshopId: string
  modName: string
  displayName: string | null
  previewUrl: string | null
  order: number
  isEnabled: boolean
}

interface WorkshopItemCandidate {
  workshopId: string
  workshopUrl: string
  title: string
  displayName: string
  previewUrl: string | null
  descriptionSnippet: string | null
  modIds: string[]
  resolvedFrom: 'mod-info' | 'description' | 'unknown'
  tags: string[]
  warnings: string[]
}

interface WorkshopSearchResponse {
  query: string
  total: number
  results: WorkshopItemCandidate[]
}

const props = defineProps<{
  profileId: string
}>()

const { isAdmin } = useAuth()

const { data: mods, refresh, pending: modsPending } = useLazyFetch<ProfileModRecord[]>('/api/mods', {
  query: { profileId: props.profileId },
  default: () => [],
})
const {
  server: runtimeServer,
  statusByWorkshopId,
  pending: runtimeStatusPending,
  refresh: refreshRuntimeStatuses,
} = useProfileModStatuses(props.profileId)

const quickImportInput = ref('')
const searchQuery = ref('')
const searchResults = ref<WorkshopItemCandidate[]>([])
const activeCandidate = ref<WorkshopItemCandidate | null>(null)

const draft = reactive({
  workshopId: '',
  modName: '',
  displayName: '',
})

const resolvePending = ref(false)
const searchPending = ref(false)
const adding = ref(false)
const removingModId = ref('')
const revalidatingAll = ref(false)
const revalidatingModId = ref('')
const resolveError = ref('')
const searchError = ref('')
const formError = ref('')

const installedWorkshopIds = computed(() => {
  return new Set((mods.value ?? []).map(mod => mod.workshopId))
})

const canAddDraft = computed(() => {
  return !adding.value && draft.workshopId.trim().length > 0 && draft.modName.trim().length > 0
})

const hasMods = computed(() => (mods.value?.length ?? 0) > 0)

function runtimeServerBadgeClass(state: string) {
  if (state === 'ready') {
    return 'border-emerald-200 bg-emerald-50 text-emerald-700'
  }

  if (state === 'error') {
    return 'border-red-200 bg-red-50 text-red-700'
  }

  if (state === 'stopped' || state === 'not_created') {
    return 'border-slate-200 bg-slate-50 text-slate-700'
  }

  return 'border-amber-200 bg-amber-50 text-amber-700'
}

function modRuntimeStatus(workshopId: string) {
  return statusByWorkshopId.value.get(workshopId) ?? null
}

function resolvedFromLabel(candidate: WorkshopItemCandidate) {
  if (candidate.resolvedFrom === 'mod-info') {
    return 'Resolved from mod files'
  }

  if (candidate.resolvedFrom === 'description') {
    return 'Resolved from workshop description'
  }

  return 'Needs manual Mod ID(s)'
}

function resetDraft() {
  activeCandidate.value = null
  draft.workshopId = ''
  draft.modName = ''
  draft.displayName = ''
  formError.value = ''
}

function applyCandidate(candidate: WorkshopItemCandidate) {
  activeCandidate.value = candidate
  draft.workshopId = candidate.workshopId
  draft.modName = candidate.modIds.join(';')
  draft.displayName = candidate.displayName
  resolveError.value = ''
  formError.value = ''
}

async function resolveWorkshopInput() {
  const input = quickImportInput.value.trim()
  if (!input) {
    resolveError.value = 'Paste a Steam Workshop URL or workshop ID first.'
    return
  }

  resolvePending.value = true
  resolveError.value = ''

  try {
    const candidate = await $fetch<WorkshopItemCandidate>('/api/mods/workshop/resolve', {
      method: 'POST',
      body: { input },
    })

    applyCandidate(candidate)
  }
  catch (error: unknown) {
    resolveError.value = (error as { data?: { message?: string } })?.data?.message || 'Failed to resolve that workshop item.'
  }
  finally {
    resolvePending.value = false
  }
}

async function searchWorkshop() {
  const query = searchQuery.value.trim()
  if (query.length < 2) {
    searchResults.value = []
    searchError.value = query.length > 0 ? 'Enter at least two characters to search Steam Workshop.' : ''
    return
  }

  searchPending.value = true
  searchError.value = ''

  try {
    const response = await $fetch<WorkshopSearchResponse>('/api/mods/workshop/search', {
      query: { q: query },
    })

    searchResults.value = response.results
    if (!response.results.length) {
      searchError.value = 'No Steam Workshop items matched that search.'
    }
  }
  catch (error: unknown) {
    searchResults.value = []
    searchError.value = (error as { data?: { message?: string } })?.data?.message || 'Failed to search Steam Workshop.'
  }
  finally {
    searchPending.value = false
  }
}

async function addMod() {
  formError.value = ''
  adding.value = true

  try {
    await $fetch('/api/mods', {
      method: 'POST',
      body: {
        profileId: props.profileId,
        workshopId: draft.workshopId,
        modName: draft.modName,
        displayName: draft.displayName || undefined,
      },
    })

    toast.success('Mod added.')
    quickImportInput.value = ''
    resetDraft()
    await refresh()
    await refreshRuntimeStatuses()
  }
  catch (error: unknown) {
    formError.value = (error as { data?: { message?: string } })?.data?.message || 'Failed to add mod.'
    toast.error(formError.value)
  }
  finally {
    adding.value = false
  }
}

async function removeMod(modId: string) {
  if (!confirm('Remove this mod?')) {
    return
  }

  removingModId.value = modId

  try {
    await $fetch(`/api/mods/${modId}`, { method: 'DELETE' })
    toast.success('Mod removed.')
    await refresh()
    await refreshRuntimeStatuses()
  }
  catch {
    toast.error('Failed to remove mod.')
  }
  finally {
    removingModId.value = ''
  }
}

async function revalidateAllMods() {
  if (!hasMods.value) {
    return
  }

  revalidatingAll.value = true

  try {
    const response = await $fetch<{ count: number }>('/api/mods/revalidate', {
      method: 'POST',
      body: { profileId: props.profileId },
    })

    toast.success(
      response.count === 1
        ? 'Mod verification restarted.'
        : `Restarted verification for ${response.count} mods.`,
    )
    await refreshRuntimeStatuses()
  }
  catch {
    toast.error('Failed to restart mod verification.')
  }
  finally {
    revalidatingAll.value = false
  }
}

async function revalidateMod(modId: string) {
  revalidatingModId.value = modId

  try {
    await $fetch(`/api/mods/${modId}/revalidate`, {
      method: 'POST',
    })

    toast.success('Mod verification restarted.')
    await refreshRuntimeStatuses()
  }
  catch {
    toast.error('Failed to restart mod verification.')
  }
  finally {
    revalidatingModId.value = ''
  }
}
</script>

<template>
  <div class="space-y-6">
    <div class="space-y-1">
      <h1 class="text-2xl font-bold">
        Mod Management
      </h1>
      <p class="text-sm text-muted-foreground text-balance">
        Paste a Steam Workshop link or search inside the manager, then review the resolved Mod ID(s) before adding the mod to this profile.
      </p>
    </div>

    <Card v-if="isAdmin">
      <CardHeader>
        <CardTitle>Add Workshop Mod</CardTitle>
        <CardDescription>
          The manager will try to resolve the Project Zomboid Mod ID(s) from the workshop item automatically. If Steam metadata is incomplete, you can still edit the fields before saving.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <div class="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div class="space-y-2">
            <Label for="workshop-import-input">Paste Steam Workshop URL or ID</Label>
            <div class="relative">
              <Link2 class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="workshop-import-input"
                v-model="quickImportInput"
                placeholder="https://steamcommunity.com/sharedfiles/filedetails/?id=2200148440"
                class="pl-9"
                @keydown.enter.prevent="resolveWorkshopInput"
              />
            </div>
            <p class="text-xs text-muted-foreground">
              Works with copied Steam Workshop links or a raw workshop ID.
            </p>
          </div>

          <Button
            class="self-end"
            :disabled="resolvePending || !quickImportInput.trim().length"
            @click="resolveWorkshopInput"
          >
            <Loader2 v-if="resolvePending" class="size-4 animate-spin" />
            <WandSparkles v-else class="size-4" />
            Resolve
          </Button>
        </div>

        <Alert v-if="resolveError" variant="destructive">
          <AlertDescription>{{ resolveError }}</AlertDescription>
        </Alert>

        <Separator />

        <div class="space-y-3">
          <div class="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div class="space-y-2 md:flex-1">
              <Label for="workshop-search-input">Search Steam Workshop</Label>
              <div class="relative">
                <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="workshop-search-input"
                  v-model="searchQuery"
                  placeholder="Search by workshop title"
                  class="pl-9"
                  @keydown.enter.prevent="searchWorkshop"
                />
              </div>
            </div>

            <Button
              variant="outline"
              :disabled="searchPending || searchQuery.trim().length < 2"
              @click="searchWorkshop"
            >
              <Loader2 v-if="searchPending" class="size-4 animate-spin" />
              <Search v-else class="size-4" />
              Search
            </Button>
          </div>

          <p v-if="searchError" class="text-sm text-destructive">
            {{ searchError }}
          </p>

          <div v-if="searchResults.length" class="space-y-3">
            <div
              v-for="candidate in searchResults"
              :key="candidate.workshopId"
              class="rounded-xl border border-border/70 bg-card/70 p-4"
            >
              <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div class="flex min-w-0 gap-4">
                  <WorkshopThumbnail
                    :src="candidate.previewUrl"
                    :alt="candidate.title"
                    size-class="size-20 shrink-0"
                  />

                  <div class="min-w-0 space-y-3">
                    <div class="flex flex-wrap items-center gap-2">
                      <p class="text-sm font-semibold text-foreground">
                        {{ candidate.title }}
                      </p>
                      <Badge variant="secondary">
                        {{ resolvedFromLabel(candidate) }}
                      </Badge>
                      <Badge v-if="installedWorkshopIds.has(candidate.workshopId)" variant="outline">
                        Already added
                      </Badge>
                    </div>

                    <p class="text-xs text-muted-foreground">
                      Workshop ID: {{ candidate.workshopId }}
                    </p>

                    <p v-if="candidate.modIds.length" class="text-xs text-muted-foreground">
                      Mod ID(s): {{ candidate.modIds.join('; ') }}
                    </p>
                    <p v-else class="text-xs text-amber-600">
                      Mod ID(s) could not be resolved automatically.
                    </p>

                    <div v-if="candidate.tags.length" class="flex flex-wrap gap-2">
                      <Badge v-for="tag in candidate.tags.slice(0, 4)" :key="tag" variant="outline" class="text-xs">
                        {{ tag }}
                      </Badge>
                    </div>

                    <p v-if="candidate.descriptionSnippet" class="text-xs text-muted-foreground text-balance">
                      {{ candidate.descriptionSnippet }}
                    </p>
                  </div>
                </div>

                <div class="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
                  <Button
                    size="sm"
                    :disabled="installedWorkshopIds.has(candidate.workshopId)"
                    @click="applyCandidate(candidate)"
                  >
                    {{ installedWorkshopIds.has(candidate.workshopId) ? 'Added' : 'Use Result' }}
                  </Button>
                  <Button variant="outline" size="sm" as-child>
                    <a :href="candidate.workshopUrl" target="_blank" rel="noreferrer">
                      <ExternalLink class="size-4" />
                      Open Steam
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Separator />

        <div class="space-y-4 rounded-xl border border-dashed border-border/70 bg-muted/20 p-4 md:p-5">
          <div class="space-y-1">
            <h2 class="text-sm font-semibold">
              Mod Details
            </h2>
            <p class="text-xs text-muted-foreground">
              Use semicolons if a workshop item exposes multiple Project Zomboid Mod ID(s).
            </p>
          </div>

          <Card v-if="activeCandidate" class="border-border/60 bg-card/70 shadow-none">
            <CardContent class="flex flex-col gap-3 p-4">
              <div class="flex items-start gap-4">
                <WorkshopThumbnail
                  :src="activeCandidate.previewUrl"
                  :alt="activeCandidate.title"
                  size-class="size-16 shrink-0"
                />

                <div class="space-y-2">
                  <div class="flex flex-wrap items-center gap-2">
                    <p class="text-sm font-semibold text-foreground">
                      {{ activeCandidate.title }}
                    </p>
                    <Badge variant="secondary">
                      {{ resolvedFromLabel(activeCandidate) }}
                    </Badge>
                  </div>
                  <p class="text-xs text-muted-foreground">
                    Workshop ID: {{ activeCandidate.workshopId }}
                  </p>
                  <p v-if="activeCandidate.modIds.length" class="text-xs text-muted-foreground">
                    Resolved Mod ID(s): {{ activeCandidate.modIds.join('; ') }}
                  </p>
                  <p v-for="warning in activeCandidate.warnings" :key="warning" class="text-xs text-amber-600">
                    {{ warning }}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div class="grid gap-4 md:grid-cols-2">
            <div class="grid gap-2 md:col-span-2">
              <Label for="mod-workshop-id">Workshop URL or ID</Label>
              <Input
                id="mod-workshop-id"
                v-model="draft.workshopId"
                placeholder="Paste a workshop URL or enter a workshop ID"
              />
            </div>

            <div class="grid gap-2">
              <Label for="mod-id-list">Mod ID(s)</Label>
              <Input
                id="mod-id-list"
                v-model="draft.modName"
                placeholder="Brita;Arsenal26GunFighter"
              />
            </div>

            <div class="grid gap-2">
              <Label for="mod-display-name">Display Name</Label>
              <Input
                id="mod-display-name"
                v-model="draft.displayName"
                placeholder="Brita's Weapon Pack"
              />
            </div>
          </div>

          <Alert v-if="formError" variant="destructive">
            <AlertDescription>{{ formError }}</AlertDescription>
          </Alert>

          <div class="flex flex-col gap-2 sm:flex-row">
            <Button :disabled="!canAddDraft" @click="addMod">
              <Loader2 v-if="adding" class="size-4 animate-spin" />
              <span>{{ adding ? 'Adding…' : 'Add Mod' }}</span>
            </Button>
            <Button variant="outline" :disabled="adding" @click="resetDraft">
              Clear
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Installed Mods</CardTitle>
        <CardDescription>
          Workshop entries saved for this server profile. Runtime checks refresh every 5 seconds using server logs and installed Workshop files.
        </CardDescription>
        <div class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div class="flex flex-wrap items-center gap-2">
            <Badge variant="outline" :class="runtimeServerBadgeClass(runtimeServer.state)">
              {{ runtimeServer.label }}
            </Badge>
            <p class="text-xs text-muted-foreground">
              {{ runtimeServer.detail || 'The server must be online before a mod can be marked OK for this boot.' }}
            </p>
          </div>
          <Button
            v-if="isAdmin"
            variant="outline"
            size="sm"
            :disabled="revalidatingAll || !hasMods"
            @click="revalidateAllMods"
          >
            <Loader2 v-if="revalidatingAll" class="size-4 animate-spin" />
            <RotateCcw v-else class="size-4" />
            Revalidate All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div v-if="modsPending" class="space-y-3">
          <div v-for="index in 3" :key="index" class="rounded-lg border p-4">
            <Skeleton class="h-5 w-40" />
            <Skeleton class="mt-2 h-4 w-64" />
          </div>
        </div>

        <div v-else-if="mods?.length" class="space-y-3">
          <div
            v-for="mod in mods"
            :key="mod.id"
            class="flex flex-col gap-4 rounded-xl border border-border/70 bg-card/70 p-4 md:flex-row md:items-start md:justify-between"
          >
            <div class="flex min-w-0 items-start gap-4">
              <WorkshopThumbnail
                :src="mod.previewUrl"
                :alt="mod.displayName || mod.modName"
                size-class="size-16 shrink-0"
              />

              <div class="space-y-2">
                <div class="flex flex-wrap items-center gap-2">
                  <p class="font-semibold text-foreground">
                    {{ mod.displayName || mod.modName }}
                  </p>
                  <Badge variant="outline">
                    #{{ mod.order + 1 }}
                  </Badge>
                </div>
                <p class="text-sm text-muted-foreground">
                  Workshop ID: {{ mod.workshopId }}
                </p>
                <p class="text-xs text-muted-foreground">
                  Mod ID(s): {{ mod.modName }}
                </p>
                <ModStatusBadge :status="modRuntimeStatus(mod.workshopId)" :loading="runtimeStatusPending" />
              </div>
            </div>

            <div v-if="isAdmin" class="flex shrink-0 flex-col gap-2 sm:flex-row md:flex-col">
              <Button
                variant="outline"
                size="sm"
                :disabled="revalidatingAll || revalidatingModId === mod.id || removingModId === mod.id"
                @click="revalidateMod(mod.id)"
              >
                <Loader2 v-if="revalidatingModId === mod.id" class="size-4 animate-spin" />
                <RotateCcw v-else class="size-4" />
                Revalidate
              </Button>
              <Button
                variant="destructive"
                size="sm"
                :disabled="revalidatingAll || revalidatingModId === mod.id || removingModId === mod.id"
                @click="removeMod(mod.id)"
              >
                <Loader2 v-if="removingModId === mod.id" class="size-4 animate-spin" />
                <Trash2 v-else class="size-4" />
                Remove
              </Button>
            </div>
          </div>
        </div>

        <p v-else class="py-8 text-center text-sm text-muted-foreground">
          No mods added yet.
        </p>
      </CardContent>
    </Card>
  </div>
</template>