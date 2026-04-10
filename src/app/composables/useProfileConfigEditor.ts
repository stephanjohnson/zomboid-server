import { buildEditorDisplayValues, flattenConfigRecord } from '~~/shared/config-settings'

function cloneRecord(record: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(record))
}

function countDirtyValues(currentValues: Record<string, string>, initialValues: Record<string, string>): number {
  const keys = new Set([...Object.keys(currentValues), ...Object.keys(initialValues)])
  let dirtyCount = 0

  for (const key of keys) {
    if ((currentValues[key] ?? '') !== (initialValues[key] ?? '')) {
      dirtyCount += 1
    }
  }

  return dirtyCount
}

function toErrorMessage(error: unknown): string {
  return (error as { data?: { message?: string }, message?: string })?.data?.message
    || (error as { message?: string })?.message
    || 'Failed to save configuration'
}

export function useProfileConfigEditor(profileId: string) {
  const searchQuery = ref('')
  const errorMessage = ref('')
  const successMessage = ref('')
  const savingServer = ref(false)
  const savingSandbox = ref(false)

  const {
    data: serverData,
    error: serverLoadError,
    pending: serverPending,
    refresh: refreshServer,
  } = useLazyFetch<{ settings?: Record<string, string> }>('/api/config/server-ini', {
    query: { profileId },
  })

  const {
    data: sandboxData,
    error: sandboxLoadError,
    pending: sandboxPending,
    refresh: refreshSandbox,
  } = useLazyFetch<{ vars?: Record<string, unknown> }>('/api/config/sandbox-vars', {
    query: { profileId },
  })

  const serverValues = ref<Record<string, string>>({})
  const serverInitialValues = ref<Record<string, string>>({})
  const sandboxValues = ref<Record<string, string>>({})
  const sandboxInitialValues = ref<Record<string, string>>({})

  function resetServerValues(settings: Record<string, string> | undefined) {
    const nextValues = buildEditorDisplayValues('server-ini', settings ?? {})
    serverValues.value = cloneRecord(nextValues)
    serverInitialValues.value = cloneRecord(nextValues)
  }

  function resetSandboxValues(settings: Record<string, unknown> | undefined) {
    const flattenedValues = flattenConfigRecord(settings ?? {})
    const nextValues = buildEditorDisplayValues('sandbox', flattenedValues)
    sandboxValues.value = cloneRecord(nextValues)
    sandboxInitialValues.value = cloneRecord(nextValues)
  }

  watch(() => serverData.value?.settings, (settings) => {
    resetServerValues(settings)
  }, { immediate: true })

  watch(() => sandboxData.value?.vars, (settings) => {
    resetSandboxValues(settings)
  }, { immediate: true })

  watch([() => serverLoadError.value, () => sandboxLoadError.value], ([nextServerError, nextSandboxError]) => {
    const nextError = nextServerError ?? nextSandboxError
    if (nextError) {
      errorMessage.value = toErrorMessage(nextError)
    }
  }, { immediate: true })

  const serverDirtyCount = computed(() => countDirtyValues(serverValues.value, serverInitialValues.value))
  const sandboxDirtyCount = computed(() => countDirtyValues(sandboxValues.value, sandboxInitialValues.value))

  function clearMessages() {
    errorMessage.value = ''
    successMessage.value = ''
  }

  function updateServerValue(key: string, value: string) {
    serverValues.value[key] = value
    clearMessages()
  }

  function updateSandboxValue(key: string, value: string) {
    sandboxValues.value[key] = value
    clearMessages()
  }

  async function saveServerSettings() {
    clearMessages()
    savingServer.value = true

    try {
      await $fetch('/api/config/server-ini', {
        method: 'PUT',
        body: {
          profileId,
          settings: serverValues.value,
        },
      })

      successMessage.value = 'Server settings saved.'
      await refreshServer()
    }
    catch (error) {
      errorMessage.value = toErrorMessage(error)
    }
    finally {
      savingServer.value = false
    }
  }

  async function saveSandboxSettings() {
    clearMessages()
    savingSandbox.value = true

    try {
      await $fetch('/api/config/sandbox-vars', {
        method: 'PUT',
        body: {
          profileId,
          vars: sandboxValues.value,
        },
      })

      successMessage.value = 'Sandbox settings saved.'
      await refreshSandbox()
    }
    catch (error) {
      errorMessage.value = toErrorMessage(error)
    }
    finally {
      savingSandbox.value = false
    }
  }

  return {
    errorMessage,
    sandboxDirtyCount,
    sandboxInitialValues,
    sandboxPending,
    sandboxValues,
    saveSandboxSettings,
    saveServerSettings,
    savingSandbox,
    savingServer,
    searchQuery,
    serverDirtyCount,
    serverInitialValues,
    serverPending,
    serverValues,
    successMessage,
    updateSandboxValue,
    updateServerValue,
  }
}