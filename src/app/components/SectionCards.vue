<script setup lang="ts">
import {
  Clock,
  LoaderCircle,
  Server,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-vue-next'
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

const props = defineProps<{
  status: {
    container: { exists: boolean, running: boolean, status: string, statusLabel: string, startedAt: string | null }
    rcon: boolean
    phase?: { state: string, label: string, detail?: string, progress?: number }
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
  if (props.status?.phase?.label) return props.status.phase.label
  if (props.status?.container?.running) return 'Online'
  if (props.status?.container?.exists) return 'Stopped'
  return 'Not Created'
})

const phaseState = computed(() => props.status?.phase?.state)

const serverRunning = computed(() => props.status?.container?.running)
</script>

<template>
  <div class="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
    <Card class="@container/card">
      <CardHeader>
        <CardDescription class="flex items-center gap-2">
          <Server class="size-3.5 text-muted-foreground" />
          Server Status
        </CardDescription>
        <CardTitle class="flex items-center gap-2 text-lg font-semibold tabular-nums">
          <template v-if="status?.phase">
            <LoaderCircle
              v-if="phaseState === 'updating' || phaseState === 'initializing' || phaseState === 'starting'"
              class="size-4 animate-spin text-accent"
            />
            <span
              v-else
              class="size-2 rounded-full"
              :class="phaseState === 'ready' ? 'bg-primary' : phaseState === 'error' ? 'bg-destructive' : 'bg-muted-foreground'"
            />
            {{ status.phase.detail ?? status.phase.label }}
          </template>
          <template v-else>
            <span class="size-2 rounded-full" :class="serverRunning ? 'bg-primary' : 'bg-muted-foreground'" />
            {{ serverStateLabel }}
          </template>
        </CardTitle>
      </CardHeader>
      <CardFooter class="flex-col items-start gap-1.5 text-sm">
        <div class="text-muted-foreground">
          {{ status?.activeProfile?.servername ?? 'No profile active' }}
        </div>
        <Progress v-if="typeof status?.phase?.progress === 'number'" :model-value="status.phase.progress" class="h-1.5 w-full" />
      </CardFooter>
    </Card>

    <Card class="@container/card">
      <CardHeader>
        <CardDescription class="flex items-center gap-2">
          <Users class="size-3.5 text-muted-foreground" />
          Players Online
        </CardDescription>
        <CardTitle class="flex items-center gap-2 text-lg font-semibold tabular-nums">
          <span class="size-2 rounded-full" :class="playerCount > 0 ? 'bg-primary' : 'bg-muted-foreground'" />
          {{ playerCount }}
        </CardTitle>
      </CardHeader>
      <CardFooter class="text-sm">
        <div class="text-muted-foreground">
          {{ playerCount > 0 ? `${playerCount} active in-game` : 'No active players' }}
        </div>
      </CardFooter>
    </Card>

    <Card class="@container/card">
      <CardHeader>
        <CardDescription class="flex items-center gap-2">
          <component :is="status?.rcon ? Wifi : WifiOff" class="size-3.5 text-muted-foreground" />
          RCON
        </CardDescription>
        <CardTitle class="flex items-center gap-2 text-lg font-semibold tabular-nums">
          <span class="size-2 rounded-full" :class="status?.rcon ? 'bg-primary' : 'bg-muted-foreground'" />
          {{ status?.rcon ? 'Connected' : 'Disconnected' }}
        </CardTitle>
      </CardHeader>
      <CardFooter class="text-sm">
        <div class="text-muted-foreground">
          {{ status?.rcon ? 'Remote console ready' : 'Console unavailable' }}
        </div>
      </CardFooter>
    </Card>

    <Card class="@container/card">
      <CardHeader>
        <CardDescription class="flex items-center gap-2">
          <Clock class="size-3.5 text-muted-foreground" />
          Uptime
        </CardDescription>
        <CardTitle class="flex items-center gap-2 text-lg font-semibold tabular-nums">
          <span class="size-2 rounded-full" :class="uptime ? 'bg-primary' : 'bg-muted-foreground'" />
          {{ uptime ?? '--' }}
        </CardTitle>
      </CardHeader>
      <CardFooter class="text-sm">
        <div class="text-muted-foreground">
          {{ uptime ? 'Current session' : 'Not running' }}
        </div>
      </CardFooter>
    </Card>
  </div>
</template>
