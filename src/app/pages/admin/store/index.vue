<script setup lang="ts">
import type { StoreBundleSummary, StoreCategorySummary, StoreProductDetail } from '@/lib/store'
import { formatStoreMoney, formatStorePriceRange } from '@/lib/store'
import { toast } from 'vue-sonner'
import {
  Database,
  Layers,
  Package,
  Plus,
  Search,
  ShoppingBag,
  Tag,
  Trash2,
} from 'lucide-vue-next'

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
  recommendationOptions: Array<{ id: string, name: string, slug: string }>
  variantOptions: Array<{ id: string, productId: string, productName: string, productSlug: string, variantName: string, itemCode: string, price: number, stock: number | null, label: string }>
}

const bootstrapDefault: AdminStoreBootstrap = {
  profile: null,
  catalog: { source: 'telemetry', total: 0 },
  categories: [],
  products: [],
  bundles: [],
  recommendationOptions: [],
  variantOptions: [],
}

const { data: bootstrap, refresh: refreshBootstrap } = await useFetch<AdminStoreBootstrap>(
  '/api/store/admin/bootstrap',
  { default: () => bootstrapDefault },
)

const route = useRoute()
const validTabs = ['products', 'bundles', 'categories', 'import']
const initialTab = validTabs.includes(route.query.tab as string) ? route.query.tab as string : 'products'
const activeTab = ref(initialTab)
const productSearch = ref('')
const bundleSearch = ref('')
const categorySearch = ref('')

const filteredProducts = computed(() => {
  const query = productSearch.value.trim().toLowerCase()
  const products = bootstrap.value.products
  if (!query) return products
  return products.filter(p =>
    p.name.toLowerCase().includes(query)
    || p.slug.toLowerCase().includes(query)
    || p.categories.some(c => c.name.toLowerCase().includes(query))
    || p.variants.some(v => v.itemCode.toLowerCase().includes(query)),
  )
})

const filteredBundles = computed(() => {
  const query = bundleSearch.value.trim().toLowerCase()
  const bundles = bootstrap.value.bundles
  if (!query) return bundles
  return bundles.filter(b =>
    b.name.toLowerCase().includes(query)
    || b.slug.toLowerCase().includes(query),
  )
})

const filteredCategories = computed(() => {
  const query = categorySearch.value.trim().toLowerCase()
  const categories = bootstrap.value.categories
  if (!query) return categories
  return categories.filter(c =>
    c.name.toLowerCase().includes(query)
    || c.slug.toLowerCase().includes(query),
  )
})

const activeProductCount = computed(() => bootstrap.value.products.filter(p => p.isActive).length)
const activeBundleCount = computed(() => bootstrap.value.bundles.filter(b => b.isActive).length)
const activeCategoryCount = computed(() => bootstrap.value.categories.filter(c => c.isActive).length)

const totalVariantCount = computed(() =>
  bootstrap.value.products.reduce((sum, p) => sum + p.variantCount, 0),
)

async function deleteProduct(productId: string) {
  try {
    await $fetch(`/api/store/admin/products/${productId}`, { method: 'DELETE' })
    toast.success('Product deleted.')
    await refreshBootstrap()
  }
  catch {
    toast.error('Failed to delete product.')
  }
}

async function deleteBundle(bundleId: string) {
  try {
    await $fetch(`/api/store/admin/bundles/${bundleId}`, { method: 'DELETE' })
    toast.success('Bundle deleted.')
    await refreshBootstrap()
  }
  catch {
    toast.error('Failed to delete bundle.')
  }
}

async function deleteCategory(categoryId: string) {
  try {
    await $fetch(`/api/store/admin/categories/${categoryId}`, { method: 'DELETE' })
    toast.success('Category deleted.')
    await refreshBootstrap()
  }
  catch {
    toast.error('Failed to delete category.')
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
    <!-- Stats Cards -->
    <div class="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card class="@container/card">
        <CardHeader>
          <CardDescription class="flex items-center gap-2">
            <ShoppingBag class="size-3.5 text-muted-foreground" />
            Products
          </CardDescription>
          <CardTitle class="flex items-center gap-2 text-lg font-semibold tabular-nums">
            <span class="size-2 rounded-full" :class="activeProductCount > 0 ? 'bg-emerald-500' : 'bg-muted-foreground'" />
            {{ bootstrap.products.length }}
          </CardTitle>
        </CardHeader>
        <CardFooter class="text-sm">
          <div class="text-muted-foreground">
            {{ activeProductCount }} active, {{ totalVariantCount }} variants
          </div>
        </CardFooter>
      </Card>

      <Card class="@container/card">
        <CardHeader>
          <CardDescription class="flex items-center gap-2">
            <Package class="size-3.5 text-muted-foreground" />
            Bundles
          </CardDescription>
          <CardTitle class="flex items-center gap-2 text-lg font-semibold tabular-nums">
            <span class="size-2 rounded-full" :class="activeBundleCount > 0 ? 'bg-emerald-500' : 'bg-muted-foreground'" />
            {{ bootstrap.bundles.length }}
          </CardTitle>
        </CardHeader>
        <CardFooter class="text-sm">
          <div class="text-muted-foreground">
            {{ activeBundleCount }} active
          </div>
        </CardFooter>
      </Card>

      <Card class="@container/card">
        <CardHeader>
          <CardDescription class="flex items-center gap-2">
            <Tag class="size-3.5 text-muted-foreground" />
            Categories
          </CardDescription>
          <CardTitle class="flex items-center gap-2 text-lg font-semibold tabular-nums">
            <span class="size-2 rounded-full" :class="activeCategoryCount > 0 ? 'bg-emerald-500' : 'bg-muted-foreground'" />
            {{ bootstrap.categories.length }}
          </CardTitle>
        </CardHeader>
        <CardFooter class="text-sm">
          <div class="text-muted-foreground">
            {{ activeCategoryCount }} active
          </div>
        </CardFooter>
      </Card>

      <Card class="@container/card">
        <CardHeader>
          <CardDescription class="flex items-center gap-2">
            <Database class="size-3.5 text-muted-foreground" />
            Catalog
          </CardDescription>
          <CardTitle class="flex items-center gap-2 text-lg font-semibold tabular-nums">
            <span class="size-2 rounded-full" :class="bootstrap.catalog.total > 0 ? 'bg-emerald-500' : 'bg-muted-foreground'" />
            {{ bootstrap.catalog.total }}
          </CardTitle>
        </CardHeader>
        <CardFooter class="text-sm">
          <div class="text-muted-foreground">
            Known items from {{ bootstrap.catalog.source }}
          </div>
        </CardFooter>
      </Card>
    </div>

    <!-- Tabs -->
    <div class="px-4 lg:px-6">
      <Tabs v-model="activeTab">
        <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="products">
              Products
            </TabsTrigger>
            <TabsTrigger value="bundles">
              Bundles
            </TabsTrigger>
            <TabsTrigger value="categories">
              Categories
            </TabsTrigger>
            <TabsTrigger value="import">
              Import
            </TabsTrigger>
          </TabsList>

          <div class="flex items-center gap-2">
            <Button v-if="activeTab === 'products'" size="sm" as-child>
              <NuxtLink to="/admin/store/products/new">
                <Plus class="size-4" />
                Add Product
              </NuxtLink>
            </Button>
            <Button v-if="activeTab === 'bundles'" size="sm" as-child>
              <NuxtLink to="/admin/store/bundles/new">
                <Plus class="size-4" />
                Add Bundle
              </NuxtLink>
            </Button>
            <Button v-if="activeTab === 'categories'" size="sm" as-child>
              <NuxtLink to="/admin/store/categories/new">
                <Plus class="size-4" />
                Add Category
              </NuxtLink>
            </Button>
            <Button v-if="activeTab === 'import'" size="sm" as-child>
              <NuxtLink to="/admin/store/products/new">
                <Plus class="size-4" />
                New Product from Import
              </NuxtLink>
            </Button>
          </div>
        </div>

        <!-- Products Tab -->
        <TabsContent value="products" class="mt-4 space-y-4">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="productSearch"
              placeholder="Search products by name, slug, category, or item code…"
              class="pl-9"
            />
          </div>

          <Card>
            <CardContent class="p-0">
              <ul v-if="filteredProducts.length" role="list" class="divide-y divide-border">
                <li
                  v-for="product in filteredProducts"
                  :key="product.id"
                  class="flex items-center justify-between gap-x-4 px-4 py-4 lg:px-6"
                >
                  <div class="flex min-w-0 items-center gap-x-4">
                    <div class="flex size-10 flex-none items-center justify-center rounded-lg bg-primary/10">
                      <Layers class="size-4 text-primary" />
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <p class="text-sm font-semibold">
                          {{ product.name }}
                        </p>
                        <Badge v-if="product.isFeatured" variant="secondary" class="text-xs">
                          Featured
                        </Badge>
                        <Badge v-if="!product.isActive" variant="outline" class="text-xs">
                          Inactive
                        </Badge>
                      </div>
                      <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span class="text-xs text-muted-foreground">{{ product.variantCount }} variant{{ product.variantCount !== 1 ? 's' : '' }}</span>
                        <span class="text-xs text-muted-foreground">{{ formatStorePriceRange(product.pricing) }}</span>
                        <span v-for="cat in product.categories.slice(0, 3)" :key="cat.id" class="text-xs text-muted-foreground">
                          {{ cat.name }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="flex shrink-0 items-center gap-2">
                    <Badge :variant="product.stock.inStock ? 'outline' : 'destructive'" class="text-xs">
                      {{ product.stock.inStock ? 'In stock' : 'Out of stock' }}
                    </Badge>
                    <Button variant="outline" size="sm" as-child>
                      <NuxtLink :to="`/admin/store/products/${product.id}`">
                        Edit
                      </NuxtLink>
                    </Button>
                    <Button variant="ghost" size="sm" @click="deleteProduct(product.id)">
                      <Trash2 class="size-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              </ul>
              <div v-else class="flex flex-col items-center justify-center py-12 text-center">
                <ShoppingBag class="size-8 text-muted-foreground" />
                <p class="mt-3 text-sm text-muted-foreground">
                  {{ productSearch ? 'No products match that search.' : 'No products yet.' }}
                </p>
                <p class="mt-1 text-xs text-muted-foreground">
                  Create a product to start building the store catalog.
                </p>
                <Button size="sm" class="mt-4" as-child>
                  <NuxtLink to="/admin/store/products/new">
                    <Plus class="size-4" />
                    Add Product
                  </NuxtLink>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Bundles Tab -->
        <TabsContent value="bundles" class="mt-4 space-y-4">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="bundleSearch"
              placeholder="Search bundles by name or slug…"
              class="pl-9"
            />
          </div>

          <Card>
            <CardContent class="p-0">
              <ul v-if="filteredBundles.length" role="list" class="divide-y divide-border">
                <li
                  v-for="bundle in filteredBundles"
                  :key="bundle.id"
                  class="flex items-center justify-between gap-x-4 px-4 py-4 lg:px-6"
                >
                  <div class="flex min-w-0 items-center gap-x-4">
                    <div class="flex size-10 flex-none items-center justify-center rounded-lg bg-primary/10">
                      <Package class="size-4 text-primary" />
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <p class="text-sm font-semibold">
                          {{ bundle.name }}
                        </p>
                        <Badge v-if="bundle.isFeatured" variant="secondary" class="text-xs">
                          Featured
                        </Badge>
                        <Badge v-if="!bundle.isActive" variant="outline" class="text-xs">
                          Inactive
                        </Badge>
                      </div>
                      <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span class="text-xs text-muted-foreground">{{ bundle.itemCount }} item{{ bundle.itemCount !== 1 ? 's' : '' }}</span>
                        <span class="text-xs text-muted-foreground">{{ formatStoreMoney(bundle.price) }}</span>
                        <span v-if="bundle.compareAtPrice && bundle.compareAtPrice > bundle.price" class="text-xs text-muted-foreground line-through">
                          {{ formatStoreMoney(bundle.compareAtPrice) }}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div class="flex shrink-0 items-center gap-2">
                    <Badge :variant="bundle.stock === null || (bundle.stock ?? 0) > 0 ? 'outline' : 'destructive'" class="text-xs">
                      {{ bundle.stock === null || (bundle.stock ?? 0) > 0 ? 'In stock' : 'Out of stock' }}
                    </Badge>
                    <Button variant="outline" size="sm" as-child>
                      <NuxtLink :to="`/admin/store/bundles/${bundle.id}`">
                        Edit
                      </NuxtLink>
                    </Button>
                    <Button variant="ghost" size="sm" @click="deleteBundle(bundle.id)">
                      <Trash2 class="size-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              </ul>
              <div v-else class="flex flex-col items-center justify-center py-12 text-center">
                <Package class="size-8 text-muted-foreground" />
                <p class="mt-3 text-sm text-muted-foreground">
                  {{ bundleSearch ? 'No bundles match that search.' : 'No bundles yet.' }}
                </p>
                <p class="mt-1 text-xs text-muted-foreground">
                  Create a bundle to sell grouped items at a discount.
                </p>
                <Button size="sm" class="mt-4" as-child>
                  <NuxtLink to="/admin/store/bundles/new">
                    <Plus class="size-4" />
                    Add Bundle
                  </NuxtLink>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Categories Tab -->
        <TabsContent value="categories" class="mt-4 space-y-4">
          <div class="relative">
            <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              v-model="categorySearch"
              placeholder="Search categories by name or slug…"
              class="pl-9"
            />
          </div>

          <Card>
            <CardContent class="p-0">
              <ul v-if="filteredCategories.length" role="list" class="divide-y divide-border">
                <li
                  v-for="category in filteredCategories"
                  :key="category.id"
                  class="flex items-center justify-between gap-x-4 px-4 py-4 lg:px-6"
                >
                  <div class="flex min-w-0 items-center gap-x-4">
                    <div class="flex size-10 flex-none items-center justify-center rounded-lg bg-primary/10">
                      <Tag class="size-4 text-primary" />
                    </div>
                    <div class="min-w-0">
                      <div class="flex items-center gap-2">
                        <p class="text-sm font-semibold">
                          {{ category.name }}
                        </p>
                        <Badge v-if="category.isFeatured" variant="secondary" class="text-xs">
                          Featured
                        </Badge>
                        <Badge v-if="!category.isActive" variant="outline" class="text-xs">
                          Inactive
                        </Badge>
                      </div>
                      <div class="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span class="text-xs text-muted-foreground">{{ category.productCount ?? 0 }} product{{ (category.productCount ?? 0) !== 1 ? 's' : '' }}</span>
                        <code class="rounded bg-muted px-1.5 py-0.5 text-xs">{{ category.slug }}</code>
                      </div>
                    </div>
                  </div>
                  <div class="flex shrink-0 items-center gap-2">
                    <Button variant="outline" size="sm" as-child>
                      <NuxtLink :to="`/admin/store/categories/${category.id}`">
                        Edit
                      </NuxtLink>
                    </Button>
                    <Button variant="ghost" size="sm" @click="deleteCategory(category.id)">
                      <Trash2 class="size-4 text-destructive" />
                    </Button>
                  </div>
                </li>
              </ul>
              <div v-else class="flex flex-col items-center justify-center py-12 text-center">
                <Tag class="size-8 text-muted-foreground" />
                <p class="mt-3 text-sm text-muted-foreground">
                  {{ categorySearch ? 'No categories match that search.' : 'No categories yet.' }}
                </p>
                <p class="mt-1 text-xs text-muted-foreground">
                  Create categories to organize the storefront.
                </p>
                <Button size="sm" class="mt-4" as-child>
                  <NuxtLink to="/admin/store/categories/new">
                    <Plus class="size-4" />
                    Add Category
                  </NuxtLink>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <!-- Import Tab -->
        <TabsContent value="import" class="mt-4">
          <StoreAdminCatalogImport :bootstrap="bootstrap" />
        </TabsContent>
      </Tabs>
    </div>
  </div>
</template>
