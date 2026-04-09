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

interface Variant {
  name: string
  sku: string
  itemCode: string
  gameName: string
  gameCategory: string
  price: number
  compareAtPrice: number | undefined
  quantity: number
  stock: number | undefined
  weight: number | undefined
  badge: string
  imageUrl: string
  metadata: Record<string, unknown> | null
  isDefault: boolean
  isActive: boolean
  selections: Record<string, string>
}

type CheckboxState = boolean | 'indeterminate'

const form = defineModel<{
  optionGroups: OptionGroup[]
  variants: Variant[]
}>('form', { required: true })

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function groupKey(group: { name: string, slug?: string }, index: number) {
  return slugify(group.slug || group.name) || `group-${index + 1}`
}

function optionValueKey(value: { label: string, slug?: string }, index: number) {
  return slugify(value.slug || value.label) || `value-${index + 1}`
}

function addVariant() {
  const firstGroup = form.value.optionGroups[0]
  const firstGroupSlug = firstGroup ? groupKey(firstGroup, 0) : ''
  const firstValue = firstGroup?.values[0]

  form.value.variants.push({
    name: '',
    sku: '',
    itemCode: '',
    gameName: '',
    gameCategory: '',
    price: 0,
    compareAtPrice: undefined,
    quantity: 1,
    stock: undefined,
    weight: undefined,
    badge: '',
    imageUrl: '',
    metadata: null,
    isDefault: false,
    isActive: true,
    selections: firstGroupSlug && firstValue ? { [firstGroupSlug]: optionValueKey(firstValue, 0) } : {},
  })
}

function removeVariant(index: number) {
  if (form.value.variants.length > 1) {
    form.value.variants.splice(index, 1)
  }
}

function toBooleanState(value: CheckboxState) {
  return value === true
}

function updateVariantDefault(index: number, value: CheckboxState) {
  const isDefault = toBooleanState(value)

  form.value.variants.forEach((variant, variantIndex) => {
    if (variantIndex === index) {
      variant.isDefault = isDefault
      return
    }

    if (isDefault) {
      variant.isDefault = false
    }
  })
}

function updateVariantActive(index: number, value: CheckboxState) {
  form.value.variants[index].isActive = toBooleanState(value)
}
</script>

<template>
  <section class="grid gap-6 rounded-xl border border-border/70 bg-card/80 p-6 shadow-xs md:p-7">
      <div class="flex items-start justify-between gap-4">
        <div class="space-y-1">
          <h2 class="text-base font-semibold">
            Variants
          </h2>
          <p class="text-sm text-muted-foreground">
            Each variant maps to a Project Zomboid item code and has its own price and stock.
          </p>
        </div>
        <Button variant="outline" size="sm" type="button" @click="addVariant">
          Add variant
        </Button>
      </div>

      <div class="grid gap-4">
        <Card
          v-for="(variant, variantIndex) in form.variants"
          :key="`variant-${variantIndex}`"
        >
          <CardHeader class="pb-4">
            <div class="flex items-center justify-between gap-3">
              <CardTitle class="text-sm font-medium">
                Variant {{ variantIndex + 1 }}
              </CardTitle>
              <Button
                v-if="form.variants.length > 1"
                variant="ghost"
                size="sm"
                type="button"
                @click="removeVariant(variantIndex)"
              >
                Remove
              </Button>
            </div>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid gap-4 md:grid-cols-2">
              <div class="grid gap-2">
                <Label :for="`variant-name-${variantIndex}`">Variant name</Label>
                <Input :id="`variant-name-${variantIndex}`" v-model="variant.name" placeholder="Left - Army" />
                <p class="text-xs text-muted-foreground">Label for this variant option.</p>
              </div>
              <div class="grid gap-2">
                <Label :for="`variant-sku-${variantIndex}`">SKU</Label>
                <Input :id="`variant-sku-${variantIndex}`" v-model="variant.sku" placeholder="Auto-generated" />
                <p class="text-xs text-muted-foreground">Auto-generated if left blank.</p>
              </div>
              <div class="grid gap-2">
                <Label :for="`variant-itemcode-${variantIndex}`">Item code</Label>
                <Input :id="`variant-itemcode-${variantIndex}`" v-model="variant.itemCode" placeholder="Base.Kneepad_Left_Army" />
                <p class="text-xs text-muted-foreground">
                  The full Project Zomboid item type.
                </p>
              </div>
              <div class="grid gap-2">
                <Label :for="`variant-gamename-${variantIndex}`">Game name</Label>
                <Input :id="`variant-gamename-${variantIndex}`" v-model="variant.gameName" placeholder="Display name in-game" />
                <p class="text-xs text-muted-foreground">In-game display name for this item.</p>
              </div>
              <div class="grid gap-2">
                <Label :for="`variant-gamecat-${variantIndex}`">Game category</Label>
                <Input :id="`variant-gamecat-${variantIndex}`" v-model="variant.gameCategory" placeholder="Clothing" />
                <p class="text-xs text-muted-foreground">Item category in the game.</p>
              </div>
              <div class="grid gap-2">
                <Label :for="`variant-badge-${variantIndex}`">Badge</Label>
                <Input :id="`variant-badge-${variantIndex}`" v-model="variant.badge" placeholder="Optional badge" />
                <p class="text-xs text-muted-foreground">Optional label for this variant.</p>
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-5">
              <div class="grid gap-2">
                <Label :for="`variant-price-${variantIndex}`">Price</Label>
                <Input :id="`variant-price-${variantIndex}`" v-model.number="variant.price" type="number" min="0" />
                <p class="text-xs text-muted-foreground">Base price in points.</p>
              </div>
              <div class="grid gap-2">
                <Label :for="`variant-compare-${variantIndex}`">Compare at</Label>
                <Input :id="`variant-compare-${variantIndex}`" v-model.number="variant.compareAtPrice" type="number" min="0" />
                <p class="text-xs text-muted-foreground">Original price for sale display.</p>
              </div>
              <div class="grid gap-2">
                <Label :for="`variant-qty-${variantIndex}`">Quantity</Label>
                <Input :id="`variant-qty-${variantIndex}`" v-model.number="variant.quantity" type="number" min="1" />
                <p class="text-xs text-muted-foreground">Items per purchase.</p>
              </div>
              <div class="grid gap-2">
                <Label :for="`variant-stock-${variantIndex}`">Stock</Label>
                <Input :id="`variant-stock-${variantIndex}`" v-model.number="variant.stock" type="number" min="0" placeholder="Unlimited" />
                <p class="text-xs text-muted-foreground">Leave empty for unlimited.</p>
              </div>
              <div class="grid gap-2">
                <Label :for="`variant-weight-${variantIndex}`">Weight</Label>
                <Input :id="`variant-weight-${variantIndex}`" v-model.number="variant.weight" type="number" min="0" step="0.01" />
                <p class="text-xs text-muted-foreground">Weight in kilograms.</p>
              </div>
            </div>

            <div class="grid gap-4 md:grid-cols-[1fr_120px]">
              <div class="grid gap-2">
                <Label :for="`variant-image-${variantIndex}`">Image URL</Label>
                <Input :id="`variant-image-${variantIndex}`" v-model="variant.imageUrl" placeholder="https://..." />
                <p class="text-xs text-muted-foreground">Direct link to the variant image.</p>
              </div>
              <div class="flex h-20 items-center justify-center overflow-hidden rounded-lg border bg-muted">
                <img
                  v-if="variant.imageUrl"
                  :src="variant.imageUrl"
                  :alt="variant.gameName || variant.name || 'Preview'"
                  class="size-full object-contain"
                >
                <span v-else class="text-xs text-muted-foreground">No image</span>
              </div>
            </div>

            <FieldSet>
              <div class="grid gap-3 md:grid-cols-2">
                <FieldLabel :for="`variant-default-${variantIndex}`">
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>Default variant</FieldTitle>
                    </FieldContent>
                    <Checkbox
                      :id="`variant-default-${variantIndex}`"
                      :checked="variant.isDefault"
                      @update:checked="updateVariantDefault(variantIndex, $event)"
                    />
                  </Field>
                </FieldLabel>
                <FieldLabel :for="`variant-active-${variantIndex}`">
                  <Field orientation="horizontal">
                    <FieldContent>
                      <FieldTitle>Active</FieldTitle>
                    </FieldContent>
                    <Checkbox
                      :id="`variant-active-${variantIndex}`"
                      :checked="variant.isActive"
                      @update:checked="updateVariantActive(variantIndex, $event)"
                    />
                  </Field>
                </FieldLabel>
              </div>
            </FieldSet>

            <div
              v-if="form.optionGroups.length"
              class="grid gap-4 md:grid-cols-3"
            >
              <div
                v-for="(group, gIdx) in form.optionGroups"
                :key="`variant-${variantIndex}-group-${gIdx}`"
                class="grid gap-2"
              >
                <Label>{{ group.name || `Option ${gIdx + 1}` }}</Label>
                <select
                  v-model="variant.selections[groupKey(group, gIdx)]"
                  class="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option
                    v-for="(val, vIdx) in group.values"
                    :key="`opt-${vIdx}`"
                    :value="optionValueKey(val, vIdx)"
                  >
                    {{ val.label || `Value ${vIdx + 1}` }}
                  </option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
</template>
