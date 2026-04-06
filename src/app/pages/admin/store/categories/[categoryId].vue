<script setup lang="ts">
import { toast } from 'vue-sonner'
import { ArrowLeft } from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const categoryId = route.params.categoryId as string

interface CategoryGetResponse {
  category: {
    name: string
    slug: string
    description: string | null
    heroTitle: string | null
    heroDescription: string | null
    accentColor: string | null
    icon: string | null
    sortOrder: number
    isFeatured: boolean
    isActive: boolean
  }
}

const { data: categoryData, error: fetchError } = await useFetch<CategoryGetResponse>(
  `/api/store/admin/categories/${categoryId}`,
)

if (fetchError.value) {
  throw createError({ statusCode: 404, statusMessage: 'Category not found' })
}

const loading = ref(false)
const error = ref('')

const category = categoryData.value!.category

const form = reactive({
  name: category.name || '',
  slug: category.slug || '',
  description: category.description || '',
  heroTitle: category.heroTitle || '',
  heroDescription: category.heroDescription || '',
  accentColor: category.accentColor || '#64748b',
  icon: category.icon || '',
  sortOrder: category.sortOrder ?? 0,
  isFeatured: category.isFeatured ?? false,
  isActive: category.isActive ?? true,
})

async function handleSubmit() {
  error.value = ''

  if (!form.name.trim()) {
    error.value = 'Category name is required.'
    return
  }

  loading.value = true

  try {
    await $fetch(`/api/store/admin/categories/${categoryId}`, {
      method: 'PATCH',
      body: { ...form },
    })

    toast.success('Category updated.')
    await router.push('/admin/store/categories')
  }
  catch (e: unknown) {
    error.value = (e as { data?: { message?: string } })?.data?.message || 'Failed to update category.'
  }
  finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
    <div class="flex items-center gap-4 px-4 lg:px-6">
      <Button variant="ghost" size="sm" as-child>
        <NuxtLink to="/admin/store">
          <ArrowLeft class="size-4" />
          Back
        </NuxtLink>
      </Button>
    </div>

    <form class="flex flex-col gap-6 px-4 lg:px-6" @submit.prevent="handleSubmit">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-bold">
          Edit category
        </h1>
        <p class="text-sm text-muted-foreground text-balance">
          Update the category details and storefront copy.
        </p>
      </div>

      <section class="grid gap-6 rounded-xl border border-border/70 bg-card/80 p-6 shadow-xs md:p-7">
        <div class="space-y-1">
          <h2 class="text-base font-semibold">
            Category details
          </h2>
          <p class="text-sm text-muted-foreground">
            Name, description, and hero copy shown on the category page.
          </p>
        </div>

        <div class="grid gap-5 md:grid-cols-2">
          <div class="grid gap-2">
            <Label for="category-name">Category name</Label>
            <Input id="category-name" v-model="form.name" required placeholder="Tactical Gear" />
          </div>
          <div class="grid gap-2">
            <Label for="category-slug">Slug</Label>
            <Input id="category-slug" v-model="form.slug" placeholder="Auto-generated from name" />
            <p class="text-xs text-muted-foreground">Changing the slug may break existing links.</p>
          </div>
          <div class="grid gap-2 md:col-span-2">
            <Label for="category-description">Description</Label>
            <Textarea id="category-description" v-model="form.description" :rows="2" placeholder="Short description" />
          </div>
          <div class="grid gap-2">
            <Label for="category-hero-title">Hero title</Label>
            <Input id="category-hero-title" v-model="form.heroTitle" placeholder="Headline on category page" />
          </div>
          <div class="grid gap-2">
            <Label for="category-icon">Icon keyword</Label>
            <Input id="category-icon" v-model="form.icon" placeholder="shield, weapon, bag" />
          </div>
          <div class="grid gap-2 md:col-span-2">
            <Label for="category-hero-desc">Hero description</Label>
            <Textarea id="category-hero-desc" v-model="form.heroDescription" :rows="3" placeholder="Supporting text below the hero title" />
          </div>
          <div class="grid gap-2">
            <Label for="category-accent">Accent color</Label>
            <Input id="category-accent" v-model="form.accentColor" placeholder="#64748b" />
          </div>
          <div class="grid gap-2">
            <Label for="category-sort">Sort order</Label>
            <Input id="category-sort" v-model.number="form.sortOrder" type="number" min="0" />
            <p class="text-xs text-muted-foreground">Lower values appear first.</p>
          </div>
        </div>

        <FieldSet>
          <FieldLegend>Visibility</FieldLegend>
          <FieldLabel for="category-featured">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Featured category</FieldTitle>
                <FieldDescription>Highlight on the storefront landing page.</FieldDescription>
              </FieldContent>
              <Checkbox id="category-featured" :checked="form.isFeatured" @update:checked="form.isFeatured = $event" />
            </Field>
          </FieldLabel>
          <FieldLabel for="category-active">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Active</FieldTitle>
                <FieldDescription>Only active categories are visible to customers.</FieldDescription>
              </FieldContent>
              <Checkbox id="category-active" :checked="form.isActive" @update:checked="form.isActive = $event" />
            </Field>
          </FieldLabel>
        </FieldSet>
      </section>

      <Alert v-if="error" variant="destructive">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div class="grid gap-2">
        <Button type="submit" class="w-full" :disabled="loading">
          {{ loading ? 'Saving…' : 'Save changes' }}
        </Button>
        <p class="text-center text-xs text-muted-foreground">
          Changes are applied immediately.
        </p>
      </div>
    </form>
  </div>
</template>
