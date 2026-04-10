<script setup lang="ts">
import { Search } from 'lucide-vue-next'

import ConfigEditorSection from '@/components/config-editor/ConfigEditorSection.vue'

const props = defineProps<{
  profileId: string
}>()

const {
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
} = useProfileConfigEditor(props.profileId)
</script>

<template>
  <div class="mx-auto max-w-7xl space-y-6">
    <div class="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div class="space-y-2">
        <h1 class="text-2xl font-semibold tracking-tight">
          Configuration
        </h1>
        <p class="max-w-3xl text-sm text-muted-foreground">
          Edit server.ini and SandboxVars.lua through grouped controls instead of raw key/value rows.
          Every setting exposes its exact saved value through Advanced, so expanding the metadata later does not remove the raw escape hatch.
        </p>
      </div>

      <div class="relative w-full max-w-sm">
        <Search class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          v-model="searchQuery"
          type="search"
          placeholder="Search settings, groups, or descriptions..."
          class="pl-9"
        />
      </div>
    </div>

    <Alert>
      <AlertDescription>
        Friendly controls are defined in code, not the database, so labels, descriptions, docs links, and future translations can evolve without touching persisted config.
      </AlertDescription>
    </Alert>

    <Alert v-if="errorMessage" variant="destructive">
      <AlertDescription>{{ errorMessage }}</AlertDescription>
    </Alert>

    <Alert v-if="successMessage">
      <AlertDescription>{{ successMessage }}</AlertDescription>
    </Alert>

    <ConfigEditorSection
      :profile-id="profileId"
      domain="server-ini"
      title="Server Settings"
      description="Profile-backed ports, PvP, map, and player limits are edited here and written back to the profile model. Mod lists stay read-only so the mods page remains the source of truth."
      save-label="Save server.ini settings"
      :values="serverValues"
      :initial-values="serverInitialValues"
      :pending="serverPending"
      :saving="savingServer"
      :dirty-count="serverDirtyCount"
      :search-query="searchQuery"
      @save="saveServerSettings"
      @update:value="updateServerValue($event.key, $event.value)"
    />

    <ConfigEditorSection
      :profile-id="profileId"
      domain="sandbox"
      title="Sandbox Rules"
      description="Sandbox settings are grouped around gameplay topics like zombie behavior, respawn, food, and progression. The editor saves nested SandboxVars data correctly, so grouped settings map back to valid Lua tables."
      save-label="Save sandbox rules"
      :values="sandboxValues"
      :initial-values="sandboxInitialValues"
      :pending="sandboxPending"
      :saving="savingSandbox"
      :dirty-count="sandboxDirtyCount"
      :search-query="searchQuery"
      @save="saveSandboxSettings"
      @update:value="updateSandboxValue($event.key, $event.value)"
    />
  </div>
</template>