<script setup lang="ts">
import type { StoreBundleSummary } from '@/lib/store'
import { formatStoreMoney } from '@/lib/store'
import { toast } from 'vue-sonner'
import {
  Package,
  Plus,
  Search,
  Trash2,
} from 'lucide-vue-next'

const { data: bundles, refresh } = await useFetch<StoreBundleSummary[]>(
  '/api/store/admin/bootstrap',
  {
    default: () => [] as StoreBundleSummary[],
    transform: (data: { bundles: StoreBundleSummary[] }) => data.bundles,
  },
)

const bundleSearch = ref('')

const filteredBundles = computed(() => {
  const query = bundleSearch.value.trim().toLowerCase()
  if (!query) return bundles.value
  return bundles.value.filter(b =>
    b.name.toLowerCase().includes(query)
    || b.slug.toLowerCase().includes(query),
  )
})

async function deleteBundle(bundleId: string) {
  try {
    await $fetch(`/api/store/admin/bundles/${bundleId}`, { method: 'DELETE' })
    toast.success('Bundle deleted.')
    await refresh()
  }
  catch {
    toast.error('Failed to delete bundle.')
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
    <div class="px-4 lg:px-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <nav class="flex gap-2">
          <Button variant="outline" size="sm" as-child>
            <NuxtLink to="/admin/store">
              Products
            </NuxtLink>
          </Button>
          <Button variant="default" size="sm" as-child>
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
          <NuxtLink to="/admin/store/bundles/new">
            <Plus class="size-4" />
            Add Bundle
          </NuxtLink>
        </Button>
      </div>
    </div>

    <div class="space-y-4 px-4 lg:px-6">
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
    </div>
  </div>
</template>
