<script setup lang="ts">
const tab = ref<'server-ini' | 'sandbox'>('server-ini')
const saving = ref(false)
const error = ref('')
const success = ref('')

// Server.ini
const { data: iniData, refresh: refreshIni } = useFetch('/api/config/server-ini')
const iniSettings = ref<Record<string, string>>({})
watch(() => iniData.value, (v) => {
  if (v?.settings) iniSettings.value = { ...v.settings }
}, { immediate: true })

// SandboxVars
const { data: sandboxData, refresh: refreshSandbox } = useFetch('/api/config/sandbox-vars')
const sandboxVars = ref<Record<string, unknown>>({})
watch(() => sandboxData.value, (v) => {
  if (v?.vars) sandboxVars.value = { ...v.vars }
}, { immediate: true })

async function saveIni() {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    await $fetch('/api/config/server-ini', {
      method: 'PUT',
      body: { settings: iniSettings.value },
    })
    success.value = 'server.ini saved successfully'
    await refreshIni()
  }
  catch (e: unknown) {
    error.value = (e as { data?: { message?: string } })?.data?.message || 'Failed to save'
  }
  finally {
    saving.value = false
  }
}

async function saveSandbox() {
  saving.value = true
  error.value = ''
  success.value = ''
  try {
    await $fetch('/api/config/sandbox-vars', {
      method: 'PUT',
      body: { vars: sandboxVars.value },
    })
    success.value = 'SandboxVars.lua saved successfully'
    await refreshSandbox()
  }
  catch (e: unknown) {
    error.value = (e as { data?: { message?: string } })?.data?.message || 'Failed to save'
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="text-2xl font-bold">
      Configuration
    </h1>

    <!-- Tab bar -->
    <div class="flex gap-1 border-b">
      <button
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
        :class="tab === 'server-ini' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
        @click="tab = 'server-ini'"
      >
        server.ini
      </button>
      <button
        class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
        :class="tab === 'sandbox' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'"
        @click="tab = 'sandbox'"
      >
        SandboxVars.lua
      </button>
    </div>

    <!-- Alerts -->
    <p v-if="error" class="text-sm text-destructive bg-destructive/10 rounded-md p-3">
      {{ error }}
    </p>
    <p v-if="success" class="text-sm text-green-600 bg-green-50 rounded-md p-3">
      {{ success }}
    </p>

    <!-- server.ini editor -->
    <div v-if="tab === 'server-ini'" class="space-y-3">
      <div v-for="(value, key) in iniSettings" :key="key" class="grid grid-cols-3 gap-2 items-center">
        <label class="text-sm font-medium text-right pr-2">{{ key }}</label>
        <input
          v-model="iniSettings[key]"
          type="text"
          class="col-span-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
        />
      </div>
      <button
        :disabled="saving"
        class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        @click="saveIni"
      >
        {{ saving ? 'Saving...' : 'Save server.ini' }}
      </button>
    </div>

    <!-- SandboxVars editor -->
    <div v-if="tab === 'sandbox'" class="space-y-3">
      <div v-for="(value, key) in sandboxVars" :key="key" class="grid grid-cols-3 gap-2 items-center">
        <label class="text-sm font-medium text-right pr-2">{{ key }}</label>
        <input
          v-if="typeof value === 'boolean'"
          :checked="value"
          type="checkbox"
          class="rounded border-input"
          @change="sandboxVars[key] = ($event.target as HTMLInputElement).checked"
        />
        <input
          v-else
          :value="value"
          type="text"
          class="col-span-2 rounded-md border border-input bg-background px-3 py-1.5 text-sm"
          @input="sandboxVars[key] = ($event.target as HTMLInputElement).value"
        />
      </div>
      <button
        :disabled="saving"
        class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        @click="saveSandbox"
      >
        {{ saving ? 'Saving...' : 'Save SandboxVars.lua' }}
      </button>
    </div>
  </div>
</template>
