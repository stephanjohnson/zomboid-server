<script setup lang="ts">
const { user, logout, isAdmin } = useAuth()
const { itemCount } = useStoreCart()
</script>

<template>
  <div class="min-h-screen bg-background">
    <header class="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
        <div class="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          <NuxtLink to="/store" class="flex items-center gap-3">
            <div class="flex size-10 items-center justify-center rounded-md border bg-muted text-sm font-semibold">
              ZM
            </div>
            <div class="space-y-1">
              <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Commerce
              </p>
              <p class="font-semibold">
                Survivor Supply
              </p>
            </div>
          </NuxtLink>

          <nav class="flex flex-wrap gap-2">
            <Button variant="ghost" size="sm" as-child>
              <NuxtLink to="/store">
                Store
              </NuxtLink>
            </Button>
            <Button variant="ghost" size="sm" as-child>
              <NuxtLink to="/store/cart">
                Cart
              </NuxtLink>
            </Button>
            <Button v-if="isAdmin" variant="ghost" size="sm" as-child>
              <NuxtLink to="/admin/store">
                Manage
              </NuxtLink>
            </Button>
          </nav>
        </div>

        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" as-child>
            <NuxtLink to="/store/cart">
              Cart
              <Badge variant="secondary">
              {{ itemCount }}
              </Badge>
            </NuxtLink>
          </Button>

          <div class="hidden text-right md:block">
            <p class="text-sm font-medium">
              {{ user?.username }}
            </p>
            <p class="text-xs text-muted-foreground">
              {{ user?.role }}
            </p>
          </div>

          <Button variant="outline" size="sm" @click="logout">
            Sign out
          </Button>
        </div>
      </div>
    </header>

    <main>
      <slot />
    </main>
  </div>
</template>
