<script setup lang="ts">
import type { StoreCategorySummary, StoreProductDetail, StoreBundleSummary } from '@/lib/store'
import { toast } from 'vue-sonner'
import { ArrowLeft } from 'lucide-vue-next'

type CheckboxState = boolean | 'indeterminate'

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
const productId = route.params.productId as string

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

interface ProductGetResponse {
  product: {
    name: string
    slug: string
    summary: string | null
    description: string | null
    overview: string | null
    badge: string | null
    accentColor: string
    featureBullets: unknown[]
    specs: unknown
    isFeatured: boolean
    isActive: boolean
    sortOrder: number
    categories: Array<{ categoryId?: string, category?: { id: string } }>
    recommendationsFrom: Array<{ targetProduct?: { id: string }, targetProductId?: string }>
    optionGroups: Array<{
      name: string
      slug: string
      displayType: string
      values: Array<{ label: string, slug: string, colorHex: string | null }>
    }>
    variants: Array<{
      name: string
      sku: string
      itemCode: string
      gameName: string | null
      gameCategory: string | null
      price: number
      compareAtPrice: number | null
      quantity: number
      stock: number | null
      weight: number | null
      badge: string | null
      imageUrl: string | null
      metadata: Record<string, unknown> | null
      isDefault: boolean
      isActive: boolean
      selections: Array<{ optionValue?: { slug: string, optionGroup?: { slug: string } } }>
    }>
  }
}

const { data: productData, error: fetchError } = await useFetch<ProductGetResponse>(
  `/api/store/admin/products/${productId}`,
)

if (fetchError.value) {
  throw createError({ statusCode: 404, statusMessage: 'Product not found' })
}

const loading = ref(false)
const error = ref('')

function flattenSpecs(specs: unknown) {
  if (!Array.isArray(specs)) return ''
  return specs
    .filter((row: unknown) => !!row && typeof row === 'object' && 'label' in row && 'value' in row)
    .map((row) => {
      const r = row as { group?: string, label: string, value: string }
      return `${r.group || 'General'} | ${r.label}: ${r.value}`
    })
    .join('\n')
}

function flattenBullets(bullets: unknown) {
  if (!Array.isArray(bullets)) return ''
  return bullets.filter((b: unknown) => typeof b === 'string').join('\n')
}

const product = productData.value!.product

const form = reactive({
  name: product.name || '',
  slug: product.slug || '',
  summary: product.summary || '',
  description: product.description || '',
  overview: product.overview || '',
  badge: product.badge || '',
  accentColor: product.accentColor || '#b45309',
  featureBulletsText: flattenBullets(product.featureBullets),
  specsText: flattenSpecs(product.specs),
  categoryIds: (product.categories || []).map((c: { categoryId?: string, category?: { id: string } }) => c.categoryId || c.category?.id).filter(Boolean) as string[],
  recommendationProductIds: (product.recommendationsFrom || []).map((r: { targetProduct?: { id: string }, targetProductId?: string }) => r.targetProduct?.id || r.targetProductId).filter(Boolean) as string[],
  isFeatured: product.isFeatured ?? false,
  isActive: product.isActive ?? true,
  sortOrder: product.sortOrder ?? 0,
  optionGroups: (product.optionGroups || []).map((g: ProductGetResponse['product']['optionGroups'][number]) => ({
    name: g.name || '',
    slug: g.slug || '',
    displayType: (g.displayType || 'TEXT') as 'TEXT' | 'COLOR',
    values: (g.values || []).map((v: { label: string, slug: string, colorHex: string | null }) => ({
      label: v.label || '',
      slug: v.slug || '',
      colorHex: v.colorHex || '',
    })),
  })),
  variants: (product.variants || []).map((v: ProductGetResponse['product']['variants'][number]) => ({
    name: v.name || '',
    sku: v.sku || '',
    itemCode: v.itemCode || '',
    gameName: v.gameName || '',
    gameCategory: v.gameCategory || '',
    price: v.price ?? 0,
    compareAtPrice: v.compareAtPrice ?? undefined as number | undefined,
    quantity: v.quantity ?? 1,
    stock: v.stock ?? undefined as number | undefined,
    weight: v.weight ?? undefined as number | undefined,
    badge: v.badge || '',
    imageUrl: v.imageUrl || '',
    metadata: v.metadata || null as Record<string, unknown> | null,
    isDefault: v.isDefault ?? false,
    isActive: v.isActive ?? true,
    selections: buildSelectionsMap(v.selections || []),
  })),
})

// If no variants loaded, add a blank one
if (form.variants.length === 0) {
  form.variants.push({
    name: '', sku: '', itemCode: '', gameName: '', gameCategory: '', price: 0,
    compareAtPrice: undefined, quantity: 1, stock: undefined, weight: undefined,
    badge: '', imageUrl: '', metadata: null, isDefault: true, isActive: true, selections: {},
  })
}

function buildSelectionsMap(selections: Array<{ optionValue?: { slug: string, optionGroup?: { slug: string } } }>): Record<string, string> {
  const map: Record<string, string> = {}
  for (const sel of selections) {
    const groupSlug = sel.optionValue?.optionGroup?.slug
    const valueSlug = sel.optionValue?.slug
    if (groupSlug && valueSlug) {
      map[groupSlug] = valueSlug
    }
  }
  return map
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

function toBooleanState(value: CheckboxState) {
  return value === true
}

function normalizeOptionalText(value: string) {
  const trimmed = value.trim()
  return trimmed ? trimmed : null
}

function buildProductSavePayload() {
  return {
    name: form.name.trim(),
    slug: form.slug.trim(),
    summary: normalizeOptionalText(form.summary),
    description: normalizeOptionalText(form.description),
    overview: normalizeOptionalText(form.overview),
    badge: normalizeOptionalText(form.badge),
    accentColor: normalizeOptionalText(form.accentColor),
    categoryIds: [...form.categoryIds],
    recommendationProductIds: [...form.recommendationProductIds],
    isFeatured: form.isFeatured,
    isActive: form.isActive,
    sortOrder: form.sortOrder,
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
        colorHex: normalizeOptionalText(value.colorHex) ?? undefined,
        sortOrder: valueIndex,
      })),
    })),
    variants: form.variants.map((variant, variantIndex) => ({
      name: variant.name.trim(),
      sku: variant.sku.trim(),
      itemCode: variant.itemCode.trim(),
      gameName: normalizeOptionalText(variant.gameName) ?? undefined,
      gameCategory: normalizeOptionalText(variant.gameCategory) ?? undefined,
      price: variant.price,
      compareAtPrice: typeof variant.compareAtPrice === 'number' ? variant.compareAtPrice : null,
      quantity: variant.quantity,
      stock: typeof variant.stock === 'number' ? variant.stock : null,
      weight: typeof variant.weight === 'number' ? variant.weight : null,
      badge: normalizeOptionalText(variant.badge) ?? undefined,
      imageUrl: normalizeOptionalText(variant.imageUrl) ?? undefined,
      metadata: variant.metadata ?? null,
      isDefault: variant.isDefault,
      isActive: variant.isActive,
      selections: { ...variant.selections },
      sortOrder: variantIndex,
    })),
  }
}

function buildProductExport() {
  return {
    format: 'store-product-config-v1',
    exportedAt: new Date().toISOString(),
    productId,
    product: buildProductSavePayload(),
  }
}

function buildExportFileName() {
  const baseName = (form.slug || form.name || productId)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return `${baseName || productId}-config.json`
}

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  }
  catch {
    const textarea = document.createElement('textarea')
    textarea.value = text
    textarea.style.position = 'fixed'
    textarea.style.opacity = '0'
    document.body.appendChild(textarea)
    textarea.select()
    const copied = document.execCommand('copy')
    document.body.removeChild(textarea)
    return copied
  }
}

function downloadExport(text: string) {
  const blob = new Blob([text], { type: 'application/json;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = buildExportFileName()
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

async function handleExport() {
  const exportText = JSON.stringify(buildProductExport(), null, 2)
  const copied = await copyText(exportText)

  if (copied) {
    toast.success('Product config copied to clipboard.')
    return
  }

  downloadExport(exportText)
  toast.success(`Product config downloaded as ${buildExportFileName()}.`)
}

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
    await $fetch(`/api/store/admin/products/${productId}`, {
      method: 'PATCH',
      body: buildProductSavePayload(),
    })

    toast.success('Product updated.')
    await router.push('/admin/store')
  }
  catch (e: unknown) {
    error.value = (e as { data?: { message?: string } })?.data?.message || 'Failed to update product.'
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
              {{ form.name || 'Edit product' }}
            </h1>
          </div>
          <div class="flex shrink-0 items-center gap-2">
            <Button type="button" variant="outline" size="sm" @click="handleExport">
              Export JSON
            </Button>
            <Button type="submit" size="sm" :disabled="loading">
              {{ loading ? 'Saving…' : 'Save changes' }}
            </Button>
          </div>
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
              <Checkbox :checked="form.isActive" @update:checked="form.isActive = toBooleanState($event)" />
              Active
            </label>
            <label class="flex items-center gap-2 whitespace-nowrap text-sm">
              <Checkbox :checked="form.isFeatured" @update:checked="form.isFeatured = toBooleanState($event)" />
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
            :recommendation-options="bootstrap.recommendationOptions.filter(r => r.id !== productId)"
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
