<script setup lang="ts">
import type { StoreProductDetail } from '@/lib/store'
import { formatStorePriceRange } from '@/lib/store'
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
  categories: Array<{ id: string, isActive: boolean }>
  products: Array<StoreProductDetail & {
    recommendationProductIds: string[]
  }>
  bundles: Array<{ id: string, isActive: boolean }>
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

const productSearch = ref('')

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

    <!-- Navigation -->
    <div class="px-4 lg:px-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <nav class="flex gap-2">
          <Button variant="default" size="sm" as-child>
            <NuxtLink to="/admin/store">
              Products
            </NuxtLink>
          </Button>
          <Button variant="outline" size="sm" as-child>
            <NuxtLink to="/admin/store/bundles">
              Bundles
            </NuxtLink>
          </Button>
          <Button variant="outline" size="sm" as-child>
            <NuxtLink to="/admin/store/categories">
              Categories
            </NuxtLink>
          </Button>
          <Button variant="outline" size="sm" as-child>
            <NuxtLink to="/admin/store/import">
              Import
            </NuxtLink>
          </Button>
        </nav>

        <Button size="sm" as-child>
          <NuxtLink to="/admin/store/products/new">
            <Plus class="size-4" />
            Add Product
          </NuxtLink>
        </Button>
      </div>
    </div>

    <!-- Products List -->
    <div class="space-y-4 px-4 lg:px-6">
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
    </div>
  </div>
</template>
