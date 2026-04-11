<script setup lang="ts">
import { formatStoreMoney, type StoreBundleSummary, type StoreCategorySummary, type StoreProductSummary } from '@/lib/store'

const search = ref('')

const { data, pending, refresh } = useLazyFetch('/api/store', {
  default: () => ({
    profile: null,
    viewer: null,
    categories: [],
    featuredProducts: [],
    products: [],
    featuredBundles: [],
    bundles: [],
  }),
})

const categories = computed(() => data.value.categories as StoreCategorySummary[])
const products = computed(() => data.value.products as StoreProductSummary[])
const featuredProducts = computed(() => data.value.featuredProducts as StoreProductSummary[])
const featuredBundles = computed(() => data.value.featuredBundles as StoreBundleSummary[])

const filteredProducts = computed(() => {
  const query = search.value.trim().toLowerCase()
  if (!query) {
    return products.value
  }

  return products.value.filter((product) => {
    return product.name.toLowerCase().includes(query)
      || (product.summary || '').toLowerCase().includes(query)
      || product.categories.some(category => category.name.toLowerCase().includes(query))
      || (product.defaultVariant?.itemCode || '').toLowerCase().includes(query)
  })
})
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-10 px-6 py-10">
    <!-- Loading skeleton -->
    <template v-if="pending && !data?.products?.length">
      <section class="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Card>
          <CardHeader class="space-y-4">
            <div class="flex gap-2">
              <Skeleton class="h-6 w-28" />
              <Skeleton class="h-6 w-20" />
            </div>
            <div class="space-y-2">
              <Skeleton class="h-9 w-56" />
              <Skeleton class="h-5 w-full max-w-md" />
              <Skeleton class="h-5 w-full max-w-sm" />
            </div>
          </CardHeader>
          <CardFooter class="gap-2">
            <Skeleton class="h-9 w-36" />
            <Skeleton class="h-9 w-28" />
          </CardFooter>
        </Card>
        <div class="grid gap-4 sm:grid-cols-2">
          <Card v-for="i in 4" :key="i">
            <CardHeader class="space-y-1">
              <Skeleton class="h-4 w-20" />
              <Skeleton class="h-9 w-16" />
            </CardHeader>
            <CardContent>
              <Skeleton class="h-4 w-full" />
            </CardContent>
          </Card>
        </div>
      </section>

      <section class="space-y-6">
        <div class="space-y-2">
          <Skeleton class="h-7 w-48" />
          <Skeleton class="h-4 w-72" />
        </div>
        <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Card v-for="i in 4" :key="i">
            <CardHeader class="space-y-3">
              <Skeleton class="h-6 w-24" />
              <Skeleton class="h-6 w-32" />
              <Skeleton class="h-4 w-full" />
            </CardHeader>
          </Card>
        </div>
      </section>

      <section class="space-y-6">
        <div class="space-y-2">
          <Skeleton class="h-7 w-32" />
          <Skeleton class="h-4 w-64" />
        </div>
        <div class="grid gap-5 xl:grid-cols-3">
          <Card v-for="i in 6" :key="i">
            <CardHeader>
              <Skeleton class="h-40 w-full rounded-md" />
              <Skeleton class="mt-3 h-5 w-36" />
              <Skeleton class="h-4 w-full" />
            </CardHeader>
          </Card>
        </div>
      </section>
    </template>

    <!-- Loaded content -->
    <template v-else>
    <section class="grid gap-6 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader class="space-y-4">
          <div class="flex flex-wrap gap-2">
            <Badge variant="outline">
              {{ data.profile?.name || 'Active profile' }}
            </Badge>
            <Badge v-if="data.viewer?.username" variant="secondary">
              {{ data.viewer.username }}
            </Badge>
          </div>

          <div class="space-y-2">
            <CardTitle class="text-3xl tracking-tight">
              Survivor Supply
            </CardTitle>
            <CardDescription class="max-w-2xl text-base leading-7">
              Build loadouts, bundles, and cross-sells that feel native to the Project Zomboid economy.
              Categories, variants, bundle pricing, and recommendation slots all live in one catalog.
            </CardDescription>
          </div>
        </CardHeader>

        <CardFooter class="flex-wrap gap-2">
          <Button as-child>
            <NuxtLink to="/admin/store">
              Manage the catalog
            </NuxtLink>
          </Button>
          <Button variant="outline" as-child>
            <NuxtLink to="/store/cart">
              Review cart
            </NuxtLink>
          </Button>
        </CardFooter>
      </Card>

      <div class="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader class="space-y-1">
            <CardDescription>Wallet</CardDescription>
            <CardTitle class="text-3xl tracking-tight">
              {{ formatStoreMoney(data.viewer?.walletBalance) }}
            </CardTitle>
          </CardHeader>
          <CardContent class="text-sm text-muted-foreground">
            {{ data.viewer?.username ? `${data.viewer.username} linked to active profile` : 'Player wallet appears when the signed-in account matches an active server player.' }}
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="space-y-1">
            <CardDescription>Featured bundles</CardDescription>
            <CardTitle class="text-3xl tracking-tight">
              {{ featuredBundles.length }}
            </CardTitle>
          </CardHeader>
          <CardContent class="text-sm text-muted-foreground">
            Sell complete kits instead of isolated items so players can buy a weapon, ammo, and support gear together.
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="space-y-1">
            <CardDescription>Categories</CardDescription>
            <CardTitle class="text-3xl tracking-tight">
              {{ categories.length }}
            </CardTitle>
          </CardHeader>
          <CardContent class="text-sm text-muted-foreground">
            Products can appear in more than one lane, so tactical gear can live under multiple collections.
          </CardContent>
        </Card>

        <Card>
          <CardHeader class="space-y-1">
            <CardDescription>Catalog items</CardDescription>
            <CardTitle class="text-3xl tracking-tight">
              {{ products.length }}
            </CardTitle>
          </CardHeader>
          <CardContent class="text-sm text-muted-foreground">
            Variants keep finish, size, and loadout choices grouped under a single product entry.
          </CardContent>
        </Card>
      </div>
    </section>

    <section class="space-y-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div class="space-y-1">
          <h2 class="text-2xl font-semibold tracking-tight">
            Browse by category
          </h2>
          <p class="text-sm text-muted-foreground">
            Shop lanes inspired by the catalog structure already configured for this profile.
          </p>
        </div>

        <Button variant="outline" :disabled="pending" @click="refresh">
          {{ pending ? 'Refreshing…' : 'Refresh data' }}
        </Button>
      </div>

      <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <NuxtLink
          v-for="category in categories"
          :key="category.id"
          :to="`/store/category/${category.slug}`"
          class="group block h-full"
        >
          <Card class="flex h-full flex-col transition-colors group-hover:border-primary/50">
            <CardHeader class="space-y-3">
              <Badge variant="outline">
                {{ category.productCount || 0 }} products
              </Badge>
              <CardTitle>{{ category.heroTitle || category.name }}</CardTitle>
              <CardDescription class="line-clamp-3">
                {{ category.heroDescription || category.description || 'Organize the storefront around how players actually build kits.' }}
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <span class="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
                Explore category
              </span>
            </CardFooter>
          </Card>
        </NuxtLink>
      </div>
    </section>

    <section v-if="featuredBundles.length" class="space-y-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-semibold tracking-tight">
          Bundle offers
        </h2>
        <p class="text-sm text-muted-foreground">
          Highlight complete survival kits with discounted bundle pricing and one-click cart adds.
        </p>
      </div>

      <div class="grid gap-5 lg:grid-cols-3">
        <StoreBundleCard
          v-for="bundle in featuredBundles"
          :key="bundle.id"
          :bundle="bundle"
        />
      </div>
    </section>

    <section class="space-y-6">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div class="space-y-1">
          <h2 class="text-2xl font-semibold tracking-tight">
            Storefront
          </h2>
          <p class="text-sm text-muted-foreground">
            Featured gear and configurable products ready for player purchase.
          </p>
        </div>

        <div class="w-full max-w-md space-y-2">
          <Label for="store-search">Search by name, category, or item code</Label>
          <Input
            id="store-search"
            v-model="search"
            placeholder="Example: kneepad.military"
          />
        </div>
      </div>

      <div
        v-if="featuredProducts.length && !search"
        class="grid gap-5 xl:grid-cols-3"
      >
        <StoreProductCard
          v-for="product in featuredProducts"
          :key="product.id"
          :product="product"
        />
      </div>

      <div class="grid gap-5 xl:grid-cols-3">
        <StoreProductCard
          v-for="product in filteredProducts"
          :key="product.id"
          :product="product"
        />
      </div>

      <Card v-if="!filteredProducts.length">
        <CardContent class="p-6 text-center text-sm text-muted-foreground">
          No products matched that search yet.
        </CardContent>
      </Card>
    </section>
    </template>
  </div>
</template>
