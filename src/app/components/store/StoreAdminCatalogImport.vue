<script setup lang="ts">
import type { StoreCategorySummary, StoreProductDetail, StoreBundleSummary } from '@/lib/store'
import { Search } from 'lucide-vue-next'

interface CatalogSearchResult {
  fullType: string
  name: string
  category: string | null
  displayCategory?: string | null
  iconName: string | null
  textureIcon?: string | null
  iconUrl?: string | null
  source: 'lua_bridge' | 'scripts' | 'telemetry'
  weight?: number | null
  isTwoHandWeapon?: boolean | null
  maxCondition?: number | null
}

interface CatalogSpecRow {
  group: string
  label: string
  value: string
}

interface CatalogImportPayload {
  product: {
    name: string
    summary: string
    description: string
    overview: string
    featureBullets: string[]
    specs: CatalogSpecRow[]
  }
  variant: {
    name: string
    itemCode: string
    gameName: string
    gameCategory: string | null
    weight: number | null
    imageUrl: string | null
    metadata: Record<string, unknown>
  }
}

interface CatalogItemEnrichment {
  item: CatalogSearchResult & {
    attachmentType?: string | null
    attachmentSlots?: string[]
    tags?: string[]
    categories?: string[]
  }
  wiki: {
    pageTitle: string | null
    pageUrl: string | null
    imageUrl: string | null
    summary: string | null
    status: 'fetched' | 'blocked' | 'derived' | 'unavailable'
    note: string | null
  }
  derived: {
    summary: string
    overview: string
    featureBullets: string[]
    specs: CatalogSpecRow[]
  }
  importPayload: CatalogImportPayload
}

const props = defineProps<{
  bootstrap: {
    profile: { id: string, name: string, servername: string } | null
    catalog: { source: string, total: number }
    categories: Array<StoreCategorySummary & { sortOrder: number, isActive: boolean }>
    products: Array<StoreProductDetail & { recommendationProductIds: string[] }>
    bundles: StoreBundleSummary[]
  }
}>()

const catalogQuery = ref('')
const catalogSearchError = ref('')
const catalogImportNotice = ref('')
const catalogImportError = ref('')
const catalogImportingFullType = ref('')
const lastCatalogImport = ref<CatalogItemEnrichment | null>(null)
const selectedFullTypes = ref<string[]>([])
const multiImporting = ref(false)
let catalogSearchTimer: ReturnType<typeof setTimeout> | null = null

const catalogDefault = {
  source: 'telemetry',
  total: 0,
  items: [] as CatalogSearchResult[],
}

const { data: catalogSearch, refresh: refreshCatalogSearch, pending: catalogPending, error: catalogSearchRequestError } = await useFetch<{
  source: string
  total: number
  items: CatalogSearchResult[]
}>(
  '/api/store/admin/catalog',
  {
    query: computed(() => ({
      profileId: props.bootstrap.profile?.id,
      q: catalogQuery.value.trim(),
      limit: 20,
    })),
    default: () => catalogDefault,
    immediate: false,
  },
)

const hasCatalogSearchRun = ref(false)

function clearCatalogSearchTimer() {
  if (!catalogSearchTimer) return
  clearTimeout(catalogSearchTimer)
  catalogSearchTimer = null
}

function queueCatalogSearch(delay = 180) {
  clearCatalogSearchTimer()
  catalogSearchTimer = setTimeout(() => {
    void searchCatalog()
  }, delay)
}

async function searchCatalog() {
  clearCatalogSearchTimer()
  hasCatalogSearchRun.value = true
  catalogSearchError.value = ''

  try {
    await refreshCatalogSearch()
  }
  catch (error) {
    catalogSearchError.value = error instanceof Error
      ? error.message
      : 'Failed to search the game catalog.'
    catalogSearch.value = { ...catalogDefault, items: [] }
    return
  }

  if (catalogSearchRequestError.value) {
    catalogSearchError.value = catalogSearchRequestError.value.message || 'Failed to search the game catalog.'
    catalogSearch.value = { ...catalogDefault, items: [] }
  }
}

watch(() => catalogQuery.value.trim(), (query, previousQuery) => {
  if (query === previousQuery) return
  queueCatalogSearch(query.length > 0 ? 180 : 0)
})

onMounted(() => {
  if (!hasCatalogSearchRun.value) {
    queueCatalogSearch(0)
  }
})

onBeforeUnmount(() => {
  clearCatalogSearchTimer()
})

async function importCatalogItem(fullType: string) {
  catalogImportingFullType.value = fullType
  catalogImportError.value = ''

  try {
    const response = await $fetch<{ enrichment: CatalogItemEnrichment }>('/api/store/admin/catalog/item', {
      query: { fullType },
    })

    lastCatalogImport.value = response.enrichment
    catalogImportNotice.value = `Imported ${response.enrichment.item.name}. Redirecting to product builder…`

    const params = new URLSearchParams()
    params.set('importFullType', fullType)
    await navigateTo(`/admin/store/products/new?${params.toString()}`)
  }
  catch (error) {
    catalogImportError.value = error instanceof Error
      ? error.message
      : 'Failed to import item details from the catalog.'
  }
  finally {
    catalogImportingFullType.value = ''
  }
}

function toggleSelection(fullType: string) {
  const idx = selectedFullTypes.value.indexOf(fullType)
  if (idx >= 0) {
    selectedFullTypes.value.splice(idx, 1)
  }
  else {
    selectedFullTypes.value.push(fullType)
  }
}

function toggleSelectAll() {
  const items = catalogSearch.value.items
  const allSelected = items.length > 0 && items.every(i => selectedFullTypes.value.includes(i.fullType))
  if (allSelected) {
    selectedFullTypes.value = selectedFullTypes.value.filter(
      ft => !items.some(i => i.fullType === ft),
    )
  }
  else {
    const existing = new Set(selectedFullTypes.value)
    for (const item of items) {
      if (!existing.has(item.fullType)) {
        selectedFullTypes.value.push(item.fullType)
      }
    }
  }
}

const allVisibleSelected = computed(() => {
  const items = catalogSearch.value.items
  return items.length > 0 && items.every(i => selectedFullTypes.value.includes(i.fullType))
})

async function importSelectedItems() {
  if (selectedFullTypes.value.length === 0) return

  if (selectedFullTypes.value.length === 1) {
    const fullType = selectedFullTypes.value[0]!
    await importCatalogItem(fullType)
    return
  }

  multiImporting.value = true
  catalogImportError.value = ''

  try {
    const fullTypes = selectedFullTypes.value.join(',')
    await navigateTo(`/admin/store/products/new?importFullTypes=${encodeURIComponent(fullTypes)}`)
  }
  catch (e) {
    catalogImportError.value = e instanceof Error
      ? e.message
      : 'Failed to create product from selected items.'
  }
  finally {
    multiImporting.value = false
  }
}
</script>

<template>
  <div class="space-y-4">
    <Card>
      <CardHeader>
        <CardTitle class="text-base font-medium">
          Game Item Catalog
        </CardTitle>
        <CardDescription>
          Search the Project Zomboid item catalog and import items directly into a new product.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <Alert v-if="catalogImportError" variant="destructive">
          <AlertDescription>{{ catalogImportError }}</AlertDescription>
        </Alert>
        <Alert v-else-if="catalogImportNotice">
          <AlertDescription>{{ catalogImportNotice }}</AlertDescription>
        </Alert>

        <div class="grid gap-2">
          <Label for="catalog-search">Search items</Label>
          <div class="relative">
            <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="catalog-search"
              v-model="catalogQuery"
              placeholder="Search by item code or display name…"
              class="pl-9"
            />
          </div>
          <p class="text-xs text-muted-foreground">
            Results update as you type. Select an item to import its details into a new product.
          </p>
        </div>

        <Card>
          <CardContent class="p-0">
            <div class="flex items-center justify-between border-b px-4 py-3">
              <div class="flex items-center gap-3">
                <Checkbox
                  v-if="catalogSearch.items.length"
                  :checked="allVisibleSelected"
                  aria-label="Select all visible items"
                  @update:checked="toggleSelectAll()"
                />
                <p class="text-sm text-muted-foreground">
                  <span v-if="catalogPending">Searching…</span>
                  <span v-else-if="catalogSearchError">{{ catalogSearchError }}</span>
                  <span v-else>{{ catalogSearch.total }} matches from {{ catalogSearch.source }}</span>
                </p>
              </div>
              <div class="flex items-center gap-2">
                <Button
                  v-if="selectedFullTypes.length > 0"
                  size="sm"
                  :disabled="multiImporting"
                  @click="importSelectedItems"
                >
                  {{ multiImporting ? 'Creating…' : `Create product (${selectedFullTypes.length})` }}
                </Button>
                <Badge variant="outline" class="text-xs">
                  {{ bootstrap.catalog.total }} total items
                </Badge>
              </div>
            </div>

            <div v-if="catalogPending" class="flex flex-col items-center justify-center py-12 text-center">
              <p class="text-sm text-muted-foreground">
                Searching catalog…
              </p>
            </div>

            <div v-else-if="catalogSearchError" class="flex flex-col items-center justify-center py-12 text-center">
              <p class="text-sm text-destructive">
                {{ catalogSearchError }}
              </p>
            </div>

            <ul v-else-if="catalogSearch.items.length" role="list" class="divide-y divide-border">
              <li
                v-for="item in catalogSearch.items"
                :key="item.fullType"
                class="flex cursor-pointer items-center justify-between gap-x-4 px-4 py-4 transition-colors hover:bg-muted/50 lg:px-6"
                @click="toggleSelection(item.fullType)"
              >
                <div class="flex min-w-0 items-center gap-x-4">
                  <Checkbox
                    :checked="selectedFullTypes.includes(item.fullType)"
                    :aria-label="`Select ${item.name}`"
                    @click.stop
                    @update:checked="toggleSelection(item.fullType)"
                  />
                  <div class="flex size-10 flex-none items-center justify-center overflow-hidden rounded-lg border bg-muted">
                    <img
                      v-if="item.iconUrl"
                      :src="item.iconUrl"
                      :alt="item.name"
                      class="size-full object-contain"
                    >
                    <span v-else class="text-xs text-muted-foreground">—</span>
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm font-semibold">
                      {{ item.name }}
                    </p>
                    <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <code class="rounded bg-muted px-1.5 py-0.5 text-xs">{{ item.fullType }}</code>
                      <span class="text-xs text-muted-foreground">{{ item.displayCategory || item.category || 'Unknown' }}</span>
                      <span v-if="typeof item.weight === 'number'" class="text-xs text-muted-foreground">{{ item.weight }} enc.</span>
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  :disabled="catalogImportingFullType === item.fullType"
                  @click.stop="importCatalogItem(item.fullType)"
                >
                  {{ catalogImportingFullType === item.fullType ? 'Importing…' : 'Import' }}
                </Button>
              </li>
            </ul>

            <div v-else class="flex flex-col items-center justify-center py-12 text-center">
              <p class="text-sm text-muted-foreground">
                No items matched that search.
              </p>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  </div>
</template>
