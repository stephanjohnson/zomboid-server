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

const activeTab = ref<'server-ini' | 'sandbox'>('server-ini')
</script>

<template>
    <div class="flex flex-col gap-4 md:gap-6">
        <div>
            <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <Tabs v-model="activeTab">
                    <TabsList class="h-auto flex-wrap justify-start gap-2">
                        <TabsTrigger value="server-ini" class="gap-2">
                            <span>Server Settings</span>
                            <Badge v-if="serverDirtyCount > 0" variant="outline">{{ serverDirtyCount }} unsaved
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger value="sandbox" class="gap-2">
                            <span>Sandbox Rules</span>
                            <Badge v-if="sandboxDirtyCount > 0" variant="outline">{{ sandboxDirtyCount }} unsaved
                            </Badge>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div class="relative w-full max-w-sm shrink-0">
                    <Search
                        class="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input v-model="searchQuery" type="search" placeholder="Search settings, groups, or descriptions..."
                        class="pl-9" />
                </div>
            </div>
        </div>

        <div v-if="errorMessage" class="px-4 lg:px-6">
            <Alert variant="destructive">
                <AlertDescription>{{ errorMessage }}</AlertDescription>
            </Alert>
        </div>

        <div v-if="successMessage" class="px-4 lg:px-6">
            <Alert>
                <AlertDescription>{{ successMessage }}</AlertDescription>
            </Alert>
        </div>

        <Tabs v-model="activeTab">
            <TabsContent value="server-ini">
                <ConfigEditorSection :profile-id="profileId" domain="server-ini" title="Server Settings"
                    description="Profile-backed ports, PvP, map, and player limits are edited here and written back to the profile model. Mod lists stay read-only so the mods page remains the source of truth."
                    save-label="Save server.ini settings" :values="serverValues" :initial-values="serverInitialValues"
                    :pending="serverPending" :saving="savingServer" :dirty-count="serverDirtyCount"
                    :search-query="searchQuery" @save="saveServerSettings"
                    @update:value="updateServerValue($event.key, $event.value)" />
            </TabsContent>

            <TabsContent value="sandbox">
                <ConfigEditorSection :profile-id="profileId" domain="sandbox" title="Sandbox Rules"
                    description="Sandbox settings are grouped around gameplay topics like zombie behavior, respawn, food, and progression. The editor saves nested SandboxVars data correctly, so grouped settings map back to valid Lua tables."
                    save-label="Save sandbox rules" :values="sandboxValues" :initial-values="sandboxInitialValues"
                    :pending="sandboxPending" :saving="savingSandbox" :dirty-count="sandboxDirtyCount"
                    :search-query="searchQuery" @save="saveSandboxSettings"
                    @update:value="updateSandboxValue($event.key, $event.value)" />
            </TabsContent>
        </Tabs>
    </div>
</template>
