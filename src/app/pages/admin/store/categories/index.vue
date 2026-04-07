<script setup lang="ts">
import type { StoreCategorySummary } from '@/lib/store'
import { toast } from 'vue-sonner'
import {
  Plus,
  Search,
  Tag,
  Trash2,
} from 'lucide-vue-next'

type StoreCategoryListItem = StoreCategorySummary & { sortOrder: number, isActive: boolean }

interface CategoryBootstrapResponse {
  categories: StoreCategoryListItem[]
}

const { data: bootstrap, refresh } = await useFetch<CategoryBootstrapResponse>(
  '/api/store/admin/bootstrap',
  {
    default: () => ({ categories: [] }),
  },
)

const categories = computed(() => bootstrap.value.categories)

const categorySearch = ref('')

const filteredCategories = computed(() => {
  const query = categorySearch.value.trim().toLowerCase()
  if (!query) return categories.value
  return categories.value.filter(category =>
    category.name.toLowerCase().includes(query)
    || category.slug.toLowerCase().includes(query),
  )
})

async function deleteCategory(categoryId: string) {
  try {
    await $fetch(`/api/store/admin/categories/${categoryId}`, { method: 'DELETE' })
    toast.success('Category deleted.')
    await refresh()
  }
  catch {
    toast.error('Failed to delete category.')
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
    <div class="px-4 lg:px-6">
      <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <StoreAdminSectionTabs />

        <div class="flex flex-col gap-2 sm:flex-row">
          <Button variant="outline" size="sm" as-child>
            <NuxtLink to="/admin/store/categories/new?mode=import">
              <Tag class="size-4" />
              Import Game Category
            </NuxtLink>
          </Button>

          <Button size="sm" as-child>
            <NuxtLink to="/admin/store/categories/new">
              <Plus class="size-4" />
              Add Custom Category
            </NuxtLink>
          </Button>
        </div>
      </div>
    </div>

    <div class="space-y-4 px-4 lg:px-6">
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
              Create your own categories or import them from the game catalog.
            </p>
            <div class="mt-4 flex flex-col gap-2 sm:flex-row">
              <Button size="sm" as-child>
                <NuxtLink to="/admin/store/categories/new">
                  <Plus class="size-4" />
                  Add Custom Category
                </NuxtLink>
              </Button>
              <Button size="sm" variant="outline" as-child>
                <NuxtLink to="/admin/store/categories/new?mode=import">
                  <Tag class="size-4" />
                  Import Game Category
                </NuxtLink>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
