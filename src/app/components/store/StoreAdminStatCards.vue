<script setup lang="ts">
import type { StoreProductDetail, StoreBundleSummary, StoreCategorySummary } from '@/lib/store'
import {
  Database,
  Package,
  ShoppingBag,
  Tag,
} from 'lucide-vue-next'

interface AdminStoreBootstrap {
  catalog: { source: string, total: number }
  categories: Array<StoreCategorySummary & { isActive: boolean }>
  products: Array<StoreProductDetail>
  bundles: Array<StoreBundleSummary & { isActive: boolean }>
}

const bootstrapDefault: AdminStoreBootstrap = {
  catalog: { source: 'telemetry', total: 0 },
  categories: [],
  products: [],
  bundles: [],
}

const { data: bootstrap } = await useFetch<AdminStoreBootstrap>(
  '/api/store/admin/bootstrap',
  { default: () => bootstrapDefault },
)

const activeProductCount = computed(() => bootstrap.value.products.filter(p => p.isActive).length)
const activeBundleCount = computed(() => bootstrap.value.bundles.filter(b => b.isActive).length)
const activeCategoryCount = computed(() => bootstrap.value.categories.filter(c => c.isActive).length)
const totalVariantCount = computed(() =>
  bootstrap.value.products.reduce((sum, p) => sum + p.variantCount, 0),
)
</script>

<template>
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
</template>
