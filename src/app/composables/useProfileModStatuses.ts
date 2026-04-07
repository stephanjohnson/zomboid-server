import { useIntervalFn } from '@vueuse/core'

export interface ProfileModRuntimeStatus {
  workshopId: string
  state: 'ok' | 'installing' | 'faulty' | 'error' | 'unknown'
  label: string
  detail: string
  progress: number | null
  source: 'live-console' | 'previous-console' | 'installed-files' | 'runtime-handshake' | 'live-console-issue' | 'previous-console-issue' | 'none'
  installedModIds: string[]
  missingModIds: string[]
}

export interface ProfileModStatusResponse {
  server: {
    state: string
    label: string
    detail?: string
    progress?: number
  }
  statuses: ProfileModRuntimeStatus[]
}

export function useProfileModStatuses(profileId: string) {
  const { data, refresh, pending } = useLazyFetch<ProfileModStatusResponse>('/api/mods/status', {
    query: { profileId },
    default: () => ({
      server: { state: 'unknown', label: 'Checking' },
      statuses: [],
    }),
  })

  const statusByWorkshopId = computed(() => {
    return new Map((data.value?.statuses ?? []).map(status => [status.workshopId, status] as const))
  })

  const { pause } = useIntervalFn(() => {
    refresh()
  }, 5000, { immediate: true })

  onScopeDispose(pause)

  return {
    server: computed(() => data.value?.server ?? { state: 'unknown', label: 'Checking' }),
    statusByWorkshopId,
    pending,
    refresh,
  }
}