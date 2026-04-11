<script setup lang="ts">
import type { StoreCategorySummary, StoreProductDetail, StoreBundleSummary } from '@/lib/store'
import { formatStoreMoney } from '@/lib/store'
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
const bundleId = route.params.bundleId as string

const bootstrapDefault: AdminStoreBootstrap = {
  profile: null,
  catalog: { source: 'telemetry', total: 0 },
  categories: [],
  products: [],
  bundles: [],
  recommendationOptions: [],
  variantOptions: [],
}

interface BundleGetResponse {
  bundle: {
    name: string
    slug: string
    summary: string | null
    description: string | null
    badge: string | null
    accentColor: string | null
    price: number
    compareAtPrice: number | null
    isFeatured: boolean
    isActive: boolean
    sortOrder: number
    metadata: Record<string, unknown> | null
    items: Array<{ variantId: string, quantity: number, variant?: { id: string } }>
  }
}

const [{ data: bootstrap }, { data: bundleData, error: fetchError }] = await Promise.all([
  useFetch<AdminStoreBootstrap>('/api/store/admin/bootstrap', { default: () => bootstrapDefault }),
  useFetch<BundleGetResponse>(`/api/store/admin/bundles/${bundleId}`),
])

if (fetchError.value || !bundleData.value?.bundle) {
  throw createError({ statusCode: 404, statusMessage: 'Bundle not found' })
}

const bundle = bundleData.value.bundle
const meta = (bundle.metadata && typeof bundle.metadata === 'object' && !Array.isArray(bundle.metadata))
  ? bundle.metadata as Record<string, unknown>
  : {}

const loading = ref(false)
const error = ref('')

const form = reactive({
  name: bundle.name || '',
  slug: bundle.slug || '',
  summary: bundle.summary || '',
  description: bundle.description || '',
  badge: bundle.badge || '',
  accentColor: bundle.accentColor || '#0f766e',
  pricingMode: (meta.pricingMode as string) === 'manual' ? 'manual' as const : 'discount' as const,
  discountPercent: typeof meta.discountPercent === 'number' ? meta.discountPercent : 10,
  price: bundle.price as number | undefined,
  compareAtPrice: bundle.compareAtPrice as number | undefined,
  isFeatured: bundle.isFeatured ?? false,
  isActive: bundle.isActive ?? true,
  sortOrder: bundle.sortOrder ?? 0,
  items: (bundle.items && bundle.items.length > 0)
    ? bundle.items.map((item: { variantId: string, quantity: number, variant?: { id: string } }) => ({
        variantId: item.variantId || item.variant?.id || '',
        quantity: item.quantity ?? 1,
      }))
    : [{ variantId: '', quantity: 1 }],
})

function addBundleItem() {
  form.items.push({ variantId: '', quantity: 1 })
}

function removeBundleItem(index: number) {
  if (form.items.length > 1) {
    form.items.splice(index, 1)
  }
}

async function handleSubmit() {
  error.value = ''

  if (!form.name.trim()) {
    error.value = 'Bundle name is required.'
    return
  }

  if (!form.items.some((item: { variantId: string }) => item.variantId)) {
    error.value = 'Add at least one variant to the bundle.'
    return
  }

  loading.value = true

  try {
    await $fetch(`/api/store/admin/bundles/${bundleId}`, {
      method: 'PATCH',
      body: {
        ...form,
        items: form.items
          .filter((item: { variantId: string }) => item.variantId)
          .map((item: { variantId: string, quantity: number }, index: number) => ({ ...item, sortOrder: index })),
      },
    })

    toast.success('Bundle updated.')
    await router.push('/admin/store/bundles')
  }
  catch (e: unknown) {
    error.value = (e as { data?: { message?: string } })?.data?.message || 'Failed to update bundle.'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-6 py-4 md:gap-8 md:py-6">
    <div class="flex items-center gap-4 px-4 lg:px-6">
      <Button variant="ghost" size="sm" as-child>
        <NuxtLink to="/admin/store/bundles">
          <ArrowLeft class="size-4" />
          Back
        </NuxtLink>
      </Button>
    </div>

    <form class="flex flex-col gap-6 px-4 lg:px-6" @submit.prevent="handleSubmit">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-semibold tracking-tight">
          Edit bundle
        </h1>
        <p class="text-sm text-muted-foreground text-balance">
          Update this bundle's details, pricing, and included items.
        </p>
      </div>

      <!-- Bundle Details Section -->
      <section class="grid gap-6 rounded-xl border border-border/70 bg-card/80 p-6 shadow-xs md:p-7">
        <div class="space-y-1">
          <h2 class="text-base font-semibold">
            Bundle details
          </h2>
          <p class="text-sm text-muted-foreground">
            Name, description, and display settings.
          </p>
        </div>

        <div class="grid gap-5 md:grid-cols-2">
          <div class="grid gap-2">
            <Label for="bundle-name">Bundle name</Label>
            <Input
              id="bundle-name"
              v-model="form.name"
              required
              placeholder="Tactical Starter Kit"
            />
          </div>

          <div class="grid gap-2">
            <Label for="bundle-slug">Slug</Label>
            <Input
              id="bundle-slug"
              v-model="form.slug"
              placeholder="Auto-generated from name"
            />
            <p class="text-xs text-muted-foreground">
              Leave blank to generate automatically.
            </p>
          </div>

          <div class="grid gap-2 md:col-span-2">
            <Label for="bundle-summary">Summary</Label>
            <Textarea
              id="bundle-summary"
              v-model="form.summary"
              :rows="2"
              placeholder="Short description shown on the bundle card"
            />
          </div>

          <div class="grid gap-2 md:col-span-2">
            <Label for="bundle-description">Description</Label>
            <Textarea
              id="bundle-description"
              v-model="form.description"
              :rows="3"
              placeholder="Full bundle description"
            />
          </div>

          <div class="grid gap-2">
            <Label for="bundle-badge">Badge</Label>
            <Input
              id="bundle-badge"
              v-model="form.badge"
              placeholder="Best Value, New"
            />
          </div>

          <div class="grid gap-2">
            <Label for="bundle-accent">Accent color</Label>
            <Input
              id="bundle-accent"
              v-model="form.accentColor"
              placeholder="#0f766e"
            />
          </div>

          <div class="grid gap-2">
            <Label for="bundle-sort">Sort order</Label>
            <NumericInput
              id="bundle-sort"
              v-model="form.sortOrder"
              min="0"
            />
            <p class="text-xs text-muted-foreground">
              Lower values appear first.
            </p>
          </div>
        </div>

        <FieldSet>
          <FieldLegend>Visibility</FieldLegend>
          <FieldLabel for="bundle-featured">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Featured bundle</FieldTitle>
                <FieldDescription>
                  Show in the featured bundles section on the storefront.
                </FieldDescription>
              </FieldContent>
              <Checkbox
                id="bundle-featured"
                :checked="form.isFeatured"
                @update:checked="form.isFeatured = $event"
              />
            </Field>
          </FieldLabel>
          <FieldLabel for="bundle-active">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Active in store</FieldTitle>
                <FieldDescription>
                  Only active bundles are visible to customers.
                </FieldDescription>
              </FieldContent>
              <Checkbox
                id="bundle-active"
                :checked="form.isActive"
                @update:checked="form.isActive = $event"
              />
            </Field>
          </FieldLabel>
        </FieldSet>
      </section>

      <!-- Pricing Section -->
      <section class="grid gap-6 rounded-xl border border-border/70 bg-card/80 p-6 shadow-xs md:p-7">
        <div class="space-y-1">
          <h2 class="text-base font-semibold">
            Pricing
          </h2>
          <p class="text-sm text-muted-foreground">
            Set the bundle price based on a discount percentage or a fixed amount.
          </p>
        </div>

        <div class="grid gap-5 md:grid-cols-2">
          <FieldSet>
            <FieldLegend>Pricing mode</FieldLegend>
            <FieldLabel for="pricing-discount">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Discount pricing</FieldTitle>
                  <FieldDescription>
                    Calculate the bundle price from the item totals minus a discount percentage.
                  </FieldDescription>
                </FieldContent>
                <input
                  id="pricing-discount"
                  v-model="form.pricingMode"
                  type="radio"
                  value="discount"
                  class="h-4 w-4"
                >
              </Field>
            </FieldLabel>
            <FieldLabel for="pricing-manual">
              <Field orientation="horizontal">
                <FieldContent>
                  <FieldTitle>Manual pricing</FieldTitle>
                  <FieldDescription>
                    Set a fixed price for the bundle regardless of item totals.
                  </FieldDescription>
                </FieldContent>
                <input
                  id="pricing-manual"
                  v-model="form.pricingMode"
                  type="radio"
                  value="manual"
                  class="h-4 w-4"
                >
              </Field>
            </FieldLabel>
          </FieldSet>

          <div class="grid gap-5">
            <div class="grid gap-2">
              <Label for="bundle-discount">Discount percent</Label>
              <NumericInput
                id="bundle-discount"
                v-model="form.discountPercent"
                min="0"
                max="100"
                :disabled="form.pricingMode === 'manual'"
              />
              <p class="text-xs text-muted-foreground">
                Applied when using discount pricing mode.
              </p>
            </div>

            <div class="grid gap-2">
              <Label for="bundle-price">Manual price</Label>
              <NumericInput
                id="bundle-price"
                v-model="form.price"
                min="0"
                :disabled="form.pricingMode === 'discount'"
                :empty-value="undefined"
              />
            </div>

            <div class="grid gap-2">
              <Label for="bundle-compare">Compare-at price</Label>
              <NumericInput
                id="bundle-compare"
                v-model="form.compareAtPrice"
                min="0"
                :empty-value="undefined"
              />
              <p class="text-xs text-muted-foreground">
                Shown as a strike-through price. Auto-calculated from items if blank.
              </p>
            </div>
          </div>
        </div>
      </section>

      <!-- Bundle Items Section -->
      <section class="grid gap-6 rounded-xl border border-border/70 bg-card/80 p-6 shadow-xs md:p-7">
        <div class="flex items-start justify-between gap-4">
          <div class="space-y-1">
            <h2 class="text-base font-semibold">
              Bundle items
            </h2>
            <p class="text-sm text-muted-foreground">
              Select product variants to include and set the quantity of each.
            </p>
          </div>
          <Button variant="outline" size="sm" type="button" @click="addBundleItem">
            Add item
          </Button>
        </div>

        <div class="grid gap-4">
          <div
            v-for="(item, itemIndex) in form.items"
            :key="`bundle-item-${itemIndex}`"
            class="grid gap-4 rounded-lg bg-muted/10 p-4 md:grid-cols-[1fr_120px_auto]"
          >
              <div class="grid gap-2">
                <Label :for="`item-variant-${itemIndex}`">Variant</Label>
                <Select v-model="item.variantId">
                  <SelectTrigger :id="`item-variant-${itemIndex}`">
                    <SelectValue placeholder="Select variant…" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem
                      v-for="variantOption in bootstrap.variantOptions"
                      :key="variantOption.id"
                      :value="variantOption.id"
                    >
                      {{ variantOption.label }} — {{ formatStoreMoney(variantOption.price) }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div class="grid gap-2">
                <Label :for="`item-qty-${itemIndex}`">Qty</Label>
                <NumericInput
                  :id="`item-qty-${itemIndex}`"
                  v-model="item.quantity"
                  min="1"
                />
              </div>
              <div class="flex items-end">
                <Button
                  v-if="form.items.length > 1"
                  variant="ghost"
                  size="sm"
                  type="button"
                  @click="removeBundleItem(itemIndex)"
                >
                  Remove
                </Button>
              </div>
          </div>
        </div>

        <p v-if="!bootstrap.variantOptions.length" class="text-sm text-muted-foreground">
          No variants available. Create a product with variants first.
        </p>
      </section>

      <Alert v-if="error" variant="destructive">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div class="grid gap-2">
        <Button type="submit" class="w-full" :disabled="loading">
          {{ loading ? 'Saving…' : 'Save changes' }}
        </Button>
      </div>
    </form>
  </div>
</template>
