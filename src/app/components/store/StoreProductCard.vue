<script setup lang="ts">
import type { StoreProductSummary } from '@/lib/store'
import { formatStorePriceRange, summarizeVariantSelections } from '@/lib/store'

defineProps<{
  product: StoreProductSummary
}>()
</script>

<template>
  <NuxtLink
    :to="`/store/product/${product.slug}`"
    class="group block h-full"
  >
    <Card class="flex h-full flex-col transition-colors group-hover:border-primary/50">
      <div
        v-if="product.defaultVariant?.imageUrl"
        class="overflow-hidden rounded-t-xl border-b bg-muted/20"
      >
        <img
          :src="product.defaultVariant.imageUrl"
          :alt="product.defaultVariant.gameName || product.defaultVariant.name || product.name"
          class="h-48 w-full object-contain p-6"
        >
      </div>

      <CardHeader class="space-y-4">
        <div class="flex flex-wrap gap-2">
          <Badge
            v-for="category in product.categories.slice(0, 2)"
            :key="category.id"
            variant="secondary"
          >
            {{ category.name }}
          </Badge>
          <Badge v-if="product.badge" variant="outline">
            {{ product.badge }}
          </Badge>
        </div>

        <div class="space-y-2">
          <CardTitle>{{ product.name }}</CardTitle>
          <CardDescription class="line-clamp-2">
            {{ product.summary || product.overview || 'Loadout-ready gear curated for live server delivery.' }}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent class="flex-1 space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <div class="space-y-1">
            <p class="text-sm text-muted-foreground">Price</p>
            <p class="text-2xl font-semibold">
              {{ formatStorePriceRange(product.pricing) }}
            </p>
            <p
              v-if="product.defaultVariant?.compareAtPrice && product.defaultVariant.compareAtPrice > product.defaultVariant.price"
              class="text-sm text-muted-foreground line-through"
            >
              {{ formatStorePriceRange({ ...product.pricing, min: product.defaultVariant.compareAtPrice, max: product.defaultVariant.compareAtPrice, hasRange: false }) }}
            </p>
          </div>

          <div class="space-y-1">
            <p class="text-sm text-muted-foreground">Variants</p>
            <p class="text-lg font-medium">
              {{ product.variantCount }}
            </p>
            <p class="text-sm text-muted-foreground">
              {{ summarizeVariantSelections(product.defaultVariant) || 'Configurable loadout' }}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter class="justify-between">
        <Badge :variant="product.stock.inStock ? 'secondary' : 'outline'">
          {{ product.stock.inStock ? 'In stock' : 'Unavailable' }}
        </Badge>
        <span class="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          View product
        </span>
      </CardFooter>
    </Card>
  </NuxtLink>
</template>
