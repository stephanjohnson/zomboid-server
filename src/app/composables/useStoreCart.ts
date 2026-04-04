import type { StoreCartItem } from '@/lib/store'

const STORAGE_KEY = 'zomboid-store-cart'

export function useStoreCart() {
  const items = useState<StoreCartItem[]>('store-cart-items', () => [])
  const hydrated = useState('store-cart-hydrated', () => false)
  const watching = useState('store-cart-watching', () => false)

  if (import.meta.client && !hydrated.value) {
    const rawValue = window.localStorage.getItem(STORAGE_KEY)
    if (rawValue) {
      try {
        const parsed = JSON.parse(rawValue) as StoreCartItem[]
        if (Array.isArray(parsed)) {
          items.value = parsed
        }
      }
      catch {
        items.value = []
      }
    }

    hydrated.value = true
  }

  if (import.meta.client && !watching.value) {
    watch(items, (nextItems) => {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextItems))
    }, { deep: true })

    watching.value = true
  }

  const itemCount = computed(() => items.value.reduce((total, item) => total + item.quantity, 0))
  const subtotal = computed(() => items.value.reduce((total, item) => total + (item.unitPrice * item.quantity), 0))
  const compareAtTotal = computed(() => items.value.reduce((total, item) => total + ((item.compareAtUnitPrice ?? item.unitPrice) * item.quantity), 0))
  const savings = computed(() => Math.max(0, compareAtTotal.value - subtotal.value))

  function addItem(item: StoreCartItem) {
    const existing = items.value.find(entry => entry.key === item.key)
    if (existing) {
      existing.quantity = existing.quantity + item.quantity
      return
    }

    items.value = [...items.value, item]
  }

  function updateQuantity(key: string, quantity: number) {
    if (quantity <= 0) {
      removeItem(key)
      return
    }

    items.value = items.value.map(item => item.key === key ? { ...item, quantity } : item)
  }

  function removeItem(key: string) {
    items.value = items.value.filter(item => item.key !== key)
  }

  function clear() {
    items.value = []
  }

  return {
    items,
    itemCount,
    subtotal,
    compareAtTotal,
    savings,
    addItem,
    updateQuantity,
    removeItem,
    clear,
  }
}
