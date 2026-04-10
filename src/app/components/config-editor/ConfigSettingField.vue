<script setup lang="ts">
import { ExternalLink } from 'lucide-vue-next'

import type { ConfigDomain, ConfigSettingDefinition } from '~~/shared/config-settings'
import { getDefaultRawValue, humanizeConfigKey } from '~~/shared/config-settings'

const props = defineProps<{
  profileId: string
  domain: ConfigDomain
  settingKey: string
  value: string
  initialValue: string
  definition?: ConfigSettingDefinition
}>()

const emit = defineEmits<{
  'update:value': [value: string]
}>()

const showAdvanced = ref(false)

const label = computed(() => props.definition?.label ?? humanizeConfigKey(props.settingKey))
const dirty = computed(() => props.value !== props.initialValue)
const isManaged = computed(() => props.definition?.persistence === 'managed')
const isProfileBacked = computed(() => props.definition?.persistence === 'profile-field')
const defaultRawValue = computed(() => getDefaultRawValue(props.definition))
const listItems = computed(() => props.value.split(';').map(item => item.trim()).filter(Boolean))
const advancedInputId = computed(() => `advanced-${props.domain}-${props.settingKey.replace(/[^a-zA-Z0-9_-]/g, '-')}`)
const numericValue = computed(() => {
  if (props.definition?.control !== 'number') {
    return undefined
  }

  const nextValue = props.value.trim()
  if (!nextValue) {
    return undefined
  }

  const parsedValue = Number(nextValue)
  return Number.isFinite(parsedValue) ? parsedValue : undefined
})

const companionLink = computed(() => {
  if (isManaged.value && props.definition?.managedTarget === 'mods') {
    return {
      href: `/profiles/${props.profileId}/mods`,
      label: 'Open mods page',
    }
  }

  if (isProfileBacked.value) {
    return {
      href: `/profiles/${props.profileId}/edit`,
      label: 'Open profile basics',
    }
  }

  return null
})

function updateValue(nextValue: unknown) {
  emit('update:value', nextValue === null ? '' : String(nextValue))
}

function updateNumberValue(nextValue: number | null | undefined) {
  if (nextValue === null || nextValue === undefined || Number.isNaN(nextValue)) {
    emit('update:value', '')
    return
  }

  emit('update:value', String(nextValue))
}

function updateBooleanValue(nextValue: boolean | 'indeterminate') {
  if (typeof nextValue !== 'boolean') {
    return
  }

  emit('update:value', nextValue ? 'true' : 'false')
}

function resetToDefault() {
  if (defaultRawValue.value === null) {
    return
  }

  emit('update:value', defaultRawValue.value)
}
</script>

<template>
  <article class="flex h-full flex-col gap-4 rounded bg-background p-4">
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-2">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="text-base font-semibold leading-tight text-foreground">
            {{ label }}
          </h3>

          <Badge v-if="dirty" variant="secondary">Unsaved</Badge>
          <Badge v-if="isManaged" variant="outline">Managed</Badge>
          <Badge v-else-if="isProfileBacked" variant="outline">Profile-backed</Badge>
        </div>

        <p class="text-sm leading-relaxed text-muted-foreground">
          {{ definition?.description ?? 'No description yet. Open Advanced to edit the raw value directly.' }}
        </p>

        <div class="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <NuxtLink
            v-if="definition?.docsUrl"
            :to="definition.docsUrl"
            external
            target="_blank"
            class="inline-flex items-center gap-1 hover:text-foreground"
          >
            Wiki
            <ExternalLink class="size-3" />
          </NuxtLink>

          <NuxtLink
            v-if="companionLink"
            :to="companionLink.href"
            class="hover:text-foreground"
          >
            {{ companionLink.label }}
          </NuxtLink>
        </div>
      </div>

      <Button
        type="button"
        variant="ghost"
        class="h-8 shrink-0 px-2 text-xs text-muted-foreground hover:text-foreground"
        @click="showAdvanced = !showAdvanced"
      >
        {{ showAdvanced ? 'Hide Advanced' : 'Advanced' }}
      </Button>
    </div>

    <div class="space-y-4">
      <div v-if="definition?.control === 'list'" class="flex min-h-10 flex-wrap items-center gap-2">
        <Badge v-for="item in listItems" :key="item" variant="secondary">
          {{ item }}
        </Badge>
        <span v-if="listItems.length === 0" class="text-sm text-muted-foreground">No entries</span>
      </div>

      <div v-else-if="definition?.control === 'switch'" class="flex min-h-10 items-center justify-between gap-4">
        <p class="text-sm font-medium">
          {{ value === 'true' ? 'Enabled' : 'Disabled' }}
        </p>

        <Switch
          :checked="value === 'true'"
          :disabled="isManaged"
          @update:checked="updateBooleanValue"
        />
      </div>

      <Select
        v-else-if="definition?.control === 'select' && definition.options"
        :model-value="value"
        :disabled="isManaged"
        @update:model-value="updateValue"
      >
        <SelectTrigger>
          <SelectValue :placeholder="label" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem
            v-for="option in definition.options"
            :key="option.value"
            :value="option.value"
          >
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>

      <NumberField
        v-else-if="definition?.control === 'number'"
        :model-value="numericValue"
        :disabled="isManaged"
        :min="definition?.min"
        :max="definition?.max"
        :step="definition?.step"
        @update:model-value="updateNumberValue"
      >
        <NumberFieldContent>
          <NumberFieldDecrement />
          <NumberFieldInput class="h-10" />
          <NumberFieldIncrement />
        </NumberFieldContent>
      </NumberField>

      <Input
        v-else
        :model-value="value"
        :type="definition?.sensitive ? 'password' : 'text'"
        :disabled="isManaged"
        @update:model-value="updateValue"
      />

      <div v-if="showAdvanced" class="space-y-3 border-t border-border/60 pt-3">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="space-y-1">
            <Label :for="advancedInputId">Raw Value</Label>
            <p class="text-xs text-muted-foreground">
              Saved under {{ settingKey }}
            </p>
          </div>

          <Button
            v-if="defaultRawValue !== null && !isManaged"
            type="button"
            variant="outline"
            class="h-8 px-3 text-xs"
            @click="resetToDefault"
          >
            Use Default
          </Button>
        </div>

        <Input
          :id="advancedInputId"
          :model-value="value"
          type="text"
          :disabled="isManaged"
          @update:model-value="updateValue"
        />

        <p v-if="isManaged" class="text-xs text-muted-foreground">
          This setting is mirrored from the mods page so workshop IDs and mod IDs stay consistent.
        </p>
        <p v-else-if="isProfileBacked" class="text-xs text-muted-foreground">
          This setting is stored on the profile itself and then written into server.ini when the runtime files are generated.
        </p>
        <p v-else-if="defaultRawValue !== null" class="text-xs text-muted-foreground">
          Default raw value: {{ defaultRawValue }}
        </p>
      </div>
    </div>
  </article>
</template>