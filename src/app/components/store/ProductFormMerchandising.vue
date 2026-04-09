<script setup lang="ts">
const form = defineModel<{
  badge: string
  accentColor: string
  sortOrder: number
  categoryIds: string[]
  recommendationProductIds: string[]
}>('form', { required: true })

defineProps<{
  categories: Array<{ id: string, name: string }>
  recommendationOptions: Array<{ id: string, name: string }>
}>()

function toggleSelection(collection: string[], id: string) {
  return collection.includes(id)
    ? collection.filter(value => value !== id)
    : [...collection, id]
}
</script>

<template>
  <section class="grid gap-6 rounded-xl border border-border/70 bg-card/80 p-6 shadow-xs md:p-7">
    <div class="space-y-1">
      <h2 class="text-base font-semibold">
        Merchandising
      </h2>
      <p class="text-sm text-muted-foreground">
        Control how the product appears in the storefront catalog.
      </p>
    </div>

    <div class="grid gap-5 md:grid-cols-2">
      <div class="grid gap-2">
        <Label for="product-badge">Badge</Label>
        <Input
          id="product-badge"
          v-model="form.badge"
          placeholder="New, Hot, Limited"
        />
        <p class="text-xs text-muted-foreground">
          Optional label shown on the product card.
        </p>
      </div>

      <div class="grid gap-2">
        <Label for="product-accent">Accent color</Label>
        <Input
          id="product-accent"
          v-model="form.accentColor"
          placeholder="#b45309"
        />
        <p class="text-xs text-muted-foreground">
          Hex color for card highlights and accents.
        </p>
      </div>

      <div class="grid gap-2">
        <Label for="product-sort">Sort order</Label>
        <Input
          id="product-sort"
          v-model.number="form.sortOrder"
          type="number"
          min="0"
        />
        <p class="text-xs text-muted-foreground">
          Lower values appear first in the catalog.
        </p>
      </div>
    </div>

    <div class="grid gap-5 md:grid-cols-2">
      <div class="grid gap-2">
        <Label>Categories</Label>
        <div class="grid max-h-48 gap-1 overflow-y-auto rounded-lg border p-3">
          <FieldLabel
            v-for="category in categories"
            :key="category.id"
            :for="`cat-${category.id}`"
          >
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle class="text-sm font-normal">{{ category.name }}</FieldTitle>
              </FieldContent>
              <Checkbox
                :id="`cat-${category.id}`"
                :checked="form.categoryIds.includes(category.id)"
                @update:checked="form.categoryIds = toggleSelection(form.categoryIds, category.id)"
              />
            </Field>
          </FieldLabel>
          <p v-if="!categories.length" class="py-2 text-center text-xs text-muted-foreground">
            No categories yet. Create one first.
          </p>
        </div>
      </div>

      <div class="grid gap-2">
        <Label>Recommended add-ons</Label>
        <div class="grid max-h-48 gap-1 overflow-y-auto rounded-lg border p-3">
          <FieldLabel
            v-for="rec in recommendationOptions"
            :key="rec.id"
            :for="`rec-${rec.id}`"
          >
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle class="text-sm font-normal">{{ rec.name }}</FieldTitle>
              </FieldContent>
              <Checkbox
                :id="`rec-${rec.id}`"
                :checked="form.recommendationProductIds.includes(rec.id)"
                @update:checked="form.recommendationProductIds = toggleSelection(form.recommendationProductIds, rec.id)"
              />
            </Field>
          </FieldLabel>
          <p v-if="!recommendationOptions.length" class="py-2 text-center text-xs text-muted-foreground">
            No other products to recommend yet.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
