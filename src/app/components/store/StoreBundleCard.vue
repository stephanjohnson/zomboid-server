<script setup lang="ts">
import type { StoreBundleSummary } from '@/lib/store'
import { formatStoreMoney } from '@/lib/store'

defineProps<{
  bundle: StoreBundleSummary
}>()
</script>

<template>
  <NuxtLink
    :to="`/store/bundle/${bundle.slug}`"
    class="group block h-full"
  >
    <Card class="flex h-full flex-col transition-colors group-hover:border-primary/50">
      <CardHeader class="space-y-4">
        <div class="flex flex-wrap gap-2">
          <Badge variant="outline">Bundle</Badge>
          <Badge v-if="bundle.badge" variant="secondary">
            {{ bundle.badge }}
          </Badge>
        </div>

        <div class="space-y-2">
          <CardTitle>{{ bundle.name }}</CardTitle>
          <CardDescription class="line-clamp-2">
            {{ bundle.summary || bundle.description || 'Built to ship a complete kit in one purchase.' }}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent class="flex-1 space-y-4">
        <div class="flex items-end justify-between gap-4">
          <div class="space-y-1">
            <p class="text-sm text-muted-foreground">Bundle price</p>
            <p class="text-2xl font-semibold">
              {{ formatStoreMoney(bundle.price) }}
            </p>
            <p
              v-if="bundle.compareAtPrice && bundle.compareAtPrice > bundle.price"
              class="text-sm text-muted-foreground line-through"
            >
              {{ formatStoreMoney(bundle.compareAtPrice) }}
            </p>
          </div>

          <div class="text-right text-sm text-muted-foreground">
            <p>{{ bundle.itemCount }} items</p>
            <p>{{ bundle.stock === null ? 'Unlimited stock' : `${bundle.stock} left` }}</p>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <span class="text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground">
          Open bundle
        </span>
      </CardFooter>
    </Card>
  </NuxtLink>
</template>
