<script setup lang="ts">
import type { StoreCategorySummary, StoreProductDetail, StoreBundleSummary } from '@/lib/store'
import { toast } from 'vue-sonner'
import { ArrowLeft } from 'lucide-vue-next'

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

function toggleSelection(collection: string[], id: string) {
  return collection.includes(id)
    ? collection.filter(value => value !== id)
    : [...collection, id]
}

function addOptionGroup() {
  form.optionGroups.push({
    name: '', slug: '', displayType: 'TEXT',
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
  if (group && group.values.length > 1) group.values.splice(valueIndex, 1)
}

function addVariant() {
  const firstGroup = form.optionGroups[0]
  const firstGroupSlug = firstGroup ? groupKey(firstGroup, 0) : ''
  const firstValue = firstGroup?.values[0]

  form.variants.push({
    name: '', sku: '', itemCode: '', gameName: '', gameCategory: '', price: 0,
    compareAtPrice: undefined, quantity: 1, stock: undefined, weight: undefined,
    badge: '', imageUrl: '', metadata: null, isDefault: false, isActive: true,
    selections: firstGroupSlug && firstValue ? { [firstGroupSlug]: optionValueKey(firstValue, 0) } : {},
  })
}

function removeVariant(index: number) {
  if (form.variants.length > 1) form.variants.splice(index, 1)
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
          Edit product
        </h1>
        <p class="text-sm text-muted-foreground text-balance">
          Update the product details, variants, and merchandising options.
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
            <Input id="product-name" v-model="form.name" required placeholder="Military Kneepads" />
          </div>
          <div class="grid gap-2">
            <Label for="product-slug">Slug</Label>
            <Input id="product-slug" v-model="form.slug" placeholder="Auto-generated from name" />
            <p class="text-xs text-muted-foreground">Changing the slug may break existing links.</p>
          </div>
          <div class="grid gap-2 md:col-span-2">
            <Label for="product-summary">Summary</Label>
            <Textarea id="product-summary" v-model="form.summary" :rows="2" placeholder="Short product summary" />
          </div>
          <div class="grid gap-2 md:col-span-2">
            <Label for="product-description">Description</Label>
            <Textarea id="product-description" v-model="form.description" :rows="3" placeholder="Full product description" />
          </div>
          <div class="grid gap-2 md:col-span-2">
            <Label for="product-overview">Overview</Label>
            <Textarea id="product-overview" v-model="form.overview" :rows="4" placeholder="Detailed overview" />
          </div>
          <div class="grid gap-2">
            <Label for="product-bullets">Feature bullets</Label>
            <Textarea id="product-bullets" v-model="form.featureBulletsText" :rows="5" placeholder="One feature per line" />
            <p class="text-xs text-muted-foreground">Each line becomes a bullet point.</p>
          </div>
          <div class="grid gap-2">
            <Label for="product-specs">Specs</Label>
            <Textarea id="product-specs" v-model="form.specsText" :rows="5" placeholder="Group | Label: Value" />
            <p class="text-xs text-muted-foreground">Format: Group | Label: Value. One per line.</p>
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
            <Input id="product-badge" v-model="form.badge" placeholder="New, Hot, Limited" />
          </div>
          <div class="grid gap-2">
            <Label for="product-accent">Accent color</Label>
            <Input id="product-accent" v-model="form.accentColor" placeholder="#b45309" />
          </div>
          <div class="grid gap-2">
            <Label for="product-sort">Sort order</Label>
            <Input id="product-sort" v-model.number="form.sortOrder" type="number" min="0" />
            <p class="text-xs text-muted-foreground">Lower values appear first.</p>
          </div>
        </div>

        <FieldSet>
          <FieldLegend>Visibility</FieldLegend>
          <FieldLabel for="product-featured">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Featured product</FieldTitle>
                <FieldDescription>Show in the featured section on the storefront.</FieldDescription>
              </FieldContent>
              <Checkbox id="product-featured" :checked="form.isFeatured" @update:checked="form.isFeatured = $event" />
            </Field>
          </FieldLabel>
          <FieldLabel for="product-active">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Active in store</FieldTitle>
                <FieldDescription>Only active products are visible to customers.</FieldDescription>
              </FieldContent>
              <Checkbox id="product-active" :checked="form.isActive" @update:checked="form.isActive = $event" />
            </Field>
          </FieldLabel>
        </FieldSet>

        <div class="grid gap-5 md:grid-cols-2">
          <div class="grid gap-2">
            <Label>Categories</Label>
            <div class="grid max-h-48 gap-1 overflow-y-auto rounded-lg border p-3">
              <FieldLabel v-for="category in bootstrap.categories" :key="category.id" :for="`cat-${category.id}`">
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle class="text-sm font-normal">{{ category.name }}</FieldTitle>
                  </FieldContent>
                  <Checkbox :id="`cat-${category.id}`" :checked="form.categoryIds.includes(category.id)" @update:checked="form.categoryIds = toggleSelection(form.categoryIds, category.id)" />
                </Field>
              </FieldLabel>
              <p v-if="!bootstrap.categories.length" class="py-2 text-center text-xs text-muted-foreground">No categories yet.</p>
            </div>
          </div>
          <div class="grid gap-2">
            <Label>Recommended add-ons</Label>
            <div class="grid max-h-48 gap-1 overflow-y-auto rounded-lg border p-3">
              <FieldLabel v-for="rec in bootstrap.recommendationOptions.filter(r => r.id !== productId)" :key="rec.id" :for="`rec-${rec.id}`">
                <Field orientation="horizontal">
                  <FieldContent>
                    <FieldTitle class="text-sm font-normal">{{ rec.name }}</FieldTitle>
                  </FieldContent>
                  <Checkbox :id="`rec-${rec.id}`" :checked="form.recommendationProductIds.includes(rec.id)" @update:checked="form.recommendationProductIds = toggleSelection(form.recommendationProductIds, rec.id)" />
                </Field>
              </FieldLabel>
              <p v-if="!bootstrap.recommendationOptions.length" class="py-2 text-center text-xs text-muted-foreground">No other products yet.</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Option Groups Section -->
      <section class="grid gap-6 rounded-xl border border-border/70 bg-card/80 p-6 shadow-xs md:p-7">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1">
            <h2 class="text-base font-semibold">Option groups</h2>
            <p class="text-sm text-muted-foreground">Variant axes like side, color, or finish.</p>
          </div>
          <Button variant="outline" size="sm" type="button" @click="addOptionGroup">
            Add group
          </Button>
        </div>

        <div v-if="form.optionGroups.length" class="grid gap-4">
          <Card v-for="(group, groupIndex) in form.optionGroups" :key="`group-${groupIndex}`">
            <CardHeader class="pb-4">
              <div class="flex items-center justify-between gap-3">
                <CardTitle class="text-sm font-medium">Option group {{ groupIndex + 1 }}</CardTitle>
                <Button variant="ghost" size="sm" type="button" @click="removeOptionGroup(groupIndex)">Remove</Button>
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
                  <select :id="`group-display-${groupIndex}`" v-model="group.displayType" class="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option value="TEXT">Text</option>
                    <option value="COLOR">Color</option>
                  </select>
                </div>
              </div>
              <div class="space-y-2">
                <div v-for="(value, valueIndex) in group.values" :key="`value-${valueIndex}`" class="grid gap-3 md:grid-cols-[1fr_1fr_160px_auto]">
                  <Input v-model="value.label" :placeholder="`Value ${valueIndex + 1}`" />
                  <Input v-model="value.slug" placeholder="Auto-generated" />
                  <Input v-model="value.colorHex" placeholder="#94a3b8" />
                  <Button variant="ghost" size="sm" type="button" @click="removeOptionValue(groupIndex, valueIndex)">Remove</Button>
                </div>
              </div>
              <Button variant="outline" size="sm" type="button" @click="addOptionValue(groupIndex)">Add value</Button>
            </CardContent>
          </Card>
        </div>
        <p v-else class="text-sm text-muted-foreground">No option groups defined.</p>
      </section>

      <!-- Variants Section -->
      <section class="grid gap-6 rounded-xl border border-border/70 bg-card/80 p-6 shadow-xs md:p-7">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1">
            <h2 class="text-base font-semibold">Variants</h2>
            <p class="text-sm text-muted-foreground">Each variant maps to a Project Zomboid item code.</p>
          </div>
          <Button variant="outline" size="sm" type="button" @click="addVariant">Add variant</Button>
        </div>

        <div class="grid gap-4">
          <Card v-for="(variant, variantIndex) in form.variants" :key="`variant-${variantIndex}`">
            <CardHeader class="pb-4">
              <div class="flex items-center justify-between gap-3">
                <CardTitle class="text-sm font-medium">Variant {{ variantIndex + 1 }}</CardTitle>
                <Button v-if="form.variants.length > 1" variant="ghost" size="sm" type="button" @click="removeVariant(variantIndex)">Remove</Button>
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
                  <p class="text-xs text-muted-foreground">Full Project Zomboid item type.</p>
                </div>
                <div class="grid gap-2">
                  <Label :for="`variant-gamename-${variantIndex}`">Game name</Label>
                  <Input :id="`variant-gamename-${variantIndex}`" v-model="variant.gameName" placeholder="In-game display name" />
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
                  <img v-if="variant.imageUrl" :src="variant.imageUrl" :alt="variant.gameName || variant.name || 'Preview'" class="size-full object-contain">
                  <span v-else class="text-xs text-muted-foreground">No image</span>
                </div>
              </div>
              <FieldSet>
                <div class="grid gap-3 md:grid-cols-2">
                  <FieldLabel :for="`variant-default-${variantIndex}`">
                    <Field orientation="horizontal">
                      <FieldContent><FieldTitle>Default variant</FieldTitle></FieldContent>
                      <Checkbox :id="`variant-default-${variantIndex}`" :checked="variant.isDefault" @update:checked="variant.isDefault = $event" />
                    </Field>
                  </FieldLabel>
                  <FieldLabel :for="`variant-active-${variantIndex}`">
                    <Field orientation="horizontal">
                      <FieldContent><FieldTitle>Active</FieldTitle></FieldContent>
                      <Checkbox :id="`variant-active-${variantIndex}`" :checked="variant.isActive" @update:checked="variant.isActive = $event" />
                    </Field>
                  </FieldLabel>
                </div>
              </FieldSet>
              <div v-if="form.optionGroups.length" class="grid gap-4 md:grid-cols-3">
                <div v-for="(group, gIdx) in form.optionGroups" :key="`variant-${variantIndex}-group-${gIdx}`" class="grid gap-2">
                  <Label>{{ group.name || `Option ${gIdx + 1}` }}</Label>
                  <select v-model="variant.selections[groupKey(group, gIdx)]" class="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2">
                    <option v-for="(val, vIdx) in group.values" :key="`opt-${vIdx}`" :value="optionValueKey(val, vIdx)">
                      {{ val.label || `Value ${vIdx + 1}` }}
                    </option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      <!-- Error + Submit -->
      <Alert v-if="error" variant="destructive">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div class="grid gap-2">
        <Button type="submit" class="w-full" :disabled="loading">
          {{ loading ? 'Saving…' : 'Save changes' }}
        </Button>
        <p class="text-center text-xs text-muted-foreground">
          Changes are applied immediately to the storefront.
        </p>
      </div>
    </form>
  </div>
</template>
