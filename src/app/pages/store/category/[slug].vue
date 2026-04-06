<script setup lang="ts">
import type { StoreProductSummary } from '@/lib/store'

const route = useRoute()

const { data, pending } = useLazyFetch(`/api/store/categories/${route.params.slug}`, {
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

    <template v-if="pending && !data?.category">
      <Card>
        <CardHeader class="space-y-4">
          <div class="flex gap-2">
            <Skeleton class="h-6 w-20" />
            <Skeleton class="h-6 w-28" />
          </div>
          <div class="space-y-2">
            <Skeleton class="h-9 w-48" />
            <Skeleton class="h-5 w-full max-w-md" />
          </div>
        </CardHeader>
      </Card>
      <section class="space-y-6">
        <div class="space-y-2">
          <Skeleton class="h-7 w-24" />
          <Skeleton class="h-4 w-40" />
        </div>
        <div class="grid gap-5 xl:grid-cols-3">
          <Card v-for="i in 3" :key="i">
            <CardHeader>
              <Skeleton class="h-40 w-full rounded-md" />
              <Skeleton class="mt-3 h-5 w-36" />
              <Skeleton class="h-4 w-full" />
            </CardHeader>
          </Card>
        </div>
      </section>
    </template>

    <template v-else>
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
    </template>
  </div>
</template>
