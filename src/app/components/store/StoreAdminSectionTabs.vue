<script setup lang="ts">
import { cn } from '@/lib/utils'

interface StoreAdminSectionTab {
  label: string
  to: string
  isActive: (path: string) => boolean
}

const route = useRoute()

const tabs: StoreAdminSectionTab[] = [
  {
    label: 'Products',
    to: '/admin/store',
    isActive: path => path === '/admin/store' || path.startsWith('/admin/store/products/'),
  },
  {
    label: 'Bundles',
    to: '/admin/store/bundles',
    isActive: path => path === '/admin/store/bundles' || path.startsWith('/admin/store/bundles/'),
  },
  {
    label: 'Categories',
    to: '/admin/store/categories',
    isActive: path => path === '/admin/store/categories' || path.startsWith('/admin/store/categories/'),
  },
  {
    label: 'Import',
    to: '/admin/store/import',
    isActive: path => path === '/admin/store/import' || path.startsWith('/admin/store/import/'),
  },
]
</script>

<template>
  <nav aria-label="Store admin sections">
    <div class="inline-flex h-auto flex-wrap items-center gap-1 rounded-md bg-muted p-1 text-muted-foreground">
      <NuxtLink
        v-for="tab in tabs"
        :key="tab.to"
        :to="tab.to"
        :aria-current="tab.isActive(route.path) ? 'page' : undefined"
        :class="cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
          tab.isActive(route.path)
            ? 'bg-background text-foreground shadow-sm'
            : 'text-muted-foreground hover:bg-background/60 hover:text-foreground',
        )"
      >
        {{ tab.label }}
      </NuxtLink>
    </div>
  </nav>
</template>