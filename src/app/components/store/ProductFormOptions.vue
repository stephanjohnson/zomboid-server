<script setup lang="ts">
interface OptionGroupValue {
  label: string
  slug: string
  colorHex: string
}

interface OptionGroup {
  name: string
  slug: string
  displayType: 'TEXT' | 'COLOR'
  values: OptionGroupValue[]
}

const form = defineModel<{
  optionGroups: OptionGroup[]
}>('form', { required: true })

function addOptionGroup() {
  form.value.optionGroups.push({
    name: '',
    slug: '',
    displayType: 'TEXT',
    values: [{ label: '', slug: '', colorHex: '' }],
  })
}

function removeOptionGroup(index: number) {
  form.value.optionGroups.splice(index, 1)
}

function addOptionValue(groupIndex: number) {
  form.value.optionGroups[groupIndex]?.values.push({ label: '', slug: '', colorHex: '' })
}

function removeOptionValue(groupIndex: number, valueIndex: number) {
  const group = form.value.optionGroups[groupIndex]
  if (group && group.values.length > 1) {
    group.values.splice(valueIndex, 1)
  }
}
</script>

<template>
  <section class="grid gap-6 rounded-xl border border-border/70 bg-card/80 p-6 shadow-xs md:p-7">
    <div class="flex items-start justify-between gap-4">
      <div class="space-y-1">
        <h2 class="text-base font-semibold">
          Option groups
        </h2>
        <p class="text-sm text-muted-foreground">
          Define variant axes like side, color, or finish. Skip this if the product has only one variant.
        </p>
      </div>
      <Button variant="outline" size="sm" type="button" @click="addOptionGroup">
        Add group
      </Button>
    </div>

    <div v-if="form.optionGroups.length" class="grid gap-4">
      <Card
        v-for="(group, groupIndex) in form.optionGroups"
        :key="`group-${groupIndex}`"
      >
        <CardHeader class="pb-4">
          <div class="flex items-center justify-between gap-3">
            <CardTitle class="text-sm font-medium">
              Option group {{ groupIndex + 1 }}
            </CardTitle>
            <Button variant="ghost" size="sm" type="button" @click="removeOptionGroup(groupIndex)">
              Remove
            </Button>
          </div>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="grid gap-4 md:grid-cols-3">
            <div class="grid gap-2">
              <Label :for="`group-name-${groupIndex}`">Name</Label>
              <Input :id="`group-name-${groupIndex}`" v-model="group.name" placeholder="Side" />
              <p class="text-xs text-muted-foreground">Display name for this option axis.</p>
            </div>
            <div class="grid gap-2">
              <Label :for="`group-slug-${groupIndex}`">Slug</Label>
              <Input :id="`group-slug-${groupIndex}`" v-model="group.slug" placeholder="Auto-generated" />
              <p class="text-xs text-muted-foreground">URL-safe identifier.</p>
            </div>
            <div class="grid gap-2">
              <Label :for="`group-display-${groupIndex}`">Display type</Label>
              <select
                :id="`group-display-${groupIndex}`"
                v-model="group.displayType"
                class="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="TEXT">
                  Text
                </option>
                <option value="COLOR">
                  Color
                </option>
              </select>
              <p class="text-xs text-muted-foreground">How options are presented.</p>
            </div>
          </div>

          <div class="space-y-2">
            <div
              v-for="(value, valueIndex) in group.values"
              :key="`value-${valueIndex}`"
              class="grid gap-3 md:grid-cols-[1fr_1fr_160px_auto]"
            >
              <Input v-model="value.label" :placeholder="`Value ${valueIndex + 1}`" />
              <Input v-model="value.slug" placeholder="Auto-generated" />
              <Input v-model="value.colorHex" placeholder="#94a3b8" />
              <Button variant="ghost" size="sm" type="button" @click="removeOptionValue(groupIndex, valueIndex)">
                Remove
              </Button>
            </div>
          </div>

          <Button variant="outline" size="sm" type="button" @click="addOptionValue(groupIndex)">
            Add value
          </Button>
        </CardContent>
      </Card>
    </div>

    <p v-else class="text-sm text-muted-foreground">
      No option groups defined. The product will have a single variant axis.
    </p>
  </section>
</template>
