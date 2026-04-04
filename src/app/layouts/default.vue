<script setup lang="ts">
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { Toaster } from '@/components/ui/sonner'

const route = useRoute()

const breadcrumbs = computed(() => {
  const parts = route.path.split('/').filter(Boolean)
  if (parts.length === 0) return [{ title: 'Dashboard', href: '/' }]

  return parts.map((part, index) => ({
    title: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
    href: '/' + parts.slice(0, index + 1).join('/'),
  }))
})
</script>

<template>
  <div>
    <NuxtLoadingIndicator color="var(--color-primary)" />
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header class="flex h-16 shrink-0 items-center gap-2">
          <div class="flex items-center gap-2 px-4">
            <SidebarTrigger class="-ml-1" />
            <Separator orientation="vertical" class="mr-2 data-[orientation=vertical]:h-4" />
            <Breadcrumb>
              <BreadcrumbList>
                <template v-for="(crumb, index) in breadcrumbs" :key="crumb.href">
                  <BreadcrumbSeparator v-if="index > 0" class="hidden md:block" />
                  <BreadcrumbItem v-if="index < breadcrumbs.length - 1" class="hidden md:block">
                    <BreadcrumbLink :href="crumb.href">
                      {{ crumb.title }}
                    </BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbItem v-else>
                    <BreadcrumbPage>{{ crumb.title }}</BreadcrumbPage>
                  </BreadcrumbItem>
                </template>
              </BreadcrumbList>
            </Breadcrumb>
          </div>
        </header>
        <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
          <slot />
        </div>
      </SidebarInset>
    </SidebarProvider>
    <Toaster rich-colors />
  </div>
</template>
