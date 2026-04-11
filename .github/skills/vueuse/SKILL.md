---
name: vueuse
description: Use when working with VueUse composables - track mouse position with useMouse, manage localStorage with useStorage, detect network status with useNetwork, debounce values with refDebounced, and access browser APIs reactively. Check VueUse before writing custom composables - most patterns already implemented.
license: MIT
metadata:
  version: "1.0.0"
---

# VueUse

Collection of essential Vue Composition utilities. Check VueUse before writing custom composables - most patterns already implemented.

**Current stable:** VueUse 14.x for Vue 3.5+

## Installation

**Vue 3:**

```bash
pnpm add @vueuse/core
```

**Nuxt:**

```bash
pnpm add @vueuse/nuxt @vueuse/core
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@vueuse/nuxt'],
})
```

Nuxt module auto-imports composables - no import needed.

## When to Use

- Looking for an existing composable before writing a custom one
- Adding reactive wrappers for browser APIs, sensors, storage, time, or network state
- Debouncing, throttling, sharing, or persisting reactive values
- Handling SSR-safe browser integrations in Vue or Nuxt

## Core Principles

- Check VueUse before creating a one-off composable for a common browser or state pattern.
- Prefer the smallest composable that solves the problem instead of composing a large stack of helpers by default.
- Be explicit about SSR boundaries when the composable touches browser APIs.
- Keep local feature logic in your app composables and use VueUse for reusable infrastructure concerns.

## 1) Confirm whether VueUse already covers the use case (required)

- Start with [references/composables.md](references/composables.md) when you need discovery by category.
- Load the specific composable file only after you know which utility matches the task.

## 2) Choose the right composable category (required)

- Browser and sensors -> `useMouse`, `useClipboard`, `useMediaQuery`, `useNetwork`
- State persistence -> `useLocalStorage`, `useSessionStorage`, `useRefHistory`
- Timing and watch helpers -> `refDebounced`, `watchDebounced`, `useInterval`, `useTimeout`
- Elements and observers -> `useElementSize`, `useResizeObserver`, `useIntersectionObserver`
- Shared patterns -> `createSharedComposable`, `useVModel`, `useVirtualList`

## 3) Apply VueUse intentionally inside app code

- Wrap a VueUse composable in an app-specific composable only when you need domain logic, typing, or composition around it.
- Avoid hiding browser-only assumptions inside universal code.
- Keep the reactive contract simple for callers; do not re-wrap everything unnecessarily.

## 4) Handle SSR and element targets explicitly

- Guard browser-only behavior with `isClient`, lifecycle hooks, or SSR-safe composables.
- Normalize component refs to elements before passing them to DOM-focused utilities.

## 5) Final self-check before finishing

- VueUse was checked before writing a custom composable.
- The chosen composable category matches the problem.
- SSR behavior is safe and intentional.
- App-specific wrappers add real value instead of indirection.
- Only the relevant reference files were loaded.

## Categories

| Category   | Examples                                                   |
| ---------- | ---------------------------------------------------------- |
| State      | useLocalStorage, useSessionStorage, useRefHistory          |
| Elements   | useElementSize, useIntersectionObserver, useResizeObserver |
| Browser    | useClipboard, useFullscreen, useMediaQuery                 |
| Sensors    | useMouse, useKeyboard, useDeviceOrientation                |
| Network    | useFetch, useWebSocket, useEventSource                     |
| Animation  | useTransition, useInterval, useTimeout                     |
| Component  | useVModel, useVirtualList, useTemplateRefsList             |
| Watch      | watchDebounced, watchThrottled, watchOnce                  |
| Reactivity | createSharedComposable, toRef, toReactive                  |
| Array      | useArrayFilter, useArrayMap, useSorted                     |
| Time       | useDateFormat, useNow, useTimeAgo                          |
| Utilities  | useDebounce, useThrottle, useMemoize                       |

## Quick Reference

Load composable files based on what you need:

| Working on...        | Load file                                              |
| -------------------- | ------------------------------------------------------ |
| Finding a composable | [references/composables.md](references/composables.md) |
| Specific composable  | `composables/<name>.md`                                |

## Loading Files

**Consider loading these reference files based on your task:**

- [ ] [references/composables.md](references/composables.md) - if searching for VueUse composables by category or functionality

**DO NOT load all files at once.** Load only what's relevant to your current task.

## Common Patterns

**State persistence:**

```ts
const state = useLocalStorage('my-key', { count: 0 })
```

**Mouse tracking:**

```ts
const { x, y } = useMouse()

_Token efficiency: Main skill ~300 tokens, references/composables.md ~200 tokens, specific composable docs vary by topic_
```

**Debounced ref:**

```ts
const search = ref('')
const debouncedSearch = refDebounced(search, 300)
```

**Shared composable (singleton):**

```ts
const useSharedMouse = createSharedComposable(useMouse)
```

## SSR Gotchas

Many VueUse composables use browser APIs unavailable during SSR.

**Check with `isClient`:**

```ts
import { isClient } from '@vueuse/core'

if (isClient) {
  // Browser-only code
  const { width } = useWindowSize()
}
```

**Wrap in onMounted:**

```ts
const width = ref(0)

onMounted(() => {
  // Only runs in browser
  const { width: w } = useWindowSize()
  width.value = w.value
})
```

**Use SSR-safe composables:**

```ts
// These check isClient internally
const mouse = useMouse() // Returns {x: 0, y: 0} on server
const storage = useLocalStorage('key', 'default') // Uses default on server
```

**`@vueuse/nuxt` auto-handles SSR** - composables return safe defaults on server.

## Target Element Refs

When targeting component refs instead of DOM elements:

```ts
import type { MaybeElementRef } from '@vueuse/core'

// Component ref needs .$el to get DOM element
const compRef = ref<ComponentInstance>()
const { width } = useElementSize(compRef) // ❌ Won't work

// Use MaybeElementRef pattern
import { unrefElement } from '@vueuse/core'

const el = computed(() => unrefElement(compRef)) // Gets .$el
const { width } = useElementSize(el) // ✅ Works
```

**Or access `$el` directly:**

```ts
const compRef = ref<ComponentInstance>()

onMounted(() => {
  const el = compRef.value?.$el as HTMLElement
  const { width } = useElementSize(el)
})
```
