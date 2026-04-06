<script setup lang="ts">
const route = useRoute()
const profileId = route.params.profileId as string

const tab = ref<'server-ini' | 'sandbox'>('server-ini')
const saving = ref(false)
const error = ref('')
const success = ref('')

// Server.ini
const { data: iniData, refresh: refreshIni, pending: iniPending } = useLazyFetch('/api/config/server-ini', {
  query: { profileId },
})
const iniSettings = ref<Record<string, string>>({})
watch(() => iniData.value, (v) => {
  if (v?.settings) iniSettings.value = { ...v.settings }
}, { immediate: true })

// SandboxVars
const { data: sandboxData, refresh: refreshSandbox, pending: sandboxPending } = useLazyFetch('/api/config/sandbox-vars', {
  query: { profileId },
})
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
      body: { profileId, settings: iniSettings.value },
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
      body: { profileId, vars: sandboxVars.value },
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

    <!-- Alerts -->
    <Alert v-if="error" variant="destructive">
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>
    <Alert v-if="success">
      <AlertDescription>{{ success }}</AlertDescription>
    </Alert>

    <Tabs v-model="tab" default-value="server-ini">
      <TabsList>
        <TabsTrigger value="server-ini">
          server.ini
        </TabsTrigger>
        <TabsTrigger value="sandbox">
          SandboxVars.lua
        </TabsTrigger>
      </TabsList>

      <!-- server.ini editor -->
      <TabsContent value="server-ini" class="space-y-3">
        <div v-if="iniPending" class="space-y-3">
          <div v-for="i in 6" :key="i" class="grid grid-cols-3 gap-2 items-center">
            <Skeleton class="ml-auto h-4 w-24" />
            <Skeleton class="col-span-2 h-9" />
          </div>
        </div>
        <div v-for="(value, key) in iniSettings" :key="key" class="grid grid-cols-3 gap-2 items-center">
          <Label class="text-right pr-2">{{ key }}</Label>
          <Input
            v-model="iniSettings[key]"
            type="text"
            class="col-span-2"
          />
        </div>
        <Button
          :disabled="saving"
          @click="saveIni"
        >
          {{ saving ? 'Saving...' : 'Save server.ini' }}
        </Button>
      </TabsContent>

      <!-- SandboxVars editor -->
      <TabsContent value="sandbox" class="space-y-3">
        <div v-if="sandboxPending" class="space-y-3">
          <div v-for="i in 6" :key="i" class="grid grid-cols-3 gap-2 items-center">
            <Skeleton class="ml-auto h-4 w-24" />
            <Skeleton class="col-span-2 h-9" />
          </div>
        </div>
        <div v-for="(value, key) in sandboxVars" :key="key" class="grid grid-cols-3 gap-2 items-center">
          <Label class="text-right pr-2">{{ key }}</Label>
          <Switch
            v-if="typeof value === 'boolean'"
            :checked="value"
            @update:checked="sandboxVars[key] = $event"
          />
          <Input
            v-else
            :model-value="String(value)"
            type="text"
            class="col-span-2"
            @update:model-value="sandboxVars[key] = $event"
          />
        </div>
        <Button
          :disabled="saving"
          @click="saveSandbox"
        >
          {{ saving ? 'Saving...' : 'Save SandboxVars.lua' }}
        </Button>
      </TabsContent>
    </Tabs>
  </div>
</template>
