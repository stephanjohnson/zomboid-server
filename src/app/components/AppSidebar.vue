<script setup lang="ts">
import type { SidebarProps } from '@/components/ui/sidebar'
import {
  Archive,
  Edit,
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

const route = useRoute()
const { user, logout, isAdmin } = useAuth()
const { status } = useServerStatus()

const profileId = computed(() => route.params.profileId as string | undefined)

const navMain = computed(() => {
  const pid = profileId.value
  if (pid) {
    return [
      { title: 'Dashboard', url: `/profiles/${pid}`, icon: Home },
      { title: 'Configuration', url: `/profiles/${pid}/config`, icon: Settings },
      { title: 'Mods', url: `/profiles/${pid}/mods`, icon: Package },
      { title: 'Backups', url: `/profiles/${pid}/backups`, icon: Archive },
      { title: 'Players', url: `/profiles/${pid}/players`, icon: Users },
      { title: 'Edit Profile', url: `/profiles/${pid}/edit`, icon: Edit },
      { title: 'All Profiles', url: '/profiles', icon: Server },
      { title: 'Store', url: '/store', icon: ShoppingBag },
      ...(isAdmin.value ? [{ title: 'Store Admin', url: '/admin/store', icon: PanelTop }] : []),
    ]
  }
  return [
    { title: 'Profiles', url: '/profiles', icon: Server },
    { title: 'Store', url: '/store', icon: ShoppingBag },
    ...(isAdmin.value ? [{ title: 'Store Admin', url: '/admin/store', icon: PanelTop }] : []),
  ]
})

const navSecondary = computed(() => {
  const pid = profileId.value
  if (pid) {
    return [
      { title: 'Settings', url: `/profiles/${pid}/config`, icon: Settings },
    ]
  }
  return []
})
</script>

<template>
  <Sidebar collapsible="offcanvas" v-bind="props">
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton
            as-child
            class="data-[slot=sidebar-menu-button]:!p-1.5"
          >
            <NuxtLink :to="profileId ? `/profiles/${profileId}` : '/profiles'">
              <Skull class="!size-5" />
              <div class="grid flex-1 text-left text-sm leading-tight">
                <span class="truncate font-semibold">ZM Manager</span>
                <span class="truncate text-xs flex items-center gap-1.5">
                  <span
                    class="size-2 rounded-full"
                    :class="status?.container?.running ? 'bg-emerald-500' : status?.container?.exists ? 'bg-yellow-500' : 'bg-muted-foreground/50'"
                  />
                  {{ status?.container?.running ? 'Server Online' : status?.container?.exists ? 'Server Offline' : 'Not Created' }}
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
