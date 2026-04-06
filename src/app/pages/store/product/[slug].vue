<script setup lang="ts">
import { flattenSpecs, formatStoreMoney, resolveVariantForSelections, summarizeVariantSelections, type StoreProductDetail } from '@/lib/store'

const route = useRoute()
const { addItem } = useStoreCart()

const selectedOptions = reactive<Record<string, string>>({})
const addedNotice = ref('')

const { data } = useLazyFetch(`/api/store/products/${route.params.slug}`, {
  default: () => ({
    profile: null,
    viewer: null,
    product: null,
  }),
})

const product = computed(() => data.value.product as StoreProductDetail | null)

watchEffect(() => {
  if (!product.value) {
    return
  }

  const fallbackVariant = product.value.variants.find(variant => variant.isDefault && variant.isActive)
    ?? product.value.variants.find(variant => variant.isActive)
    ?? null

  for (const group of product.value.optionGroups) {
    if (selectedOptions[group.slug]) {
      continue
    }

    const matchingSelection = fallbackVariant?.selections.find(selection => selection.optionGroupSlug === group.slug)
    selectedOptions[group.slug] = matchingSelection?.optionValueSlug ?? group.values[0]?.slug ?? ''
  }
})

const activeVariant = computed(() => {
  if (!product.value) {
    return null
  }

  return resolveVariantForSelections(product.value.variants, selectedOptions)
})

const specRows = computed(() => flattenSpecs(product.value?.specs))

function addCurrentVariantToCart() {
  if (!product.value || !activeVariant.value) {
    return
  }

  addItem({
    key: `variant:${activeVariant.value.id}`,
    kind: 'variant',
    title: product.value.name,
    subtitle: summarizeVariantSelections(activeVariant.value) || activeVariant.value.name,
    slug: product.value.slug,
    unitPrice: activeVariant.value.price,
    compareAtUnitPrice: activeVariant.value.compareAtPrice,
    quantity: 1,
    accentColor: product.value.accentColor,
    itemCode: activeVariant.value.itemCode,
    variantId: activeVariant.value.id,
  })

  addedNotice.value = `${product.value.name} added to cart`

  window.setTimeout(() => {
    if (addedNotice.value) {
      addedNotice.value = ''
    }
  }, 2400)
}
</script>

<template>
  <div v-if="!product" class="mx-auto max-w-7xl space-y-8 px-6 py-10">
    <Skeleton class="h-8 w-28" />
    <section class="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <Card>
        <CardHeader class="space-y-4">
          <Skeleton class="h-72 w-full rounded-2xl" />
          <div class="flex gap-2">
            <Skeleton class="h-6 w-20" />
            <Skeleton class="h-6 w-24" />
          </div>
          <div class="space-y-2">
            <Skeleton class="h-10 w-56" />
            <Skeleton class="h-5 w-full max-w-md" />
          </div>
        </CardHeader>
      </Card>
      <Card class="h-fit">
        <CardHeader>
          <Skeleton class="h-6 w-36" />
          <Skeleton class="h-4 w-52" />
        </CardHeader>
        <CardContent class="space-y-4">
          <Skeleton class="h-9 w-full" />
          <Skeleton class="h-9 w-full" />
          <Skeleton class="h-10 w-full" />
        </CardContent>
      </Card>
    </section>
  </div>
  <div v-else class="mx-auto max-w-7xl space-y-8 px-6 py-10">
    <Button variant="ghost" size="sm" as-child>
      <NuxtLink to="/store">
        Back to store
      </NuxtLink>
    </Button>

    <section class="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <Card>
        <CardHeader class="space-y-4">
          <div
            v-if="activeVariant?.imageUrl"
            class="overflow-hidden rounded-2xl border bg-muted/20"
          >
            <img
              :src="activeVariant.imageUrl"
              :alt="activeVariant.gameName || product.name"
              class="h-72 w-full object-contain p-6"
            >
          </div>

          <div class="flex flex-wrap gap-2">
            <Badge
              v-for="category in product.categories"
              :key="category.id"
              variant="secondary"
            >
              {{ category.name }}
            </Badge>
          </div>

          <div class="space-y-2">
            <CardTitle class="text-3xl sm:text-4xl">
              {{ product.name }}
            </CardTitle>
            <CardDescription class="max-w-3xl text-base leading-7">
              {{ product.description || product.summary || product.overview }}
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent class="grid gap-4 sm:grid-cols-3">
          <div class="space-y-1">
            <p class="text-sm text-muted-foreground">Live price</p>
            <p class="text-3xl font-semibold">
              {{ formatStoreMoney(activeVariant?.price || product.pricing.min) }}
            </p>
            <p
              v-if="activeVariant?.compareAtPrice && activeVariant.compareAtPrice > activeVariant.price"
              class="text-sm text-muted-foreground line-through"
            >
              {{ formatStoreMoney(activeVariant.compareAtPrice) }}
            </p>
          </div>

          <div class="space-y-1">
            <p class="text-sm text-muted-foreground">Variant</p>
            <p class="text-lg font-medium">
              {{ summarizeVariantSelections(activeVariant) || activeVariant?.name || 'Select an option' }}
            </p>
            <p class="text-sm text-muted-foreground">
              {{ activeVariant?.itemCode || 'Variant item code appears here.' }}
            </p>
          </div>

          <div class="space-y-1">
            <p class="text-sm text-muted-foreground">Wallet</p>
            <p class="text-lg font-medium">
              {{ formatStoreMoney(data.viewer?.walletBalance) }}
            </p>
            <p class="text-sm text-muted-foreground">
              {{ data.viewer?.isOnline ? 'Player is online' : 'Player link or online status can be used for delivery flows.' }}
            </p>
          </div>
        </CardContent>
      </Card>

      <Card class="h-fit">
        <CardHeader>
          <CardTitle>Configure product</CardTitle>
          <CardDescription>Select the option set you want to add to the cart.</CardDescription>
        </CardHeader>

        <CardContent class="space-y-6">
          <div v-for="group in product.optionGroups" :key="group.id" class="space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <Label class="font-medium">{{ group.name }}</Label>
              <Badge variant="outline">
                {{ group.displayType === 'COLOR' ? 'Color option' : 'Variant option' }}
              </Badge>
            </div>

            <div class="flex flex-wrap gap-2">
              <Button
                v-for="value in group.values"
                :key="value.id"
                type="button"
                size="sm"
                :variant="selectedOptions[group.slug] === value.slug ? 'secondary' : 'outline'"
                @click="selectedOptions[group.slug] = value.slug"
              >
                {{ value.label }}
              </Button>
            </div>
          </div>

          <Card class="shadow-none">
            <CardHeader class="p-4">
              <CardDescription>Selected variant</CardDescription>
              <CardTitle class="text-lg">
                {{ activeVariant?.name || 'Unavailable combination' }}
              </CardTitle>
            </CardHeader>
            <CardContent class="space-y-1 p-4 pt-0 text-sm text-muted-foreground">
              <p>Item code: {{ activeVariant?.itemCode || 'No valid item code for this combination yet.' }}</p>
              <p v-if="activeVariant?.gameCategory">Game category: {{ activeVariant.gameCategory }}</p>
              <p v-if="typeof activeVariant?.weight === 'number'">Weight: {{ activeVariant.weight }}</p>
              <p>Gives {{ activeVariant?.quantity || 0 }} in-game item{{ activeVariant?.quantity === 1 ? '' : 's' }} per purchase.</p>
            </CardContent>
          </Card>

          <Button
            class="w-full"
            :disabled="!activeVariant || activeVariant.stock === 0"
            @click="addCurrentVariantToCart"
          >
            {{ activeVariant?.stock === 0 ? 'Out of stock' : 'Add to cart' }}
          </Button>

          <Alert v-if="addedNotice">
            <AlertDescription>{{ addedNotice }}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </section>

    <section class="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>
            Balance notes, flavor text, and long-form product context.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <p class="text-sm leading-7 text-muted-foreground">
            {{ product.overview || product.description || 'Use the product overview area for extracted wiki copy, handling notes, balance context, or faction flavor.' }}
          </p>

          <div
            v-if="Array.isArray(product.featureBullets) && product.featureBullets.length"
            class="grid gap-3"
          >
            <Card
              v-for="(feature, index) in product.featureBullets"
              :key="`${feature}-${index}`"
              class="shadow-none"
            >
              <CardContent class="p-4 text-sm">
                {{ String(feature) }}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Technical specs</CardTitle>
          <CardDescription>Structured stats and extracted specification rows.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div v-if="specRows.length" class="space-y-4">
            <div
              v-for="row in specRows"
              :key="`${row.group || 'general'}-${row.label}`"
              class="flex flex-col gap-1 border-b pb-4 last:border-b-0 last:pb-0"
            >
              <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {{ row.group || 'General' }}
              </p>
              <p class="text-sm font-medium">
                {{ row.label }}
              </p>
              <p class="text-sm text-muted-foreground">
                {{ row.value }}
              </p>
            </div>
          </div>

          <p v-else class="text-sm leading-7 text-muted-foreground">
            This product is ready for future wiki enrichment, including ammo types, magazine compatibility, or material stats.
          </p>
        </CardContent>
      </Card>
    </section>

    <section
      v-if="product.recommendations.length"
      class="space-y-6"
    >
      <div class="space-y-1">
        <h2 class="text-2xl font-semibold">
          Recommended add-ons
        </h2>
        <p class="text-sm text-muted-foreground">
          Pair this item with the rest of the loadout.
        </p>
      </div>

      <div class="grid gap-5 xl:grid-cols-3">
        <StoreProductCard
          v-for="recommendation in product.recommendations"
          :key="recommendation.id"
          :product="recommendation.product"
        />
      </div>
    </section>
  </div>
</template>
