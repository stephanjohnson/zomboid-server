<script setup lang="ts">
import { formatStoreMoney } from '@/lib/store'

const { items, subtotal, savings, updateQuantity, removeItem, clear } = useStoreCart()
</script>

<template>
  <div class="mx-auto max-w-6xl space-y-6 px-6 py-10">
    <Button variant="ghost" size="sm" as-child>
      <NuxtLink to="/store">
        Continue shopping
      </NuxtLink>
    </Button>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_320px]">
      <Card>
        <CardHeader class="gap-4">
          <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div class="space-y-2">
              <CardTitle>Review your cart</CardTitle>
              <CardDescription>
                Adjust quantities, remove items, and confirm the mix of variants and bundles before checkout is wired up.
              </CardDescription>
            </div>

            <Button variant="outline" :disabled="!items.length" @click="clear">
              Clear cart
            </Button>
          </div>
        </CardHeader>

        <CardContent class="space-y-4">
          <div v-if="items.length" class="space-y-4">
            <Card
              v-for="item in items"
              :key="item.key"
              class="shadow-none"
            >
              <CardContent class="space-y-4 p-6">
                <div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div class="space-y-1">
                    <Badge variant="outline">
                      {{ item.kind === 'bundle' ? 'Bundle' : 'Variant' }}
                    </Badge>
                    <h2 class="text-xl font-semibold">
                      {{ item.title }}
                    </h2>
                    <p class="text-sm text-muted-foreground">
                      {{ item.subtitle || item.itemCode }}
                    </p>
                  </div>

                  <div class="flex items-center gap-2">
                    <Button variant="outline" size="icon-sm" @click="updateQuantity(item.key, item.quantity - 1)">
                      -
                    </Button>
                    <span class="w-10 text-center text-sm font-medium">
                      {{ item.quantity }}
                    </span>
                    <Button variant="outline" size="icon-sm" @click="updateQuantity(item.key, item.quantity + 1)">
                      +
                    </Button>
                    <Button variant="ghost" @click="removeItem(item.key)">
                      Remove
                    </Button>
                  </div>
                </div>

                <div class="flex items-center justify-between border-t pt-4 text-sm">
                  <span class="text-muted-foreground">{{ formatStoreMoney(item.unitPrice) }} each</span>
                  <span class="font-medium">{{ formatStoreMoney(item.unitPrice * item.quantity) }}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card v-else class="border-dashed shadow-none">
            <CardContent class="p-10 text-center text-sm text-muted-foreground">
              Your cart is empty.
            </CardContent>
          </Card>
        </CardContent>
      </Card>

      <Card class="h-fit">
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Current cart totals before wallet debit and delivery hooks are added.</CardDescription>
        </CardHeader>
        <CardContent class="space-y-4">
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">Subtotal</span>
            <span>{{ formatStoreMoney(subtotal) }}</span>
          </div>
          <div class="flex items-center justify-between text-sm">
            <span class="text-muted-foreground">Savings</span>
            <span>{{ formatStoreMoney(savings) }}</span>
          </div>
          <div class="flex items-center justify-between border-t pt-4">
            <span class="text-sm text-muted-foreground">Estimated total</span>
            <span class="text-2xl font-semibold">{{ formatStoreMoney(subtotal) }}</span>
          </div>

          <Alert>
            <AlertDescription>
              Checkout, wallet debit, and live item delivery can be wired on top of this cart next. The catalog, bundles, variants, and recommendation plumbing are already in place.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  </div>
</template>
