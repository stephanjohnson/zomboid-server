import { useIntervalFn } from '@vueuse/core'

interface ServerStatus {
  container: {
    exists: boolean
    running: boolean
    status: string
    statusLabel: string
    startedAt: string | null
  }
  rcon: boolean
  phase: {
    state: string
    label: string
    detail?: string
    progress?: number
  }
  activeProfile: {
    id: string
    name: string
    servername: string
  } | null
}

export function useServerStatus() {
  const status = useState<ServerStatus | null>('server-status', () => null)
  const loading = ref(false)

  async function refresh() {
    loading.value = true
    try {
      status.value = await $fetch<ServerStatus>('/api/zomboid/status')
    }
    catch {
      status.value = null
    }
    finally {
      loading.value = false
    }
  }

  // Poll every 10 seconds
  const { pause, resume } = useIntervalFn(refresh, 10000, { immediate: false })

  if (import.meta.client) {
    onMounted(() => {
      resume()
    })

    onScopeDispose(() => {
      pause()
    })
  }

  return {
    status,
    loading,
    refresh,
    pause,
    resume,
  }
}
