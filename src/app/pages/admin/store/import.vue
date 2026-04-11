<script setup lang="ts">
import type { StoreBundleSummary, StoreCategorySummary, StoreProductDetail } from '@/lib/store'
import { Plus } from 'lucide-vue-next'

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
}

const bootstrapDefault: AdminStoreBootstrap = {
  profile: null,
  catalog: { source: 'telemetry', total: 0 },
  categories: [],
  products: [],
  bundles: [],
}

const { data: bootstrap } = await useFetch<AdminStoreBootstrap>(
  '/api/store/admin/bootstrap',
  { default: () => bootstrapDefault },
)
</script>

<template>
  <div class="flex flex-col gap-6 py-4 md:gap-8 md:py-6">
    <StoreAdminStatCards />

    <div class="px-4 lg:px-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <StoreAdminSectionTabs />

        <Button size="sm" as-child>
          <NuxtLink to="/admin/store/products/new">
            <Plus class="size-4" />
            New Product from Import
          </NuxtLink>
        </Button>
      </div>
    </div>

    <div class="space-y-4 px-4 lg:px-6">
      <StoreAdminCatalogImport :bootstrap="bootstrap" />
    </div>
  </div>
</template>
