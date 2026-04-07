<script setup lang="ts">
import { toast } from 'vue-sonner'
import {
  ArrowLeft,
  Search,
  Tag,
} from 'lucide-vue-next'

const router = useRouter()
const route = useRoute()
const loading = ref(false)
const error = ref('')
const creationMode = ref<'custom' | 'import'>(route.query.mode === 'import' ? 'import' : 'custom')
const importSearch = ref('')
const selectedImportCategoryName = ref('')

interface GameCategoryImportOption {
  name: string
  slug: string
  itemCount: number
  sampleItems: string[]
  alreadyImported: boolean
  existingCategoryId: string | null
  existingCategorySlug: string | null
}

interface GameCategoryImportResponse {
  source: string
  total: number
  categories: GameCategoryImportOption[]
}

const importCatalogDefault: GameCategoryImportResponse = {
  source: 'telemetry',
  total: 0,
  categories: [],
}

const { data: importCatalog, error: importCatalogError } = await useFetch<GameCategoryImportResponse>(
  '/api/store/admin/catalog/categories',
  {
    default: () => importCatalogDefault,
  },
)

const form = reactive({
  name: '',
  slug: '',
  description: '',
  heroTitle: '',
  heroDescription: '',
  accentColor: '#64748b',
  icon: '',
  sortOrder: 0,
  isFeatured: false,
  isActive: true,
})

const filteredImportCategories = computed(() => {
  const query = importSearch.value.trim().toLowerCase()

  if (!query) {
    return importCatalog.value.categories
  }

  return importCatalog.value.categories.filter(category =>
    category.name.toLowerCase().includes(query)
    || category.slug.includes(query)
    || category.sampleItems.some(item => item.toLowerCase().includes(query)),
  )
})

const selectedImportCategory = computed(() => {
  return importCatalog.value.categories.find(category => category.name === selectedImportCategoryName.value) ?? null
})

const pageTitle = computed(() => creationMode.value === 'import' ? 'Import category' : 'Create category')

const pageDescription = computed(() => {
  return creationMode.value === 'import'
    ? 'Start from a Project Zomboid game category, then adjust the storefront details before saving.'
    : 'Create a custom storefront category from scratch.'
})

const submitLabel = computed(() => creationMode.value === 'import' ? 'Import category' : 'Create category')

const submitDisabled = computed(() => {
  if (loading.value) {
    return true
  }

  if (creationMode.value !== 'import') {
    return false
  }

  return !selectedImportCategory.value || selectedImportCategory.value.alreadyImported
})

function buildImportDescription(category: GameCategoryImportOption) {
  return `${category.name} items imported from the Project Zomboid game catalog.`
}

function buildImportHeroDescription(category: GameCategoryImportOption) {
  if (category.sampleItems.length === 0) {
    return `Browse ${category.name.toLowerCase()} items imported from the Project Zomboid catalog.`
  }

  const sampleText = category.sampleItems.slice(0, 2).join(', ')

  return category.itemCount > category.sampleItems.length
    ? `Includes ${sampleText}, and more from the ${category.name.toLowerCase()} catalog.`
    : `Includes ${sampleText}.`
}

function applyImportCategory(category: GameCategoryImportOption) {
  selectedImportCategoryName.value = category.name
  form.name = category.name
  form.slug = category.slug
  form.description = buildImportDescription(category)
  form.heroTitle = category.name
  form.heroDescription = buildImportHeroDescription(category)
  form.isActive = true
}

watch(creationMode, (mode) => {
  const nextQuery = { ...route.query }

  if (mode === 'import') {
    nextQuery.mode = 'import'
  }
  else {
    delete nextQuery.mode
  }

  void router.replace({ query: nextQuery })
})

async function handleSubmit() {
  error.value = ''

  if (creationMode.value === 'import') {
    if (!selectedImportCategory.value) {
      error.value = 'Choose a game category to import.'
      return
    }

    if (selectedImportCategory.value.alreadyImported) {
      error.value = `${selectedImportCategory.value.name} is already imported into the storefront.`
      return
    }
  }

  if (!form.name.trim()) {
    error.value = 'Category name is required.'
    return
  }

  loading.value = true

  try {
    await $fetch('/api/store/admin/categories', {
      method: 'POST',
      body: { ...form },
    })

    toast.success('Category created.')
    await router.push('/admin/store/categories')
  }
  catch (e: unknown) {
    error.value = (e as { data?: { message?: string } })?.data?.message || 'Failed to create category.'
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
        <NuxtLink to="/admin/store/categories">
          <ArrowLeft class="size-4" />
          Back
        </NuxtLink>
      </Button>
    </div>

    <form class="flex flex-col gap-6 px-4 lg:px-6" @submit.prevent="handleSubmit">
      <div class="flex flex-col gap-1">
        <h1 class="text-2xl font-bold">
          {{ pageTitle }}
        </h1>
        <p class="text-sm text-muted-foreground text-balance">
          {{ pageDescription }}
        </p>
      </div>

      <Tabs v-model="creationMode" class="space-y-6">
        <TabsList class="h-auto justify-start gap-1">
          <TabsTrigger value="custom">
            Custom category
          </TabsTrigger>
          <TabsTrigger value="import">
            Import game category
          </TabsTrigger>
        </TabsList>

        <TabsContent value="custom" class="mt-0">
          <Card class="border-dashed bg-card/60 shadow-xs">
            <CardContent class="flex flex-col gap-2 p-5 text-sm text-muted-foreground">
              <p class="font-medium text-foreground">
                Build your own storefront lane.
              </p>
              <p>
                Use this when you want categories that do not map directly to the game catalog, such as seasonal drops, featured collections, or mixed bundles.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import" class="mt-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle class="text-base font-medium">
                Game categories
              </CardTitle>
              <CardDescription>
                Pick a Project Zomboid category to prefill the storefront fields. You can still edit the imported details before saving.
              </CardDescription>
            </CardHeader>
            <CardContent class="space-y-4">
              <Alert v-if="importCatalogError" variant="destructive">
                <AlertDescription>
                  {{ importCatalogError.message || 'Failed to load game categories.' }}
                </AlertDescription>
              </Alert>

              <div class="grid gap-2">
                <Label for="category-import-search">Search game categories</Label>
                <div class="relative">
                  <Search class="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="category-import-search"
                    v-model="importSearch"
                    placeholder="Search by category or sample item…"
                    class="pl-9"
                  />
                </div>
                <p class="text-xs text-muted-foreground">
                  {{ importCatalog.total }} categories available from {{ importCatalog.source }}.
                </p>
              </div>

              <Card>
                <CardContent class="p-0">
                  <ul v-if="filteredImportCategories.length" role="list" class="divide-y divide-border">
                    <li v-for="category in filteredImportCategories" :key="category.slug">
                      <button
                        type="button"
                        class="flex w-full items-start gap-4 px-4 py-4 text-left transition-colors hover:bg-muted/50 lg:px-6"
                        :class="category.name === selectedImportCategoryName ? 'bg-primary/5' : ''"
                        @click="applyImportCategory(category)"
                      >
                        <div class="flex size-10 flex-none items-center justify-center rounded-lg bg-primary/10">
                          <Tag class="size-4 text-primary" />
                        </div>
                        <div class="min-w-0 flex-1">
                          <div class="flex flex-wrap items-center gap-2">
                            <p class="text-sm font-semibold">
                              {{ category.name }}
                            </p>
                            <Badge variant="outline" class="text-xs">
                              {{ category.itemCount }} item{{ category.itemCount === 1 ? '' : 's' }}
                            </Badge>
                            <Badge v-if="category.alreadyImported" variant="secondary" class="text-xs">
                              Imported
                            </Badge>
                          </div>
                          <p class="mt-1 text-xs text-muted-foreground">
                            {{ category.sampleItems.join(', ') || 'No preview items available.' }}
                          </p>
                        </div>
                      </button>
                    </li>
                  </ul>
                  <div v-else class="flex flex-col items-center justify-center py-10 text-center">
                    <p class="text-sm text-muted-foreground">
                      No game categories matched that search.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </CardContent>
          </Card>

          <Alert v-if="selectedImportCategory?.alreadyImported">
            <AlertTitle>Category already imported</AlertTitle>
            <AlertDescription>
              {{ selectedImportCategory.name }} already exists in the storefront.
              <NuxtLink
                v-if="selectedImportCategory.existingCategoryId"
                :to="`/admin/store/categories/${selectedImportCategory.existingCategoryId}`"
                class="ml-1 font-medium underline underline-offset-4"
              >
                Edit the existing category
              </NuxtLink>
              <span v-else class="ml-1">Switch to a custom category if you want a different lane.</span>
            </AlertDescription>
          </Alert>
          <p v-else class="text-xs text-muted-foreground">
            {{ selectedImportCategory
              ? `${selectedImportCategory.itemCount} catalog item${selectedImportCategory.itemCount === 1 ? '' : 's'} map to this category.`
              : 'Choose a game category to prefill the storefront fields below.' }}
          </p>
        </TabsContent>
      </Tabs>

      <section class="grid gap-6 rounded-xl border border-border/70 bg-card/80 p-6 shadow-xs md:p-7">
        <div class="space-y-1">
          <h2 class="text-base font-semibold">
            Category details
          </h2>
          <p class="text-sm text-muted-foreground">
            Set the name, description, and hero copy shown on the category page.
          </p>
        </div>

        <div class="grid gap-5 md:grid-cols-2">
          <div class="grid gap-2">
            <Label for="category-name">Category name</Label>
            <Input
              id="category-name"
              v-model="form.name"
              required
              placeholder="Tactical Gear"
            />
          </div>

          <div class="grid gap-2">
            <Label for="category-slug">Slug</Label>
            <Input
              id="category-slug"
              v-model="form.slug"
              placeholder="Auto-generated from name"
            />
            <p class="text-xs text-muted-foreground">
              URL-safe identifier. Leave blank to generate automatically.
            </p>
          </div>

          <div class="grid gap-2 md:col-span-2">
            <Label for="category-description">Description</Label>
            <Textarea
              id="category-description"
              v-model="form.description"
              :rows="2"
              placeholder="Short description for metadata and previews"
            />
          </div>

          <div class="grid gap-2">
            <Label for="category-hero-title">Hero title</Label>
            <Input
              id="category-hero-title"
              v-model="form.heroTitle"
              placeholder="Headline shown on the category page"
            />
          </div>

          <div class="grid gap-2">
            <Label for="category-icon">Icon keyword</Label>
            <Input
              id="category-icon"
              v-model="form.icon"
              placeholder="shield, weapon, bag"
            />
          </div>

          <div class="grid gap-2 md:col-span-2">
            <Label for="category-hero-desc">Hero description</Label>
            <Textarea
              id="category-hero-desc"
              v-model="form.heroDescription"
              :rows="3"
              placeholder="Supporting text shown below the hero title"
            />
          </div>

          <div class="grid gap-2">
            <Label for="category-accent">Accent color</Label>
            <Input
              id="category-accent"
              v-model="form.accentColor"
              placeholder="#64748b"
            />
          </div>

          <div class="grid gap-2">
            <Label for="category-sort">Sort order</Label>
            <Input
              id="category-sort"
              v-model.number="form.sortOrder"
              type="number"
              min="0"
            />
            <p class="text-xs text-muted-foreground">
              Lower values appear first.
            </p>
          </div>
        </div>

        <FieldSet>
          <FieldLegend>Visibility</FieldLegend>
          <FieldLabel for="category-featured">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Featured category</FieldTitle>
                <FieldDescription>
                  Highlight this category on the storefront landing page.
                </FieldDescription>
              </FieldContent>
              <Checkbox
                id="category-featured"
                :checked="form.isFeatured"
                @update:checked="form.isFeatured = $event"
              />
            </Field>
          </FieldLabel>
          <FieldLabel for="category-active">
            <Field orientation="horizontal">
              <FieldContent>
                <FieldTitle>Active</FieldTitle>
                <FieldDescription>
                  Only active categories are visible to customers.
                </FieldDescription>
              </FieldContent>
              <Checkbox
                id="category-active"
                :checked="form.isActive"
                @update:checked="form.isActive = $event"
              />
            </Field>
          </FieldLabel>
        </FieldSet>
      </section>

      <Alert v-if="error" variant="destructive">
        <AlertDescription>{{ error }}</AlertDescription>
      </Alert>

      <div class="grid gap-2">
        <Button type="submit" class="w-full" :disabled="submitDisabled">
          {{ loading ? (creationMode === 'import' ? 'Importing…' : 'Creating…') : submitLabel }}
        </Button>
        <p class="text-center text-xs text-muted-foreground">
          {{ creationMode === 'import' ? 'Imported category details can be edited later.' : 'You can edit the category details later.' }}
        </p>
      </div>
    </form>
  </div>
</template>
