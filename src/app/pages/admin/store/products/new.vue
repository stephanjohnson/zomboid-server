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

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function groupKey(group: { name: string, slug?: string }, index: number) {
  return slugify(group.slug || group.name) || `group-${index + 1}`
}

function optionValueKey(value: { label: string, slug?: string }, index: number) {
  return slugify(value.slug || value.label) || `value-${index + 1}`
}

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

function toggleSelection(collection: string[], id: string) {
  return collection.includes(id)
    ? collection.filter(value => value !== id)
    : [...collection, id]
}

// Option group management
function addOptionGroup() {
  form.optionGroups.push({
    name: '',
    slug: '',
    displayType: 'TEXT',
    values: [{ label: '', slug: '', colorHex: '' }],
  })
}

function removeOptionGroup(index: number) {
  form.optionGroups.splice(index, 1)
}

function addOptionValue(groupIndex: number) {
  form.optionGroups[groupIndex]?.values.push({ label: '', slug: '', colorHex: '' })
}

function removeOptionValue(groupIndex: number, valueIndex: number) {
  const group = form.optionGroups[groupIndex]
  if (group && group.values.length > 1) {
    group.values.splice(valueIndex, 1)
  }
}

// Variant management
function addVariant() {
  const firstGroup = form.optionGroups[0]
  const firstGroupSlug = firstGroup ? groupKey(firstGroup, 0) : ''
  const firstValue = firstGroup?.values[0]

  form.variants.push({
    name: '',
    sku: '',
    itemCode: '',
    gameName: '',
    gameCategory: '',
    price: 0,
    compareAtPrice: undefined,
    quantity: 1,
    stock: undefined,
    weight: undefined,
    badge: '',
    imageUrl: '',
    metadata: null,
    isDefault: false,
    isActive: true,
    selections: firstGroupSlug && firstValue ? { [firstGroupSlug]: optionValueKey(firstValue, 0) } : {},
  })
}

function removeVariant(index: number) {
  if (form.variants.length > 1) {
    form.variants.splice(index, 1)
  }
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
  <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
    <div class="flex items-center gap-4 px-4 lg:px-6">
      <Button variant="ghost" size="sm" as-child>
        <NuxtLink to="/admin/store">
          <ArrowLeft class="size-4" />
          Back
        </NuxtLink>
      </Button>
    </div>

    <form class="flex flex-col gap-6 px-4 lg:px-6" @submit.prevent="handleSubmit">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-bold">
          Create product
        </h1>
        <p class="text-sm text-muted-foreground text-balance">
          Define the product details, configure variants, and set merchandising options.
        </p>
      </div>

      <!-- Product Details Section -->
      <section class="grid gap-6 rounded-xl border border-border/70 bg-card/80 p-6 shadow-xs md:p-7">
        <div class="space-y-1">
          <h2 class="text-base font-semibold">
            Product details
          </h2>
          <p class="text-sm text-muted-foreground">
            Name, description, and marketing copy for the storefront listing.
          </p>
        </div>

        <div class="grid gap-5 md:grid-cols-2">
          <div class="grid gap-2">
            <Label for="product-name">Product name</Label>
            <Input
              id="product-name"
              v-model="form.name"
              required
              placeholder="Military Kneepads"
            />
            <p class="text-xs text-muted-foreground">
              Shown on the storefront and in search results.
            </p>
          </div>

          <div class="grid gap-2">
            <Label for="product-slug">Slug</Label>
            <Input
              id="product-slug"
              v-model="form.slug"
              placeholder="Auto-generated from name"
            />
            <p class="text-xs text-muted-foreground">
              URL-safe identifier. Leave blank to generate automatically.
            </p>
          </div>

          <div class="grid gap-2 md:col-span-2">
            <Label for="product-summary">Summary</Label>
            <Textarea
              id="product-summary"
              v-model="form.summary"
              :rows="2"
              placeholder="Short product summary for card previews"
            />
          </div>

          <div class="grid gap-2 md:col-span-2">
            <Label for="product-description">Description</Label>
            <Textarea
              id="product-description"
              v-model="form.description"
              :rows="3"
              placeholder="Full product description"
            />
          </div>

          <div class="grid gap-2 md:col-span-2">
            <Label for="product-overview">Overview</Label>
            <Textarea
              id="product-overview"
              v-model="form.overview"
              :rows="4"
              placeholder="Detailed overview for the product detail page"
            />
          </div>

          <div class="grid gap-2">
            <Label for="product-bullets">Feature bullets</Label>
            <Textarea
              id="product-bullets"
              v-model="form.featureBulletsText"
              :rows="5"
              placeholder="One feature per line"
            />
            <p class="text-xs text-muted-foreground">
              Each line becomes a bullet point on the product page.
            </p>
          </div>

          <div class="grid gap-2">
            <Label for="product-specs">Specs</Label>
            <Textarea
              id="product-specs"
              v-model="form.specsText"
              :rows="5"
              placeholder="Group | Label: Value"
            />
            <p class="text-xs text-muted-foreground">
              Format: Group | Label: Value. One spec per line.
            </p>
          </div>
        </div>
      </section>

      <!-- Merchandising Section -->
      <section class="grid gap-6 rounded-xl border border-border/70 bg-card/80 p-6 shadow-xs md:p-7">
        <div class="space-y-1">
          <h2 class="text-base font-semibold">
            Merchandising
          </h2>
          <p class="text-sm text-muted-foreground">
            Control how the product appears in the storefront catalog.
          </p>
        </div>

        <div class="grid gap-5 md:grid-cols-2">
          <div class="grid gap-2">
            <Label for="product-badge">Badge</Label>
            <Input
              id="product-badge"
              v-model="form.badge"
              placeholder="New, Hot, Limited"
            />
            <p class="text-xs text-muted-foreground">
              Optional label shown on the product card.
            </p>
          </div>

          <div class="grid gap-2">
            <Label for="product-accent">Accent color</Label>
            <Input
              id="product-accent"
              v-model="form.accentColor"
              placeholder="#b45309"
            />
          </div>

          <div class="grid gap-2">
            <Label for="product-sort">Sort order</Label>
            <Input
              id="product-sort"
              v-model.number="form.sortOrder"
              type="number"
              min="0"
            />
            <p class="text-xs text-muted-foreground">
              Lower values appear first in the catalog.
            </p>
          </div>
        </div>

        <FieldSet>
          <FieldLegend>Visibility</FieldLegend>
          <FieldLabel for="product-featured">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Featured product</FieldTitle>
                <FieldDescription>
                  Show this product in the featured section on the storefront.
                </FieldDescription>
              </FieldContent>
              <Checkbox
                id="product-featured"
                :checked="form.isFeatured"
                @update:checked="form.isFeatured = $event"
              />
            </Field>
          </FieldLabel>
          <FieldLabel for="product-active">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Active in store</FieldTitle>
                <FieldDescription>
                  Only active products appear in the customer-facing storefront.
                </FieldDescription>
              </FieldContent>
              <Checkbox
                id="product-active"
                :checked="form.isActive"
                @update:checked="form.isActive = $event"
              />
            </Field>
          </FieldLabel>
        </FieldSet>

        <div class="grid gap-5 md:grid-cols-2">
          <div class="grid gap-2">
            <Label>Categories</Label>
            <div class="grid max-h-48 gap-1 overflow-y-auto rounded-lg border p-3">
              <FieldLabel
                v-for="category in bootstrap.categories"
                :key="category.id"
                :for="`cat-${category.id}`"
              >
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle class="text-sm font-normal">{{ category.name }}</FieldTitle>
                  </FieldContent>
                  <Checkbox
                    :id="`cat-${category.id}`"
                    :checked="form.categoryIds.includes(category.id)"
                    @update:checked="form.categoryIds = toggleSelection(form.categoryIds, category.id)"
                  />
                </Field>
              </FieldLabel>
              <p v-if="!bootstrap.categories.length" class="py-2 text-center text-xs text-muted-foreground">
                No categories yet. Create one first.
              </p>
            </div>
          </div>

          <div class="grid gap-2">
            <Label>Recommended add-ons</Label>
            <div class="grid max-h-48 gap-1 overflow-y-auto rounded-lg border p-3">
              <FieldLabel
                v-for="rec in bootstrap.recommendationOptions"
                :key="rec.id"
                :for="`rec-${rec.id}`"
              >
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle class="text-sm font-normal">{{ rec.name }}</FieldTitle>
                  </FieldContent>
                  <Checkbox
                    :id="`rec-${rec.id}`"
                    :checked="form.recommendationProductIds.includes(rec.id)"
                    @update:checked="form.recommendationProductIds = toggleSelection(form.recommendationProductIds, rec.id)"
                  />
                </Field>
              </FieldLabel>
              <p v-if="!bootstrap.recommendationOptions.length" class="py-2 text-center text-xs text-muted-foreground">
                No other products to recommend yet.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Option Groups Section -->
      <section class="grid gap-6 rounded-xl border border-border/70 bg-card/80 p-6 shadow-xs md:p-7">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1">
            <h2 class="text-base font-semibold">
              Option groups
            </h2>
            <p class="text-sm text-muted-foreground">
              Define variant axes like side, color, or finish. Skip this if the product has only one variant.
            </p>
          </div>
          <Button variant="outline" size="sm" type="button" @click="addOptionGroup">
            Add group
          </Button>
        </div>

        <div v-if="form.optionGroups.length" class="grid gap-4">
          <Card
            v-for="(group, groupIndex) in form.optionGroups"
            :key="`group-${groupIndex}`"
          >
            <CardHeader class="pb-4">
              <div class="flex items-center justify-between gap-3">
                <CardTitle class="text-sm font-medium">
                  Option group {{ groupIndex + 1 }}
                </CardTitle>
                <Button variant="ghost" size="sm" type="button" @click="removeOptionGroup(groupIndex)">
                  Remove
                </Button>
              </div>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="grid gap-4 md:grid-cols-3">
                <div class="grid gap-2">
                  <Label :for="`group-name-${groupIndex}`">Name</Label>
                  <Input :id="`group-name-${groupIndex}`" v-model="group.name" placeholder="Side" />
                </div>
                <div class="grid gap-2">
                  <Label :for="`group-slug-${groupIndex}`">Slug</Label>
                  <Input :id="`group-slug-${groupIndex}`" v-model="group.slug" placeholder="Auto-generated" />
                </div>
                <div class="grid gap-2">
                  <Label :for="`group-display-${groupIndex}`">Display type</Label>
                  <select
                    :id="`group-display-${groupIndex}`"
                    v-model="group.displayType"
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option value="TEXT">
                      Text
                    </option>
                    <option value="COLOR">
                      Color
                    </option>
                  </select>
                </div>
              </div>

              <div class="space-y-2">
                <div
                  v-for="(value, valueIndex) in group.values"
                  :key="`value-${valueIndex}`"
                  class="grid gap-3 md:grid-cols-[1fr_1fr_160px_auto]"
                >
                  <Input v-model="value.label" :placeholder="`Value ${valueIndex + 1}`" />
                  <Input v-model="value.slug" placeholder="Auto-generated" />
                  <Input v-model="value.colorHex" placeholder="#94a3b8" />
                  <Button variant="ghost" size="sm" type="button" @click="removeOptionValue(groupIndex, valueIndex)">
                    Remove
                  </Button>
                </div>
              </div>

              <Button variant="outline" size="sm" type="button" @click="addOptionValue(groupIndex)">
                Add value
              </Button>
            </CardContent>
          </Card>
        </div>

        <p v-else class="text-sm text-muted-foreground">
          No option groups defined. The product will have a single variant axis.
        </p>
      </section>

      <!-- Variants Section -->
      <section class="grid gap-6 rounded-xl border border-border/70 bg-card/80 p-6 shadow-xs md:p-7">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1">
            <h2 class="text-base font-semibold">
              Variants
            </h2>
            <p class="text-sm text-muted-foreground">
              Each variant maps to a Project Zomboid item code and has its own price and stock.
            </p>
          </div>
          <Button variant="outline" size="sm" type="button" @click="addVariant">
            Add variant
          </Button>
        </div>

        <div class="grid gap-4">
          <Card
            v-for="(variant, variantIndex) in form.variants"
            :key="`variant-${variantIndex}`"
          >
            <CardHeader class="pb-4">
              <div class="flex items-center justify-between gap-3">
                <CardTitle class="text-sm font-medium">
                  Variant {{ variantIndex + 1 }}
                </CardTitle>
                <Button
                  v-if="form.variants.length > 1"
                  variant="ghost"
                  size="sm"
                  type="button"
                  @click="removeVariant(variantIndex)"
                >
                  Remove
                </Button>
              </div>
            </CardHeader>
            <CardContent class="space-y-4">
              <div class="grid gap-4 md:grid-cols-2">
                <div class="grid gap-2">
                  <Label :for="`variant-name-${variantIndex}`">Variant name</Label>
                  <Input :id="`variant-name-${variantIndex}`" v-model="variant.name" placeholder="Left - Army" />
                </div>
                <div class="grid gap-2">
                  <Label :for="`variant-sku-${variantIndex}`">SKU</Label>
                  <Input :id="`variant-sku-${variantIndex}`" v-model="variant.sku" placeholder="Auto-generated" />
                </div>
                <div class="grid gap-2">
                  <Label :for="`variant-itemcode-${variantIndex}`">Item code</Label>
                  <Input :id="`variant-itemcode-${variantIndex}`" v-model="variant.itemCode" required placeholder="Base.Kneepad_Left_Army" />
                  <p class="text-xs text-muted-foreground">
                    The full Project Zomboid item type.
                  </p>
                </div>
                <div class="grid gap-2">
                  <Label :for="`variant-gamename-${variantIndex}`">Game name</Label>
                  <Input :id="`variant-gamename-${variantIndex}`" v-model="variant.gameName" placeholder="Display name in-game" />
                </div>
                <div class="grid gap-2">
                  <Label :for="`variant-gamecat-${variantIndex}`">Game category</Label>
                  <Input :id="`variant-gamecat-${variantIndex}`" v-model="variant.gameCategory" placeholder="Clothing" />
                </div>
                <div class="grid gap-2">
                  <Label :for="`variant-badge-${variantIndex}`">Badge</Label>
                  <Input :id="`variant-badge-${variantIndex}`" v-model="variant.badge" placeholder="Optional badge" />
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-5">
                <div class="grid gap-2">
                  <Label :for="`variant-price-${variantIndex}`">Price</Label>
                  <Input :id="`variant-price-${variantIndex}`" v-model.number="variant.price" type="number" min="0" />
                </div>
                <div class="grid gap-2">
                  <Label :for="`variant-compare-${variantIndex}`">Compare at</Label>
                  <Input :id="`variant-compare-${variantIndex}`" v-model.number="variant.compareAtPrice" type="number" min="0" />
                </div>
                <div class="grid gap-2">
                  <Label :for="`variant-qty-${variantIndex}`">Quantity</Label>
                  <Input :id="`variant-qty-${variantIndex}`" v-model.number="variant.quantity" type="number" min="1" />
                </div>
                <div class="grid gap-2">
                  <Label :for="`variant-stock-${variantIndex}`">Stock</Label>
                  <Input :id="`variant-stock-${variantIndex}`" v-model.number="variant.stock" type="number" min="0" placeholder="Unlimited" />
                </div>
                <div class="grid gap-2">
                  <Label :for="`variant-weight-${variantIndex}`">Weight</Label>
                  <Input :id="`variant-weight-${variantIndex}`" v-model.number="variant.weight" type="number" min="0" step="0.01" />
                </div>
              </div>

              <div class="grid gap-4 md:grid-cols-[1fr_120px]">
                <div class="grid gap-2">
                  <Label :for="`variant-image-${variantIndex}`">Image URL</Label>
                  <Input :id="`variant-image-${variantIndex}`" v-model="variant.imageUrl" placeholder="https://..." />
                </div>
                <div class="flex h-20 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                  <img
                    v-if="variant.imageUrl"
                    :src="variant.imageUrl"
                    :alt="variant.gameName || variant.name || 'Preview'"
                    class="size-full object-contain"
                  >
                  <span v-else class="text-xs text-muted-foreground">No image</span>
                </div>
              </div>

              <FieldSet>
                <div class="grid gap-3 md:grid-cols-2">
                  <FieldLabel :for="`variant-default-${variantIndex}`">
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Default variant</FieldTitle>
                      </FieldContent>
                      <Checkbox
                        :id="`variant-default-${variantIndex}`"
                        :checked="variant.isDefault"
                        @update:checked="variant.isDefault = $event"
                      />
                    </Field>
                  </FieldLabel>
                  <FieldLabel :for="`variant-active-${variantIndex}`">
                    <Field orientation="horizontal">
                      <FieldContent>
                        <FieldTitle>Active</FieldTitle>
                      </FieldContent>
                      <Checkbox
                        :id="`variant-active-${variantIndex}`"
                        :checked="variant.isActive"
                        @update:checked="variant.isActive = $event"
                      />
                    </Field>
                  </FieldLabel>
                </div>
              </FieldSet>

              <div
                v-if="form.optionGroups.length"
                class="grid gap-4 md:grid-cols-3"
              >
                <div
                  v-for="(group, gIdx) in form.optionGroups"
                  :key="`variant-${variantIndex}-group-${gIdx}`"
                  class="grid gap-2"
                >
                  <Label>{{ group.name || `Option ${gIdx + 1}` }}</Label>
                  <select
                    v-model="variant.selections[groupKey(group, gIdx)]"
                    class="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <option
                      v-for="(val, vIdx) in group.values"
                      :key="`opt-${vIdx}`"
                      :value="optionValueKey(val, vIdx)"
                    >
                      {{ val.label || `Value ${vIdx + 1}` }}
                    </option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <!-- Related items (from multi-import analysis) -->
      <Alert v-if="importRelated.length > 0">
        <AlertDescription>
          <p class="mb-2 font-medium">
            Related items found in the catalog that you may want to include:
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

      <!-- Error + Submit -->
      <Alert v-if="error" variant="destructive">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div class="grid gap-2">
        <Button type="submit" class="w-full" :disabled="loading">
          {{ loading ? 'Creating…' : 'Create product' }}
        </Button>
        <p class="text-center text-xs text-muted-foreground">
          You can edit the product after creation from the store admin.
        </p>
      </div>
    </form>
  </div>
</template>
