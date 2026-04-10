<script setup lang="ts">
import type { SidebarProps } from '@/components/ui/sidebar'
import {
  Archive,
  Edit,
  Home,
  Package,
  PanelTop,
  ScrollText,
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
      { title: 'Logs', url: `/profiles/${pid}/logs`, icon: ScrollText },
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

const phaseLabel = computed(() => {
  if (status.value?.phase?.label) return status.value.phase.label
  if (status.value?.container?.running) return 'Server Online'
  if (status.value?.container?.exists) return 'Server Offline'
  return 'Not Created'
})

const phaseDotClass = computed(() => {
  const state = status.value?.phase?.state
  if (state === 'ready') return 'bg-primary'
  if (state === 'error') return 'bg-destructive'
  if (state === 'updating' || state === 'initializing' || state === 'starting') return 'bg-accent'
  if (status.value?.container?.running) return 'bg-primary'
  if (status.value?.container?.exists) return 'bg-accent'
  return 'bg-muted-foreground'
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
                    :class="phaseDotClass"
                  />
                  {{ phaseLabel }}
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
