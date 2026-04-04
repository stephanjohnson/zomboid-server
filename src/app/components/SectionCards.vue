<script setup lang="ts">
import {
  Activity,
  Clock,
  Server,
  TrendingDown,
  TrendingUp,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-vue-next'
import { Badge } from '@/components/ui/badge'
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const props = defineProps<{
  status: {
    container: { exists: boolean, running: boolean, status: string, statusLabel: string, startedAt: string | null }
    rcon: boolean
    activeProfile: { id: string, name: string, servername: string } | null
  } | null
  playerCount: number
}>()

const uptime = computed(() => {
  if (!props.status?.container?.startedAt) return null
  const started = new Date(props.status.container.startedAt)
  const now = new Date()
  const diff = now.getTime() - started.getTime()
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
})

const serverStateLabel = computed(() => {
  if (props.status?.container?.running) return 'Online'
  if (props.status?.container?.exists) return 'Stopped'
  return 'Not Created'
})
</script>

<template>
  <div class="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
    <Card class="@container/card">
      <CardHeader>
        <CardDescription>Server Status</CardDescription>
        <CardTitle class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {{ serverStateLabel }}
        </CardTitle>
        <CardAction>
          <Badge variant="outline" :class="status?.container?.running ? 'text-emerald-600' : 'text-muted-foreground'">
            <Server class="size-3" />
            {{ status?.container?.statusLabel ?? 'Unknown' }}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter class="flex-col items-start gap-1.5 text-sm">
        <div class="line-clamp-1 flex gap-2 font-medium">
          <template v-if="status?.container?.running">
            Server is running
            <Activity class="size-4 text-emerald-500" />
          </template>
          <template v-else>
            Server is offline
            <TrendingDown class="size-4" />
          </template>
        </div>
        <div class="text-muted-foreground">
          {{ status?.activeProfile?.servername ?? 'No profile active' }}
        </div>
      </CardFooter>
    </Card>

    <Card class="@container/card">
      <CardHeader>
        <CardDescription>Players Online</CardDescription>
        <CardTitle class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {{ playerCount }}
        </CardTitle>
        <CardAction>
          <Badge variant="outline">
            <Users class="size-3" />
            Active
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter class="flex-col items-start gap-1.5 text-sm">
        <div class="line-clamp-1 flex gap-2 font-medium">
          <template v-if="playerCount > 0">
            Players connected <TrendingUp class="size-4" />
          </template>
          <template v-else>
            No active players
          </template>
        </div>
        <div class="text-muted-foreground">
          Currently in-game
        </div>
      </CardFooter>
    </Card>

    <Card class="@container/card">
      <CardHeader>
        <CardDescription>RCON Connection</CardDescription>
        <CardTitle class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {{ status?.rcon ? 'Connected' : 'Disconnected' }}
        </CardTitle>
        <CardAction>
          <Badge variant="outline" :class="status?.rcon ? 'text-emerald-600' : 'text-muted-foreground'">
            <component :is="status?.rcon ? Wifi : WifiOff" class="size-3" />
            {{ status?.rcon ? 'Active' : 'Inactive' }}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter class="flex-col items-start gap-1.5 text-sm">
        <div class="line-clamp-1 flex gap-2 font-medium">
          <template v-if="status?.rcon">
            Remote console ready <TrendingUp class="size-4" />
          </template>
          <template v-else>
            RCON unavailable <TrendingDown class="size-4" />
          </template>
        </div>
        <div class="text-muted-foreground">
          Server command interface
        </div>
      </CardFooter>
    </Card>

    <Card class="@container/card">
      <CardHeader>
        <CardDescription>Uptime</CardDescription>
        <CardTitle class="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {{ uptime ?? '--' }}
        </CardTitle>
        <CardAction>
          <Badge variant="outline">
            <Clock class="size-3" />
            Session
          </Badge>
        </CardAction>
      </CardHeader>
      <CardFooter class="flex-col items-start gap-1.5 text-sm">
        <div class="line-clamp-1 flex gap-2 font-medium">
          <template v-if="uptime">
            Running since start <TrendingUp class="size-4" />
          </template>
          <template v-else>
            Server not running
          </template>
        </div>
        <div class="text-muted-foreground">
          Current session duration
        </div>
      </CardFooter>
    </Card>
  </div>
</template>
