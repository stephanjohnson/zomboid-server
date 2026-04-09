<script setup lang="ts">
import type { StoreCategorySummary, StoreProductDetail, StoreBundleSummary } from '@/lib/store'
import { toast } from 'vue-sonner'
import { ArrowLeft } from 'lucide-vue-next'

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
  item: { fullType: string, name: string }
  wiki: { summary: string | null, note: string | null, status: string }
  derived: { summary: string, overview: string, featureBullets: string[], specs: CatalogSpecRow[] }
  importPayload: CatalogImportPayload
}

interface MultiImportAnalysis {
  productName: string
  suggestedOptionGroups: Array<{
    name: string
    slug: string
    displayType: 'TEXT' | 'COLOR'
    values: Array<{ label: string, slug: string, colorHex: string, sourceFullTypes: string[] }>
  }>
  suggestedVariants: Array<{
    name: string
    itemCode: string
    gameName: string
    gameCategory: string | null
    weight: number | null
    imageUrl: string | null
    isDefault: boolean
    selections: Record<string, string>
    metadata: Record<string, unknown>
  }>
  related: Array<{ fullType: string, name: string, displayCategory: string | null }>
}

interface MultiImportResponse {
  enrichments: CatalogItemEnrichment[]
  analysis: MultiImportAnalysis
}

interface AdminStoreBootstrap {
  profile: { id: string, name: string, servername: string } | null
  catalog: { source: string, total: number }
  categories: Array<StoreCategorySummary & { sortOrder: number, isActive: boolean }>
  products: Array<StoreProductDetail & { recommendationProductIds: string[] }>
  bundles: StoreBundleSummary[]
  recommendationOptions: Array<{ id: string, name: string, slug: string }>
  variantOptions: Array<{ id: string, productId: string, productName: string, productSlug: string, variantName: string, itemCode: string, price: number, stock: number | null, label: string }>
}

const router = useRouter()
const route = useRoute()

const bootstrapDefault: AdminStoreBootstrap = {
  profile: null,
  catalog: { source: 'telemetry', total: 0 },
  categories: [],
  products: [],
  bundles: [],
  recommendationOptions: [],
  variantOptions: [],
}

const { data: bootstrap } = await useFetch<AdminStoreBootstrap>(
  '/api/store/admin/bootstrap',
  { default: () => bootstrapDefault },
)

const loading = ref(false)
const error = ref('')

const form = reactive({
  name: '',
  slug: '',
  summary: '',
  description: '',
  overview: '',
  badge: '',
  accentColor: '#b45309',
  featureBulletsText: '',
  specsText: '',
  categoryIds: [] as string[],
  recommendationProductIds: [] as string[],
  isFeatured: false,
  isActive: true,
  sortOrder: 0,
  optionGroups: [] as Array<{
    name: string
    slug: string
    displayType: 'TEXT' | 'COLOR'
    values: Array<{ label: string, slug: string, colorHex: string }>
  }>,
  variants: [
    {
      name: '',
      sku: '',
      itemCode: '',
      gameName: '',
      gameCategory: '',
      price: 0,
      compareAtPrice: undefined as number | undefined,
      quantity: 1,
      stock: undefined as number | undefined,
      weight: undefined as number | undefined,
      badge: '',
      imageUrl: '',
      metadata: null as Record<string, unknown> | null,
      isDefault: true,
      isActive: true,
      selections: {} as Record<string, string>,
    },
  ],
})

function featureBulletsFromText() {
  return form.featureBulletsText.split('\n').map(line => line.trim()).filter(Boolean)
}

function specsFromText() {
  return form.specsText
    .split('\n')
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.includes(':')) return null
      const [left = '', ...valueParts] = trimmed.split(':')
      const value = valueParts.join(':').trim()
      const parts = left.includes('|') ? left.split('|').map(part => part.trim()) : ['General', left.trim()]
      const group = parts[0] || 'General'
      const label = parts[1] || left.trim()
      if (!label || !value) return null
      return { group, label, value }
    })
    .filter((row): row is { group: string, label: string, value: string } => Boolean(row))
}

function formatSpecsText(rows: CatalogSpecRow[]) {
  return rows.map(row => `${row.group} | ${row.label}: ${row.value}`).join('\n')
}

// Catalog import pre-fill
const importRelated = ref<MultiImportAnalysis['related']>([])

async function applyImportFromQuery() {
  // Multi-import: ?importFullTypes=Base.Item1,Base.Item2
  const importFullTypes = route.query.importFullTypes as string | undefined
  if (importFullTypes) {
    const fullTypes = importFullTypes.split(',').map(s => s.trim()).filter(Boolean)
    if (fullTypes.length > 0) {
      await applyMultiImport(fullTypes)
      return
    }
  }

  // Single import: ?importFullType=Base.SomeItem
  const fullType = route.query.importFullType as string | undefined
  if (!fullType) return

  try {
    const response = await $fetch<{ enrichment: CatalogItemEnrichment }>('/api/store/admin/catalog/item', {
      query: { fullType },
    })
    const payload = response.enrichment.importPayload

    if (!form.name.trim()) form.name = payload.product.name
    if (!form.summary.trim()) form.summary = payload.product.summary
    if (!form.description.trim()) form.description = payload.product.description
    if (!form.overview.trim()) form.overview = payload.product.overview
    if (!form.featureBulletsText.trim() && payload.product.featureBullets.length) {
      form.featureBulletsText = payload.product.featureBullets.join('\n')
    }
    if (!form.specsText.trim() && payload.product.specs.length) {
      form.specsText = formatSpecsText(payload.product.specs)
    }

    const firstVariant = form.variants[0]
    if (firstVariant && !firstVariant.name && !firstVariant.itemCode) {
      firstVariant.name = payload.variant.name
      firstVariant.itemCode = payload.variant.itemCode
      firstVariant.gameName = payload.variant.gameName
      firstVariant.gameCategory = payload.variant.gameCategory || ''
      firstVariant.weight = payload.variant.weight ?? undefined
      firstVariant.imageUrl = payload.variant.imageUrl || ''
      firstVariant.metadata = payload.variant.metadata
      firstVariant.isDefault = true
    }
  }
  catch {
    error.value = 'Failed to load import data. You can still fill in the form manually.'
  }
}

async function applyMultiImport(fullTypes: string[]) {
  try {
    const response = await $fetch<MultiImportResponse>('/api/store/admin/catalog/items', {
      method: 'POST',
      body: { fullTypes },
    })
    const { enrichments, analysis } = response

    // Apply product name
    if (!form.name.trim()) form.name = analysis.productName

    // Use the first enrichment for product-level copy
    const primaryEnrichment = enrichments[0]
    if (primaryEnrichment) {
      const payload = primaryEnrichment.importPayload
      if (!form.summary.trim()) form.summary = payload.product.summary
      if (!form.description.trim()) form.description = payload.product.description
      if (!form.overview.trim()) form.overview = payload.product.overview
      if (!form.featureBulletsText.trim() && payload.product.featureBullets.length) {
        form.featureBulletsText = payload.product.featureBullets.join('\n')
      }
      if (!form.specsText.trim() && payload.product.specs.length) {
        form.specsText = formatSpecsText(payload.product.specs)
      }
    }

    // Apply suggested option groups
    if (analysis.suggestedOptionGroups.length > 0) {
      form.optionGroups = analysis.suggestedOptionGroups.map(group => ({
        name: group.name,
        slug: group.slug,
        displayType: group.displayType,
        values: group.values.map(v => ({
          label: v.label,
          slug: v.slug,
          colorHex: v.colorHex || '',
        })),
      }))
    }

    // Apply suggested variants
    if (analysis.suggestedVariants.length > 0) {
      form.variants = analysis.suggestedVariants.map(v => ({
        name: v.name,
        sku: '',
        itemCode: v.itemCode,
        gameName: v.gameName,
        gameCategory: v.gameCategory || '',
        price: 0,
        compareAtPrice: undefined as number | undefined,
        quantity: 1,
        stock: undefined as number | undefined,
        weight: v.weight ?? undefined as number | undefined,
        badge: '',
        imageUrl: v.imageUrl || '',
        metadata: v.metadata || null,
        isDefault: v.isDefault,
        isActive: true,
        selections: v.selections,
      }))
    }

    // Store related items for UI display
    importRelated.value = analysis.related.slice(0, 10)
  }
  catch {
    error.value = 'Failed to analyze selected items. You can still fill in the form manually.'
  }
}

onMounted(() => {
  applyImportFromQuery()
})

async function handleSubmit() {
  error.value = ''

  if (!form.name.trim()) {
    error.value = 'Product name is required.'
    return
  }

  if (!form.variants.length || !form.variants.some(v => v.itemCode.trim())) {
    error.value = 'At least one variant with an item code is required.'
    return
  }

  loading.value = true

  try {
    await $fetch('/api/store/admin/products', {
      method: 'POST',
      body: {
        ...form,
        featureBullets: featureBulletsFromText(),
        specs: specsFromText(),
        optionGroups: form.optionGroups.map((group, groupIndex) => ({
          name: group.name,
          slug: group.slug,
          displayType: group.displayType,
          sortOrder: groupIndex,
          values: group.values.map((value, valueIndex) => ({
            label: value.label,
            slug: value.slug,
            colorHex: value.colorHex || undefined,
            sortOrder: valueIndex,
          })),
        })),
        variants: form.variants.map((variant, variantIndex) => ({
          ...variant,
          sortOrder: variantIndex,
        })),
      },
    })

    toast.success('Product created.')
    await router.push('/admin/store')
  }
  catch (e: unknown) {
    error.value = (e as { data?: { message?: string } })?.data?.message || 'Failed to create product.'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <form class="flex flex-col" @submit.prevent="handleSubmit">
    <!-- Sticky header — product identity is always visible -->
    <div class="sticky top-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="flex flex-col gap-4 px-4 py-4 lg:px-6">
        <div class="flex items-center justify-between gap-4">
          <div class="flex min-w-0 items-center gap-3">
            <Button variant="ghost" size="icon" as-child class="shrink-0">
              <NuxtLink to="/admin/store">
                <ArrowLeft class="size-4" />
              </NuxtLink>
            </Button>
            <h1 class="truncate text-lg font-semibold">
              {{ form.name || 'Create product' }}
            </h1>
          </div>
          <Button type="submit" size="sm" :disabled="loading" class="shrink-0">
            {{ loading ? 'Creating…' : 'Create product' }}
          </Button>
        </div>

        <div class="grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <div class="grid gap-1.5">
            <Label for="product-name" class="text-xs text-muted-foreground">Name</Label>
            <Input id="product-name" v-model="form.name" placeholder="Military Kneepads" />
          </div>
          <div class="grid gap-1.5">
            <Label for="product-slug" class="text-xs text-muted-foreground">Slug</Label>
            <Input id="product-slug" v-model="form.slug" placeholder="Auto-generated from name" />
          </div>
          <div class="flex items-end gap-4">
            <label class="flex items-center gap-2 whitespace-nowrap text-sm">
              <Checkbox :checked="form.isActive" @update:checked="form.isActive = $event" />
              Active
            </label>
            <label class="flex items-center gap-2 whitespace-nowrap text-sm">
              <Checkbox :checked="form.isFeatured" @update:checked="form.isFeatured = $event" />
              Featured
            </label>
          </div>
        </div>
      </div>
    </div>

    <!-- Content area -->
    <div class="flex flex-col gap-4 px-4 py-6 lg:px-6">
      <Alert v-if="error" variant="destructive">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <Alert v-if="importRelated.length > 0">
        <AlertDescription>
          <p class="mb-2 font-medium">
            Related items found in the catalog:
          </p>
          <ul class="space-y-1">
            <li
              v-for="item in importRelated"
              :key="item.fullType"
              class="text-xs"
            >
              <code class="rounded bg-muted px-1 py-0.5">{{ item.fullType }}</code>
              <span class="ml-1 text-muted-foreground">{{ item.displayCategory || '' }}</span>
            </li>
          </ul>
          <p class="mt-2 text-xs text-muted-foreground">
            Go back to the catalog import tab to include these in a new selection if needed.
          </p>
        </AlertDescription>
      </Alert>

      <Tabs default-value="details">
        <TabsList>
          <TabsTrigger value="details">
            Details
          </TabsTrigger>
          <TabsTrigger value="merchandising">
            Merchandising
          </TabsTrigger>
          <TabsTrigger value="options">
            Options
          </TabsTrigger>
          <TabsTrigger value="variants">
            Variants
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" class="mt-4">
          <StoreProductFormDetails v-model:form="form" />
        </TabsContent>

        <TabsContent value="merchandising" class="mt-4">
          <StoreProductFormMerchandising
            v-model:form="form"
            :categories="bootstrap.categories"
            :recommendation-options="bootstrap.recommendationOptions"
          />
        </TabsContent>

        <TabsContent value="options" class="mt-4">
          <StoreProductFormOptions v-model:form="form" />
        </TabsContent>

        <TabsContent value="variants" class="mt-4">
          <StoreProductFormVariants v-model:form="form" />
        </TabsContent>
      </Tabs>
    </div>
  </form>
</template>
