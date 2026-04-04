<script setup lang="ts">
import type { StoreBundleSummary, StoreCategorySummary, StoreProductDetail } from '@/lib/store'
import { formatStoreMoney } from '@/lib/store'

interface RecommendationOption {
  id: string
  name: string
  slug: string
}

interface VariantOption {
  id: string
  productId: string
  productName: string
  productSlug: string
  variantName: string
  itemCode: string
  price: number
  stock: number | null
  label: string
}

interface AdminStoreBootstrap {
  profile: {
    id: string
    name: string
    servername: string
  } | null
  catalog: {
    source: string
    total: number
  }
  categories: Array<StoreCategorySummary & {
    sortOrder: number
    isActive: boolean
  }>
  products: Array<StoreProductDetail & {
    recommendationProductIds: string[]
  }>
  bundles: StoreBundleSummary[]
  recommendationOptions: RecommendationOption[]
  variantOptions: VariantOption[]
}

interface CatalogSearchResult {
  fullType: string
  name: string
  category: string | null
  displayCategory?: string | null
  iconName: string | null
  textureIcon?: string | null
  iconUrl?: string | null
  source: 'lua_bridge' | 'telemetry'
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

const bootstrapDefault: AdminStoreBootstrap = {
  profile: null,
  catalog: {
    source: 'telemetry',
    total: 0,
  },
  categories: [],
  products: [],
  bundles: [],
  recommendationOptions: [],
  variantOptions: [],
}

const catalogDefault = {
  source: 'telemetry',
  total: 0,
  items: [] as CatalogSearchResult[],
}

const catalogQuery = ref('')

const { data: bootstrap, refresh: refreshBootstrap, pending: bootstrapPending } = await useFetch<AdminStoreBootstrap>(
  '/api/store/admin/bootstrap',
  {
    default: () => bootstrapDefault,
  },
)

const { data: catalogSearch, refresh: refreshCatalogSearch, pending: catalogPending } = await useFetch<{
  source: string
  total: number
  items: CatalogSearchResult[]
}>(
  '/api/store/admin/catalog',
  {
    query: computed(() => ({
      q: catalogQuery.value.trim(),
      limit: 20,
    })),
    default: () => catalogDefault,
    immediate: false,
  },
)

const activeTab = ref('overview')
const categoryNotice = ref('')
const productNotice = ref('')
const bundleNotice = ref('')
const catalogImportNotice = ref('')
const catalogImportError = ref('')
const catalogImportingFullType = ref('')
const lastCatalogImport = ref<CatalogItemEnrichment | null>(null)

const categoryForm = reactive({
  name: '',
  slug: '',
  description: '',
  heroTitle: '',
  heroDescription: '',
  accentColor: '#64748b',
  icon: '',
  sortOrder: 0,
  isFeatured: false,
  isActive: true,
})

const productForm = reactive({
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
  optionGroups: [
    {
      name: 'Side',
      slug: 'side',
      displayType: 'TEXT' as 'TEXT' | 'COLOR',
      values: [
        { label: 'Left', slug: 'left', colorHex: '' },
        { label: 'Right', slug: 'right', colorHex: '' },
      ],
    },
  ],
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
      selections: { side: 'left' } as Record<string, string>,
    },
  ],
})

const bundleForm = reactive({
  name: '',
  slug: '',
  summary: '',
  description: '',
  badge: '',
  accentColor: '#0f766e',
  pricingMode: 'discount' as 'discount' | 'manual',
  discountPercent: 10,
  price: undefined as number | undefined,
  compareAtPrice: undefined as number | undefined,
  isFeatured: false,
  isActive: true,
  sortOrder: 0,
  items: [
    { variantId: '', quantity: 1 },
  ],
})

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function groupKey(group: { name: string, slug?: string }, index: number) {
  return slugify(group.slug || group.name) || `group-${index + 1}`
}

function optionValueKey(value: { label: string, slug?: string }, index: number) {
  return slugify(value.slug || value.label) || `value-${index + 1}`
}

function featureBulletsFromText() {
  return productForm.featureBulletsText
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}

function specsFromText() {
  return productForm.specsText
    .split('\n')
    .map((line) => {
      const trimmed = line.trim()
      if (!trimmed || !trimmed.includes(':')) {
        return null
      }

      const [left = '', ...valueParts] = trimmed.split(':')
      const value = valueParts.join(':').trim()
      const parts = left.includes('|')
        ? left.split('|').map(part => part.trim())
        : ['General', left.trim()]
      const group = parts[0] || 'General'
      const label = parts[1] || left.trim()

      if (!label || !value) {
        return null
      }

      return {
        group,
        label,
        value,
      }
    })
    .filter((row): row is { group: string, label: string, value: string } => Boolean(row))
}

function formatSpecsText(rows: CatalogSpecRow[]) {
  return rows.map(row => `${row.group} | ${row.label}: ${row.value}`).join('\n')
}

function isVariantBlank(variant: typeof productForm.variants[number]) {
  return !variant.name
    && !variant.itemCode
    && !variant.gameName
    && !variant.gameCategory
    && !variant.badge
    && !variant.imageUrl
    && typeof variant.weight !== 'number'
    && variant.price === 0
}

function resetCategoryForm() {
  categoryForm.name = ''
  categoryForm.slug = ''
  categoryForm.description = ''
  categoryForm.heroTitle = ''
  categoryForm.heroDescription = ''
  categoryForm.accentColor = '#64748b'
  categoryForm.icon = ''
  categoryForm.sortOrder = 0
  categoryForm.isFeatured = false
  categoryForm.isActive = true
}

function resetProductForm() {
  productForm.name = ''
  productForm.slug = ''
  productForm.summary = ''
  productForm.description = ''
  productForm.overview = ''
  productForm.badge = ''
  productForm.accentColor = '#b45309'
  productForm.featureBulletsText = ''
  productForm.specsText = ''
  productForm.categoryIds = []
  productForm.recommendationProductIds = []
  productForm.isFeatured = false
  productForm.isActive = true
  productForm.sortOrder = 0
  productForm.optionGroups = [
    {
      name: 'Side',
      slug: 'side',
      displayType: 'TEXT',
      values: [
        { label: 'Left', slug: 'left', colorHex: '' },
        { label: 'Right', slug: 'right', colorHex: '' },
      ],
    },
  ]
  productForm.variants = [
    {
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
      isDefault: true,
      isActive: true,
      selections: { side: 'left' },
    },
  ]
}

function resetBundleForm() {
  bundleForm.name = ''
  bundleForm.slug = ''
  bundleForm.summary = ''
  bundleForm.description = ''
  bundleForm.badge = ''
  bundleForm.accentColor = '#0f766e'
  bundleForm.pricingMode = 'discount'
  bundleForm.discountPercent = 10
  bundleForm.price = undefined
  bundleForm.compareAtPrice = undefined
  bundleForm.isFeatured = false
  bundleForm.isActive = true
  bundleForm.sortOrder = 0
  bundleForm.items = [{ variantId: '', quantity: 1 }]
}

function toggleSelection(collection: string[], id: string) {
  if (collection.includes(id)) {
    return collection.filter(value => value !== id)
  }

  return [...collection, id]
}

function addOptionGroup() {
  productForm.optionGroups.push({
    name: '',
    slug: '',
    displayType: 'TEXT',
    values: [{ label: '', slug: '', colorHex: '' }],
  })
}

function addOptionValue(groupIndex: number) {
  const group = productForm.optionGroups[groupIndex]
  if (!group) {
    return
  }

  group.values.push({
    label: '',
    slug: '',
    colorHex: '',
  })
}

function removeOptionValue(groupIndex: number, valueIndex: number) {
  const group = productForm.optionGroups[groupIndex]
  if (!group || group.values.length === 1) {
    return
  }

  group.values.splice(valueIndex, 1)
}

function removeOptionGroup(groupIndex: number) {
  if (productForm.optionGroups.length === 1) {
    return
  }

  productForm.optionGroups.splice(groupIndex, 1)
}

function addVariant(prefill?: Partial<typeof productForm.variants[number]>) {
  const firstGroup = productForm.optionGroups[0]
  const firstGroupKey = firstGroup ? groupKey(firstGroup, 0) : ''
  const firstValue = firstGroup?.values[0]

  productForm.variants.push({
    name: prefill?.name || '',
    sku: prefill?.sku || '',
    itemCode: prefill?.itemCode || '',
    gameName: prefill?.gameName || '',
    gameCategory: prefill?.gameCategory || '',
    price: prefill?.price ?? 0,
    compareAtPrice: prefill?.compareAtPrice,
    quantity: prefill?.quantity ?? 1,
    stock: prefill?.stock,
    weight: prefill?.weight,
    badge: prefill?.badge || '',
    imageUrl: prefill?.imageUrl || '',
    metadata: prefill?.metadata || null,
    isDefault: Boolean(prefill?.isDefault),
    isActive: prefill?.isActive ?? true,
    selections: prefill?.selections || (firstGroupKey && firstValue ? { [firstGroupKey]: optionValueKey(firstValue, 0) } : {}),
  })
}

function replaceOrAppendVariant(prefill: Partial<typeof productForm.variants[number]>) {
  const firstVariant = productForm.variants[0]
  if (firstVariant && isVariantBlank(firstVariant)) {
    productForm.variants[0] = {
      ...firstVariant,
      name: prefill?.name || '',
      sku: prefill?.sku || '',
      itemCode: prefill?.itemCode || '',
      gameName: prefill?.gameName || '',
      gameCategory: prefill?.gameCategory || '',
      price: prefill?.price ?? 0,
      compareAtPrice: prefill?.compareAtPrice,
      quantity: prefill?.quantity ?? 1,
      stock: prefill?.stock,
      weight: prefill?.weight,
      badge: prefill?.badge || '',
      imageUrl: prefill?.imageUrl || '',
      metadata: prefill?.metadata || null,
      isDefault: prefill?.isDefault ?? true,
      isActive: prefill?.isActive ?? true,
      selections: prefill?.selections || firstVariant.selections,
    }
    return
  }

  addVariant(prefill)
}

function removeVariant(index: number) {
  if (productForm.variants.length === 1) {
    return
  }

  productForm.variants.splice(index, 1)
}

function addBundleItem() {
  bundleForm.items.push({ variantId: '', quantity: 1 })
}

function removeBundleItem(index: number) {
  if (bundleForm.items.length === 1) {
    return
  }

  bundleForm.items.splice(index, 1)
}

function seedVariantFromCatalog(item: CatalogSearchResult) {
  replaceOrAppendVariant({
    name: item.name,
    itemCode: item.fullType,
    gameName: item.name,
    gameCategory: item.displayCategory || item.category || '',
    weight: item.weight ?? undefined,
    imageUrl: item.iconUrl || '',
    price: 0,
  })
}

function applyImportedCatalogItem(enrichment: CatalogItemEnrichment) {
  const payload = enrichment.importPayload

  if (!productForm.name.trim()) {
    productForm.name = payload.product.name
  }
  if (!productForm.summary.trim()) {
    productForm.summary = payload.product.summary
  }
  if (!productForm.description.trim()) {
    productForm.description = payload.product.description
  }
  if (!productForm.overview.trim()) {
    productForm.overview = payload.product.overview
  }
  if (!productForm.featureBulletsText.trim() && payload.product.featureBullets.length) {
    productForm.featureBulletsText = payload.product.featureBullets.join('\n')
  }
  if (!productForm.specsText.trim() && payload.product.specs.length) {
    productForm.specsText = formatSpecsText(payload.product.specs)
  }

  replaceOrAppendVariant({
    name: payload.variant.name,
    itemCode: payload.variant.itemCode,
    gameName: payload.variant.gameName,
    gameCategory: payload.variant.gameCategory || '',
    weight: payload.variant.weight ?? undefined,
    imageUrl: payload.variant.imageUrl || '',
    metadata: payload.variant.metadata,
    price: 0,
  })
}

async function searchCatalog() {
  await refreshCatalogSearch()
}

async function importCatalogItem(fullType: string) {
  catalogImportingFullType.value = fullType
  catalogImportError.value = ''

  try {
    const response = await $fetch<{ enrichment: CatalogItemEnrichment }>('/api/store/admin/catalog/item', {
      query: { fullType },
    })

    lastCatalogImport.value = response.enrichment
    applyImportedCatalogItem(response.enrichment)
    activeTab.value = 'products'
    catalogImportNotice.value = `Imported ${response.enrichment.item.name} into the product builder.`
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

async function submitCategory() {
  await $fetch('/api/store/admin/categories', {
    method: 'POST',
    body: { ...categoryForm },
  })

  categoryNotice.value = 'Category created'
  resetCategoryForm()
  await refreshBootstrap()
}

async function submitProduct() {
  await $fetch('/api/store/admin/products', {
    method: 'POST',
    body: {
      ...productForm,
      featureBullets: featureBulletsFromText(),
      specs: specsFromText(),
      optionGroups: productForm.optionGroups.map((group, groupIndex) => ({
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
      variants: productForm.variants.map((variant, variantIndex) => ({
        ...variant,
        sortOrder: variantIndex,
      })),
    },
  })

  productNotice.value = 'Product created'
  resetProductForm()
  await refreshBootstrap()
}

async function submitBundle() {
  await $fetch('/api/store/admin/bundles', {
    method: 'POST',
    body: {
      ...bundleForm,
      items: bundleForm.items.map((item, index) => ({
        ...item,
        sortOrder: index,
      })),
    },
  })

  bundleNotice.value = 'Bundle created'
  resetBundleForm()
  await refreshBootstrap()
}

async function deleteCategory(categoryId: string) {
  await $fetch(`/api/store/admin/categories/${categoryId}`, { method: 'DELETE' })
  await refreshBootstrap()
}

async function deleteProduct(productId: string) {
  await $fetch(`/api/store/admin/products/${productId}`, { method: 'DELETE' })
  await refreshBootstrap()
}

async function deleteBundle(bundleId: string) {
  await $fetch(`/api/store/admin/bundles/${bundleId}`, { method: 'DELETE' })
  await refreshBootstrap()
}
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <h1 class="text-3xl font-semibold tracking-tight">
          Store Admin
        </h1>
        <p class="mt-2 text-sm text-muted-foreground">
          Build categories, variant-driven products, bundles, and recommendation links against the live game catalog.
        </p>
      </div>

      <Badge variant="secondary" class="w-fit px-3 py-1">
        {{ bootstrap.profile?.name || 'No active profile' }}
      </Badge>
    </div>

    <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Card>
        <CardHeader class="pb-3">
          <CardDescription>Catalog source</CardDescription>
          <CardTitle class="text-xl">
            {{ bootstrap.catalog.source }}
          </CardTitle>
        </CardHeader>
        <CardContent class="text-sm text-muted-foreground">
          {{ bootstrap.catalog.total }} known item codes available for search.
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-3">
          <CardDescription>Categories</CardDescription>
          <CardTitle class="text-xl">
            {{ bootstrap.categories.length }}
          </CardTitle>
        </CardHeader>
        <CardContent class="text-sm text-muted-foreground">
          Multi-category merchandising is enabled.
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-3">
          <CardDescription>Products</CardDescription>
          <CardTitle class="text-xl">
            {{ bootstrap.products.length }}
          </CardTitle>
        </CardHeader>
        <CardContent class="text-sm text-muted-foreground">
          Each product can fan out into multiple server item codes via variants.
        </CardContent>
      </Card>

      <Card>
        <CardHeader class="pb-3">
          <CardDescription>Bundles</CardDescription>
          <CardTitle class="text-xl">
            {{ bootstrap.bundles.length }}
          </CardTitle>
        </CardHeader>
        <CardContent class="text-sm text-muted-foreground">
          Bundle pricing and compare-at totals are ready.
        </CardContent>
      </Card>
    </div>

    <Tabs v-model="activeTab" class="space-y-6">
      <TabsList class="grid w-full grid-cols-4 lg:w-[520px]">
        <TabsTrigger value="overview">
          Overview
        </TabsTrigger>
        <TabsTrigger value="products">
          Products
        </TabsTrigger>
        <TabsTrigger value="bundles">
          Bundles
        </TabsTrigger>
        <TabsTrigger value="categories">
          Categories
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" class="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Game Item Search</CardTitle>
            <CardDescription>
              Search the live Project Zomboid catalog and turn item codes into variants without hand-typing them.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <Alert v-if="catalogImportNotice || catalogImportError || lastCatalogImport?.wiki.note">
              <AlertTitle>
                {{ catalogImportError || catalogImportNotice || 'Catalog import ready' }}
              </AlertTitle>
              <AlertDescription>
                {{ catalogImportError || lastCatalogImport?.wiki.note || 'Imported copy, specs, and variant details can be refined in the Products tab.' }}
              </AlertDescription>
            </Alert>

            <div class="flex flex-col gap-3 md:flex-row">
              <Input
                v-model="catalogQuery"
                placeholder="Search item code or display name"
              />
              <Button :disabled="catalogPending" @click="searchCatalog">
                {{ catalogPending ? 'Searching…' : 'Search catalog' }}
              </Button>
            </div>

            <div class="grid gap-3 md:grid-cols-2">
              <Card
                v-for="item in catalogSearch.items"
                :key="item.fullType"
                class="border-dashed"
              >
                <CardHeader class="pb-3">
                  <div class="flex items-start gap-3">
                    <div class="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border bg-muted/20">
                      <img
                        v-if="item.iconUrl"
                        :src="item.iconUrl"
                        :alt="item.name"
                        class="h-full w-full object-contain"
                      >
                      <div v-else class="text-xs text-muted-foreground">
                        No image
                      </div>
                    </div>
                    <div class="min-w-0 space-y-1">
                      <CardTitle class="text-base">
                        {{ item.name }}
                      </CardTitle>
                      <CardDescription>
                        {{ item.fullType }}
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent class="space-y-4 text-sm">
                  <div class="flex flex-wrap gap-2">
                    <Badge variant="outline">
                      {{ item.displayCategory || item.category || 'Unknown category' }}
                    </Badge>
                    <Badge v-if="typeof item.weight === 'number'" variant="outline">
                      {{ item.weight }} enc.
                    </Badge>
                    <Badge v-if="item.isTwoHandWeapon" variant="outline">
                      Two-handed
                    </Badge>
                    <Badge v-if="typeof item.maxCondition === 'number'" variant="outline">
                      Cond. {{ item.maxCondition }}
                    </Badge>
                  </div>

                  <div class="flex flex-wrap justify-end gap-2">
                    <Button variant="outline" @click="seedVariantFromCatalog(item)">
                      Add variant only
                    </Button>
                    <Button
                      variant="secondary"
                      :disabled="catalogImportingFullType === item.fullType"
                      @click="importCatalogItem(item.fullType)"
                    >
                      {{ catalogImportingFullType === item.fullType ? 'Importing…' : 'Import details' }}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Current Catalog</CardTitle>
            <CardDescription>
              Snapshot of the configured store content in this profile.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <div>
              <h3 class="text-sm font-medium">
                Products
              </h3>
              <div class="mt-3 grid gap-3 xl:grid-cols-3">
                <Card
                  v-for="product in bootstrap.products"
                  :key="product.id"
                >
                  <CardHeader class="pb-3">
                    <CardTitle class="text-base">
                      {{ product.name }}
                    </CardTitle>
                    <CardDescription>
                      {{ product.variantCount }} variants
                    </CardDescription>
                  </CardHeader>
                  <CardContent class="space-y-3 text-sm">
                    <div class="flex flex-wrap gap-2">
                      <Badge
                        v-for="category in product.categories"
                        :key="category.id"
                        variant="outline"
                      >
                        {{ category.name }}
                      </Badge>
                    </div>
                    <div class="flex items-center justify-between">
                      <span class="text-muted-foreground">{{ formatStoreMoney(product.pricing.min) }}</span>
                      <Button variant="ghost" size="sm" @click="deleteProduct(product.id)">
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div>
              <h3 class="text-sm font-medium">
                Bundles
              </h3>
              <div class="mt-3 grid gap-3 xl:grid-cols-3">
                <Card
                  v-for="bundle in bootstrap.bundles"
                  :key="bundle.id"
                >
                  <CardHeader class="pb-3">
                    <CardTitle class="text-base">
                      {{ bundle.name }}
                    </CardTitle>
                    <CardDescription>
                      {{ bundle.itemCount }} items
                    </CardDescription>
                  </CardHeader>
                  <CardContent class="flex items-center justify-between text-sm">
                    <span class="text-muted-foreground">{{ formatStoreMoney(bundle.price) }}</span>
                    <Button variant="ghost" size="sm" @click="deleteBundle(bundle.id)">
                      Delete
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="products" class="space-y-6">
        <Alert v-if="productNotice">
          <AlertTitle>Saved</AlertTitle>
          <AlertDescription>{{ productNotice }}</AlertDescription>
        </Alert>

        <Alert v-if="catalogImportNotice || catalogImportError || lastCatalogImport?.wiki.note">
          <AlertTitle>
            {{ catalogImportError || catalogImportNotice || 'Imported item details' }}
          </AlertTitle>
          <AlertDescription>
            {{ catalogImportError || lastCatalogImport?.wiki.note || 'Review the imported copy, specs, weight, and image fields before creating the product.' }}
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Create Product</CardTitle>
            <CardDescription>
              Parent products hold the merchandising copy; variants map to exact in-game item codes.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-8">
            <div class="grid gap-4 lg:grid-cols-2">
              <div class="space-y-2">
                <Label>Name</Label>
                <Input v-model="productForm.name" placeholder="Military kneepads" />
              </div>
              <div class="space-y-2">
                <Label>Slug</Label>
                <Input v-model="productForm.slug" placeholder="Optional custom slug" />
              </div>
              <div class="space-y-2">
                <Label>Badge</Label>
                <Input v-model="productForm.badge" placeholder="Featured" />
              </div>
              <div class="space-y-2">
                <Label>Accent color</Label>
                <Input v-model="productForm.accentColor" placeholder="#b45309" />
              </div>
            </div>

            <div class="space-y-2">
              <Label>Summary</Label>
              <Textarea v-model="productForm.summary" :rows="2" />
            </div>

            <div class="space-y-2">
              <Label>Description</Label>
              <Textarea v-model="productForm.description" :rows="3" />
            </div>

            <div class="space-y-2">
              <Label>Overview</Label>
              <Textarea v-model="productForm.overview" :rows="4" />
            </div>

            <div class="grid gap-6 lg:grid-cols-2">
              <div class="space-y-2">
                <Label>Feature bullets</Label>
                <Textarea
                  v-model="productForm.featureBulletsText"
                  :rows="6"
                  placeholder="One feature per line"
                />
              </div>

              <div class="space-y-2">
                <Label>Specs</Label>
                <Textarea
                  v-model="productForm.specsText"
                  :rows="6"
                  placeholder="Group | Label: Value"
                />
              </div>
            </div>

            <div class="grid gap-6 lg:grid-cols-2">
              <div class="space-y-3">
                <Label>Categories</Label>
                <div class="grid gap-2 rounded-lg border p-4">
                  <label
                    v-for="category in bootstrap.categories"
                    :key="category.id"
                    class="flex items-center justify-between gap-3 text-sm"
                  >
                    <span>{{ category.name }}</span>
                    <input
                      :checked="productForm.categoryIds.includes(category.id)"
                      type="checkbox"
                      class="h-4 w-4"
                      @change="productForm.categoryIds = toggleSelection(productForm.categoryIds, category.id)"
                    >
                  </label>
                </div>
              </div>

              <div class="space-y-3">
                <Label>Recommended add-ons</Label>
                <div class="grid gap-2 rounded-lg border p-4">
                  <label
                    v-for="recommendation in bootstrap.recommendationOptions"
                    :key="recommendation.id"
                    class="flex items-center justify-between gap-3 text-sm"
                  >
                    <span>{{ recommendation.name }}</span>
                    <input
                      :checked="productForm.recommendationProductIds.includes(recommendation.id)"
                      type="checkbox"
                      class="h-4 w-4"
                      @change="productForm.recommendationProductIds = toggleSelection(productForm.recommendationProductIds, recommendation.id)"
                    >
                  </label>
                </div>
              </div>
            </div>

            <Separator />

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-medium">
                    Variant axes
                  </h3>
                  <p class="text-sm text-muted-foreground">
                    Define selectors like side, color, or finish.
                  </p>
                </div>
                <Button variant="outline" @click="addOptionGroup">
                  Add option group
                </Button>
              </div>

              <div class="grid gap-4">
                <Card
                  v-for="(group, groupIndex) in productForm.optionGroups"
                  :key="`group-${groupIndex}`"
                >
                  <CardHeader class="pb-4">
                    <div class="flex items-center justify-between gap-3">
                      <CardTitle class="text-base">
                        Option group {{ groupIndex + 1 }}
                      </CardTitle>
                      <Button variant="ghost" size="sm" @click="removeOptionGroup(groupIndex)">
                        Remove
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent class="space-y-4">
                    <div class="grid gap-4 md:grid-cols-3">
                      <Input v-model="group.name" placeholder="Name" />
                      <Input v-model="group.slug" placeholder="Slug" />
                      <select v-model="group.displayType" class="h-10 rounded-md border bg-background px-3 text-sm">
                        <option value="TEXT">
                          Text
                        </option>
                        <option value="COLOR">
                          Color
                        </option>
                      </select>
                    </div>

                    <div class="space-y-3">
                      <div
                        v-for="(value, valueIndex) in group.values"
                        :key="`value-${valueIndex}`"
                        class="grid gap-3 md:grid-cols-[1fr_1fr_160px_auto]"
                      >
                        <Input v-model="value.label" placeholder="Value label" />
                        <Input v-model="value.slug" placeholder="Value slug" />
                        <Input v-model="value.colorHex" placeholder="#94a3b8" />
                        <Button variant="ghost" @click="removeOptionValue(groupIndex, valueIndex)">
                          Remove
                        </Button>
                      </div>
                    </div>

                    <Button variant="outline" @click="addOptionValue(groupIndex)">
                      Add value
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            <Separator />

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-medium">
                    Variants
                  </h3>
                  <p class="text-sm text-muted-foreground">
                    Each variant should point to an actual Project Zomboid item code.
                  </p>
                </div>
                <Button variant="outline" @click="addVariant()">
                  Add variant
                </Button>
              </div>

              <div class="grid gap-4">
                <Card
                  v-for="(variant, variantIndex) in productForm.variants"
                  :key="`variant-${variantIndex}`"
                >
                  <CardHeader class="pb-4">
                    <div class="flex items-center justify-between gap-3">
                      <CardTitle class="text-base">
                        Variant {{ variantIndex + 1 }}
                      </CardTitle>
                      <Button variant="ghost" size="sm" @click="removeVariant(variantIndex)">
                        Remove
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent class="space-y-4">
                    <div class="grid gap-4 lg:grid-cols-2">
                      <Input v-model="variant.name" placeholder="Variant name" />
                      <Input v-model="variant.sku" placeholder="SKU (optional)" />
                      <Input v-model="variant.itemCode" placeholder="Base.Kneepad_Left_Army" />
                      <Input v-model="variant.gameName" placeholder="Game display name" />
                      <Input v-model="variant.gameCategory" placeholder="Game category" />
                      <Input v-model="variant.badge" placeholder="Variant badge" />
                    </div>

                    <div class="grid gap-4 lg:grid-cols-5">
                      <Input v-model.number="variant.price" type="number" min="0" placeholder="Price" />
                      <Input v-model.number="variant.compareAtPrice" type="number" min="0" placeholder="Compare-at" />
                      <Input v-model.number="variant.quantity" type="number" min="1" placeholder="PZ quantity" />
                      <Input v-model.number="variant.stock" type="number" min="0" placeholder="Stock (blank = unlimited)" />
                      <Input v-model.number="variant.weight" type="number" min="0" step="0.01" placeholder="Weight" />
                    </div>

                    <div class="grid gap-4 lg:grid-cols-[minmax(0,1fr)_160px]">
                      <Input v-model="variant.imageUrl" placeholder="Image URL" />
                      <div class="flex h-24 items-center justify-center overflow-hidden rounded-xl border bg-muted/20">
                        <img
                          v-if="variant.imageUrl"
                          :src="variant.imageUrl"
                          :alt="variant.gameName || variant.name || 'Variant image'"
                          class="h-full w-full object-contain"
                        >
                        <span v-else class="text-xs text-muted-foreground">No image</span>
                      </div>
                    </div>

                    <div class="grid gap-4 lg:grid-cols-2">
                      <label class="flex items-center gap-3 text-sm">
                        <input v-model="variant.isDefault" type="checkbox" class="h-4 w-4">
                        Default variant
                      </label>
                      <label class="flex items-center gap-3 text-sm">
                        <input v-model="variant.isActive" type="checkbox" class="h-4 w-4">
                        Active
                      </label>
                    </div>

                    <div
                      v-if="productForm.optionGroups.length"
                      class="grid gap-4 lg:grid-cols-3"
                    >
                      <div
                        v-for="(group, groupIndex) in productForm.optionGroups"
                        :key="`variant-${variantIndex}-${groupIndex}`"
                        class="space-y-2"
                      >
                        <Label>{{ group.name || `Option ${groupIndex + 1}` }}</Label>
                        <select
                          v-model="variant.selections[groupKey(group, groupIndex)]"
                          class="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        >
                          <option
                            v-for="(value, valueIndex) in group.values"
                            :key="`option-${valueIndex}`"
                            :value="optionValueKey(value, valueIndex)"
                          >
                            {{ value.label || `Value ${valueIndex + 1}` }}
                          </option>
                        </select>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div class="flex flex-wrap gap-3">
              <Button :disabled="bootstrapPending" @click="submitProduct">
                Create product
              </Button>
              <Button variant="outline" @click="resetProductForm">
                Reset form
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="bundles" class="space-y-6">
        <Alert v-if="bundleNotice">
          <AlertTitle>Saved</AlertTitle>
          <AlertDescription>{{ bundleNotice }}</AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Create Bundle</CardTitle>
            <CardDescription>
              Combine variants into one offer and either set price manually or derive it from a discount percent.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-6">
            <div class="grid gap-4 lg:grid-cols-2">
              <Input v-model="bundleForm.name" placeholder="Bundle name" />
              <Input v-model="bundleForm.slug" placeholder="Optional custom slug" />
              <Input v-model="bundleForm.badge" placeholder="Badge" />
              <Input v-model="bundleForm.accentColor" placeholder="#0f766e" />
            </div>

            <div class="space-y-2">
              <Label>Summary</Label>
              <Textarea v-model="bundleForm.summary" :rows="2" />
            </div>

            <div class="space-y-2">
              <Label>Description</Label>
              <Textarea v-model="bundleForm.description" :rows="3" />
            </div>

            <div class="grid gap-4 lg:grid-cols-4">
              <select v-model="bundleForm.pricingMode" class="h-10 rounded-md border bg-background px-3 text-sm">
                <option value="discount">
                  Discount pricing
                </option>
                <option value="manual">
                  Manual pricing
                </option>
              </select>
              <Input v-model.number="bundleForm.discountPercent" type="number" min="0" max="100" placeholder="Discount %" />
              <Input v-model.number="bundleForm.price" type="number" min="0" placeholder="Manual price" />
              <Input v-model.number="bundleForm.compareAtPrice" type="number" min="0" placeholder="Compare-at" />
            </div>

            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-medium">
                    Bundle items
                  </h3>
                  <p class="text-sm text-muted-foreground">
                    Pull from the variant library that was created in the products tab.
                  </p>
                </div>
                <Button variant="outline" @click="addBundleItem">
                  Add item
                </Button>
              </div>

              <div class="grid gap-4">
                <Card
                  v-for="(item, itemIndex) in bundleForm.items"
                  :key="`bundle-item-${itemIndex}`"
                >
                  <CardContent class="grid gap-4 pt-6 lg:grid-cols-[1fr_140px_auto]">
                    <select v-model="item.variantId" class="h-10 rounded-md border bg-background px-3 text-sm">
                      <option value="">
                        Select variant
                      </option>
                      <option
                        v-for="variantOption in bootstrap.variantOptions"
                        :key="variantOption.id"
                        :value="variantOption.id"
                      >
                        {{ variantOption.label }}
                      </option>
                    </select>
                    <Input v-model.number="item.quantity" type="number" min="1" placeholder="Qty" />
                    <Button variant="ghost" @click="removeBundleItem(itemIndex)">
                      Remove
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div class="flex flex-wrap gap-3">
              <Button @click="submitBundle">
                Create bundle
              </Button>
              <Button variant="outline" @click="resetBundleForm">
                Reset form
              </Button>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="categories" class="space-y-6">
        <Alert v-if="categoryNotice">
          <AlertTitle>Saved</AlertTitle>
          <AlertDescription>{{ categoryNotice }}</AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>Create Category</CardTitle>
            <CardDescription>
              Categories control merchandising lanes and hero copy, while products can belong to several at once.
            </CardDescription>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid gap-4 lg:grid-cols-2">
              <Input v-model="categoryForm.name" placeholder="Category name" />
              <Input v-model="categoryForm.slug" placeholder="Optional custom slug" />
              <Input v-model="categoryForm.heroTitle" placeholder="Hero title" />
              <Input v-model="categoryForm.icon" placeholder="Icon keyword" />
              <Input v-model="categoryForm.accentColor" placeholder="#64748b" />
              <Input v-model.number="categoryForm.sortOrder" type="number" min="0" placeholder="Sort order" />
            </div>

            <div class="space-y-2">
              <Label>Description</Label>
              <Textarea v-model="categoryForm.description" :rows="2" />
            </div>

            <div class="space-y-2">
              <Label>Hero description</Label>
              <Textarea v-model="categoryForm.heroDescription" :rows="3" />
            </div>

            <div class="flex flex-wrap gap-6">
              <label class="flex items-center gap-3 text-sm">
                <input v-model="categoryForm.isFeatured" type="checkbox" class="h-4 w-4">
                Featured
              </label>
              <label class="flex items-center gap-3 text-sm">
                <input v-model="categoryForm.isActive" type="checkbox" class="h-4 w-4">
                Active
              </label>
            </div>

            <div class="flex flex-wrap gap-3">
              <Button @click="submitCategory">
                Create category
              </Button>
              <Button variant="outline" @click="resetCategoryForm">
                Reset form
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Existing Categories</CardTitle>
          </CardHeader>
          <CardContent class="grid gap-3 xl:grid-cols-2">
            <Card
              v-for="category in bootstrap.categories"
              :key="category.id"
            >
              <CardHeader class="pb-3">
                <CardTitle class="text-base">
                  {{ category.name }}
                </CardTitle>
                <CardDescription>
                  {{ category.productCount }} linked products
                </CardDescription>
              </CardHeader>
              <CardContent class="flex items-center justify-between text-sm">
                <Badge variant="outline">
                  {{ category.slug }}
                </Badge>
                <Button variant="ghost" size="sm" @click="deleteCategory(category.id)">
                  Delete
                </Button>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
</template>
