<script setup lang="ts">
import { formatStoreMoney, type StoreBundleSummary } from '@/lib/store'

const route = useRoute()
const { addItem } = useStoreCart()
const notice = ref('')

const { data } = useLazyFetch(`/api/store/bundles/${route.params.slug}`, {
  default: () => ({
    profile: null,
    bundle: null,
  }),
})

const bundle = computed(() => data.value.bundle as StoreBundleSummary | null)

function addBundleToCart() {
  if (!bundle.value) {
    return
  }

  addItem({
    key: `bundle:${bundle.value.id}`,
    kind: 'bundle',
    title: bundle.value.name,
    subtitle: `${bundle.value.itemCount} bundled items`,
    slug: bundle.value.slug,
    unitPrice: bundle.value.price,
    compareAtUnitPrice: bundle.value.compareAtPrice,
    quantity: 1,
    accentColor: bundle.value.accentColor,
    bundleId: bundle.value.id,
  })

  notice.value = `${bundle.value.name} added to cart`
  window.setTimeout(() => {
    if (notice.value) {
      notice.value = ''
    }
  }, 2400)
}
</script>

<template>
  <div v-if="!bundle" class="mx-auto max-w-6xl space-y-8 px-6 py-10">
    <Skeleton class="h-8 w-28" />
    <section class="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
      <Card>
        <CardHeader class="space-y-4">
          <div class="flex gap-2">
            <Skeleton class="h-6 w-24" />
            <Skeleton class="h-6 w-20" />
          </div>
          <div class="space-y-2">
            <Skeleton class="h-9 w-48" />
            <Skeleton class="h-5 w-full max-w-md" />
          </div>
        </CardHeader>
      </Card>
      <Card class="h-fit">
        <CardHeader>
          <Skeleton class="h-6 w-28" />
          <Skeleton class="h-4 w-36" />
        </CardHeader>
        <CardContent class="space-y-4">
          <Skeleton class="h-9 w-24" />
          <Skeleton class="h-10 w-full" />
        </CardContent>
      </Card>
    </section>
  </div>
  <div v-else class="mx-auto max-w-6xl space-y-8 px-6 py-10">
    <Button variant="ghost" size="sm" as-child>
      <NuxtLink to="/store">
        Back to store
      </NuxtLink>
    </Button>

    <section class="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(320px,0.9fr)]">
      <Card>
        <CardHeader class="space-y-4">
          <div class="flex flex-wrap gap-2">
            <Badge variant="outline">Bundle kit</Badge>
            <Badge v-if="bundle.badge" variant="secondary">
              {{ bundle.badge }}
            </Badge>
          </div>
          <div class="space-y-2">
            <CardTitle class="text-3xl">
              {{ bundle.name }}
            </CardTitle>
            <CardDescription class="max-w-3xl text-base leading-7">
              {{ bundle.description || bundle.summary || 'Bundle together a complete setup for one cleaner purchase.' }}
            </CardDescription>
          </div>
        </CardHeader>
      </Card>

      <Card class="h-fit">
        <CardHeader>
          <CardTitle>Bundle price</CardTitle>
          <CardDescription>
            Includes {{ bundle.itemCount }} line items.
          </CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="space-y-1">
            <p class="text-3xl font-semibold">
              {{ formatStoreMoney(bundle.price) }}
            </p>
            <p
              v-if="bundle.compareAtPrice && bundle.compareAtPrice > bundle.price"
              class="text-sm text-muted-foreground line-through"
            >
              {{ formatStoreMoney(bundle.compareAtPrice) }}
            </p>
          </div>

          <Button
            class="w-full"
            :disabled="bundle.stock === 0"
            @click="addBundleToCart"
          >
            {{ bundle.stock === 0 ? 'Out of stock' : 'Add bundle to cart' }}
          </Button>

          <Alert v-if="notice">
            <AlertDescription>{{ notice }}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </section>

    <Card>
      <CardHeader>
        <CardTitle>Bundle contents</CardTitle>
        <CardDescription>Every item delivered by this bundle purchase.</CardDescription>
      </CardHeader>

      <CardContent class="grid gap-4">
        <Card
          v-for="item in bundle.items"
          :key="`${item.variantId}-${item.quantity}`"
          class="shadow-none"
        >
          <CardContent class="flex items-center justify-between gap-4 p-5">
            <div class="space-y-1">
              <p class="text-sm font-medium">
                {{ item.productName }} / {{ item.variantName }}
              </p>
              <p class="text-sm text-muted-foreground">
                {{ item.itemCode }}
              </p>
            </div>

            <div class="text-right">
              <p class="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Quantity
              </p>
              <p class="text-sm font-medium">
                {{ item.quantity }}
              </p>
            </div>
          </CardContent>
        </Card>
      </CardContent>
    </Card>
  </div>
</template>
