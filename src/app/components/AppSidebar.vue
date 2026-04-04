<script setup lang="ts">
import type { SidebarProps } from '@/components/ui/sidebar'
import {
  Archive,
  Home,
  Package,
  PanelTop,
  Server,
  Settings,
  ShoppingBag,
  Skull,
  Users,
} from 'lucide-vue-next'
import NavMain from '@/components/NavMain.vue'
import NavSecondary from '@/components/NavSecondary.vue'
import NavUser from '@/components/NavUser.vue'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'

const props = withDefaults(defineProps<SidebarProps>(), {
  variant: 'inset',
})

const { user, logout, isAdmin } = useAuth()
const { status } = useServerStatus()

const navMain = computed(() => [
  { title: 'Dashboard', url: '/', icon: Home },
  { title: 'Profiles', url: '/profiles', icon: Server },
  { title: 'Configuration', url: '/config', icon: Settings },
  { title: 'Mods', url: '/mods', icon: Package },
  { title: 'Backups', url: '/backups', icon: Archive },
  { title: 'Players', url: '/players', icon: Users },
  { title: 'Store', url: '/store', icon: ShoppingBag },
  ...(isAdmin.value ? [{ title: 'Store Admin', url: '/admin/store', icon: PanelTop }] : []),
])

const navSecondary = [
  { title: 'Settings', url: '/config', icon: Settings },
]
</script>

<template>
  <Sidebar v-bind="props">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" as-child>
            <NuxtLink to="/">
              <div class="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
                <Skull class="size-4" />
              </div>
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-medium">ZM Manager</span>
                <span class="truncate text-xs flex items-center gap-1.5">
                  <span
                    class="h-2 w-2 rounded-full"
                    :class="status?.container?.running ? 'bg-green-500' : status?.container?.exists ? 'bg-yellow-500' : 'bg-slate-400'"
                  />
                    {{ status?.container?.running ? 'Server Online' : status?.container?.exists ? 'Server Offline' : 'Server Not Created' }}
                </span>
              </div>
            </NuxtLink>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
    <SidebarContent>
      <NavMain :items="navMain" />
      <NavSecondary :items="navSecondary" class="mt-auto" />
    </SidebarContent>
    <SidebarFooter>
      <NavUser
        v-if="user"
        :user="{ username: user.username, role: user.role }"
        @logout="logout"
      />
    </SidebarFooter>
  </Sidebar>
</template>
