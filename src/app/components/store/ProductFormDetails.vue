<script setup lang="ts">
const form = defineModel<{
  summary: string
  description: string
  overview: string
  featureBulletsText: string
  specsText: string
}>('form', { required: true })
</script>

<template>
  <section class="grid gap-6 rounded-xl border border-border/70 bg-card/80 p-6 shadow-xs md:p-7">
    <div class="space-y-1">
      <h2 class="text-base font-semibold">
        Product copy
      </h2>
      <p class="text-sm text-muted-foreground">
        Summary, description, and marketing copy for the storefront listing.
      </p>
    </div>

    <div class="grid gap-5 md:grid-cols-2">
      <div class="grid gap-2 md:col-span-2">
        <Label for="product-summary">Summary</Label>
        <Textarea
          id="product-summary"
          v-model="form.summary"
          :rows="2"
          placeholder="Short product summary for card previews"
        />
        <p class="text-xs text-muted-foreground">
          Brief one-liner for product cards and search results.
        </p>
      </div>

      <div class="grid gap-2 md:col-span-2">
        <Label for="product-description">Description</Label>
        <Textarea
          id="product-description"
          v-model="form.description"
          :rows="3"
          placeholder="Full product description"
        />
        <p class="text-xs text-muted-foreground">
          Shown on the product detail page.
        </p>
      </div>

      <div class="grid gap-2 md:col-span-2">
        <Label for="product-overview">Overview</Label>
        <Textarea
          id="product-overview"
          v-model="form.overview"
          :rows="4"
          placeholder="Detailed overview for the product detail page"
        />
        <p class="text-xs text-muted-foreground">
          Extended copy for the product detail page.
        </p>
      </div>

      <div class="grid gap-2">
        <Label for="product-bullets">Feature bullets</Label>
        <Textarea
          id="product-bullets"
          v-model="form.featureBulletsText"
          :rows="5"
          placeholder="One feature per line"
        />
        <p class="text-xs text-muted-foreground">
          Each line becomes a bullet point on the product page.
        </p>
      </div>

      <div class="grid gap-2">
        <Label for="product-specs">Specs</Label>
        <Textarea
          id="product-specs"
          v-model="form.specsText"
          :rows="5"
          placeholder="Group | Label: Value"
        />
        <p class="text-xs text-muted-foreground">
          Format: Group | Label: Value. One spec per line.
        </p>
      </div>
    </div>
  </section>
</template>
