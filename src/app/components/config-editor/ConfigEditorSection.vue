<script setup lang="ts">
import { ChevronDown } from 'lucide-vue-next'

import ConfigSettingField from '@/components/config-editor/ConfigSettingField.vue'
import type { ConfigDomain, GroupedConfigEntry } from '~~/shared/config-settings'
import { groupConfigEntries, humanizeConfigKey } from '~~/shared/config-settings'

const props = defineProps<{
  profileId: string
  domain: ConfigDomain
  title: string
  description: string
  saveLabel: string
  values: Record<string, string>
  initialValues: Record<string, string>
  pending: boolean
  saving: boolean
  dirtyCount: number
  searchQuery: string
}>()

const emit = defineEmits<{
  save: []
  'update:value': [payload: { key: string, value: string }]
}>()

const openGroups = ref(new Set<string>())

const groups = computed(() => groupConfigEntries(props.domain, props.values))

watch(groups, (nextGroups) => {
  if (openGroups.value.size === 0) {
    openGroups.value = new Set(nextGroups.map(group => group.group))
    return
  }

  const nextOpenGroups = new Set(openGroups.value)
  for (const group of nextGroups) {
    nextOpenGroups.add(group.group)
  }
  openGroups.value = nextOpenGroups
}, { immediate: true })

function matchesSearch(entry: GroupedConfigEntry, groupName: string): boolean {
  const normalizedQuery = props.searchQuery.trim().toLowerCase()
  if (!normalizedQuery) {
    return true
  }

  const label = entry.definition?.label ?? humanizeConfigKey(entry.key)
  const searchValues = [
    groupName,
    entry.key,
    label,
    entry.definition?.description ?? '',
    ...(entry.definition?.searchTerms ?? []),
  ]

  return searchValues.some(value => value.toLowerCase().includes(normalizedQuery))
}

const filteredGroups = computed(() => groups.value
  .map(group => ({
    ...group,
    entries: group.entries.filter(entry => matchesSearch(entry, group.group)),
  }))
  .filter(group => group.entries.length > 0))

function isGroupOpen(groupName: string): boolean {
  return props.searchQuery.trim() ? true : openGroups.value.has(groupName)
}

function setGroupOpen(groupName: string, nextOpenState: boolean) {
  if (props.searchQuery.trim()) {
    return
  }

  const nextGroups = new Set(openGroups.value)
  if (nextOpenState) {
    nextGroups.add(groupName)
  }
  else {
    nextGroups.delete(groupName)
  }

  openGroups.value = nextGroups
}

function updateValue(key: string, value: string) {
  emit('update:value', { key, value })
}
</script>

<template>
  <Card>
    <CardHeader class="gap-4">
      <div class="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div class="space-y-2">
          <div class="flex flex-wrap items-center gap-2">
            <CardTitle>{{ title }}</CardTitle>
            <Badge variant="secondary">{{ Object.keys(values).length }} settings</Badge>
            <Badge v-if="dirtyCount > 0" variant="outline">{{ dirtyCount }} unsaved</Badge>
          </div>

          <CardDescription class="max-w-3xl text-sm leading-relaxed">
            {{ description }}
          </CardDescription>
        </div>

        <Button
          type="button"
          :disabled="pending || saving || dirtyCount === 0"
          @click="emit('save')"
        >
          {{ saving ? 'Saving...' : saveLabel }}
        </Button>
      </div>
    </CardHeader>

    <CardContent class="space-y-4">
      <div v-if="pending" class="grid gap-4 md:grid-cols-2">
        <div
          v-for="index in 4"
          :key="index"
          class="space-y-3 rounded-xl border p-4"
        >
          <Skeleton class="h-5 w-32" />
          <Skeleton class="h-4 w-full" />
          <Skeleton class="h-10 w-full" />
        </div>
      </div>

      <template v-else>
        <Collapsible
          v-for="group in filteredGroups"
          :key="group.group"
          v-slot="{ open }"
          :open="isGroupOpen(group.group)"
          @update:open="setGroupOpen(group.group, $event)"
        >
          <div class="rounded-xl border bg-muted/10">
            <CollapsibleTrigger as-child>
              <button
                type="button"
                class="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
              >
                <div class="flex flex-wrap items-center gap-2">
                  <span class="text-sm font-medium text-foreground">{{ group.group }}</span>
                  <Badge variant="secondary">{{ group.entries.length }}</Badge>
                </div>

                <ChevronDown
                  class="size-4 text-muted-foreground transition-transform"
                  :class="open ? 'rotate-180' : ''"
                />
              </button>
            </CollapsibleTrigger>

            <CollapsibleContent>
              <div class="grid gap-4 border-t px-4 py-4 md:grid-cols-2 xl:grid-cols-3">
                <ConfigSettingField
                  v-for="entry in group.entries"
                  :key="entry.key"
                  :profile-id="profileId"
                  :domain="domain"
                  :setting-key="entry.key"
                  :value="entry.value"
                  :initial-value="initialValues[entry.key] ?? ''"
                  :definition="entry.definition"
                  @update:value="updateValue(entry.key, $event)"
                />
              </div>
            </CollapsibleContent>
          </div>
        </Collapsible>

        <div
          v-if="filteredGroups.length === 0"
          class="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground"
        >
          No settings match "{{ searchQuery }}".
        </div>
      </template>
    </CardContent>
  </Card>
</template>