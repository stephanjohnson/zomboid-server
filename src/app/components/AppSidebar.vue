<script setup lang="ts">
const { user, logout } = useAuth()
const { status } = useServerStatus()

const navigation = [
  { name: 'Dashboard', href: '/', icon: 'home' },
  { name: 'Profiles', href: '/profiles', icon: 'server' },
  { name: 'Configuration', href: '/config', icon: 'settings' },
  { name: 'Mods', href: '/mods', icon: 'package' },
  { name: 'Backups', href: '/backups', icon: 'archive' },
  { name: 'Players', href: '/players', icon: 'users' },
]
</script>

<template>
  <aside class="w-64 border-r bg-card min-h-screen p-4 flex flex-col">
    <div class="mb-6">
      <h2 class="text-lg font-bold">
        ZM Manager
      </h2>
      <div class="flex items-center gap-2 mt-1">
        <span
          class="h-2 w-2 rounded-full"
          :class="status?.container?.running ? 'bg-green-500' : 'bg-red-500'"
        />
        <span class="text-xs text-muted-foreground">
          {{ status?.container?.running ? 'Server Online' : 'Server Offline' }}
        </span>
      </div>
    </div>

    <nav class="space-y-1 flex-1">
      <NuxtLink
        v-for="item in navigation"
        :key="item.href"
        :to="item.href"
        class="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-accent transition-colors"
        active-class="bg-accent text-accent-foreground"
      >
        {{ item.name }}
      </NuxtLink>
    </nav>

    <div class="border-t pt-4">
      <div class="text-sm">
        <p class="font-medium">
          {{ user?.username }}
        </p>
        <p class="text-xs text-muted-foreground">
          {{ user?.role }}
        </p>
      </div>
      <Button
        variant="ghost"
        size="sm"
        class="mt-2 text-xs text-muted-foreground"
        @click="logout"
      >
        Sign out
      </Button>
    </div>
  </aside>
</template>
