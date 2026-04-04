<script setup lang="ts">
import type { StoreProductSummary } from '@/lib/store'

const route = useRoute()

const { data } = await useFetch(`/api/store/categories/${route.params.slug}`, {
  default: () => ({
    profile: null,
    category: null,
    products: [],
  }),
})

const products = computed(() => data.value.products as StoreProductSummary[])
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6 px-6 py-10">
    <Button variant="ghost" size="sm" as-child>
      <NuxtLink to="/store">
        Back to store
      </NuxtLink>
    </Button>

    <Card>
      <CardHeader class="space-y-4">
        <div class="flex flex-wrap gap-2">
          <Badge variant="outline">Category</Badge>
          <Badge variant="secondary">{{ products.length }} products</Badge>
        </div>
        <div class="space-y-2">
          <CardTitle class="text-3xl">
            {{ data.category?.heroTitle || data.category?.name }}
          </CardTitle>
          <CardDescription class="max-w-3xl text-base leading-7">
            {{ data.category?.heroDescription || data.category?.description || 'This collection is organized for faster browsing and stronger merchandising.' }}
          </CardDescription>
        </div>
      </CardHeader>
    </Card>

    <section class="space-y-6">
      <div class="space-y-1">
        <h2 class="text-2xl font-semibold">
          Catalog
        </h2>
        <p class="text-sm text-muted-foreground">
          {{ products.length }} products in this lane.
        </p>
      </div>

      <div class="grid gap-5 xl:grid-cols-3">
        <StoreProductCard
          v-for="product in products"
          :key="product.id"
          :product="product"
        />
      </div>
    </section>
  </div>
</template>
