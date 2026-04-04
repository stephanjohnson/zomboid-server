---
name: reka-ui
description: Use when building with Reka UI (headless Vue components) - provides component API, accessibility patterns, composition (asChild), controlled/uncontrolled state, virtualization, and styling integration. Formerly Radix Vue.
license: MIT
metadata:
  version: "1.0.0"
---

# Reka UI

Unstyled, accessible Vue 3 component primitives. WAI-ARIA compliant. Previously Radix Vue. Use this skill as the behavior and accessibility layer beneath styled component systems like shadcn-vue.

**Current version:** v2.8.0 (January 2026)

## When to Use

- Building headless/unstyled components from scratch
- Need WAI-ARIA compliant components
- Using Nuxt UI, shadcn-vue, or other Reka-based libraries
- Implementing accessible forms, dialogs, menus, popovers

**For Vue component boundaries and composables:** use `vue-best-practices`
**For styled compositions:** use `shadcn`

## Core Principles

- Reach for headless primitives when behavior and accessibility matter more than prebuilt styling.
- Pick the smallest primitive set that satisfies the requirement; do not compose unnecessary layers.
- Decide controlled versus uncontrolled ownership before wiring state.
- Keep styling outside the primitive behavior layer.
- Use `asChild` deliberately when semantic HTML or custom wrappers matter.

## Available Guidance

| File                                                     | Topics                                                              |
| -------------------------------------------------------- | ------------------------------------------------------------------- |
| **[references/components.md](references/components.md)** | Component index by category (Form, Date, Overlay, Menu, Data, etc.) |
| **components/\*.md**                                     | Per-component details (dialog.md, select.md, etc.)                  |

**Guides** (see [reka-ui.com](https://reka-ui.com)): Styling, Animation, Composition, SSR, Namespaced, Dates, i18n, Controlled State, Inject Context, Virtualization, Migration

## Loading Files

**Consider loading these reference files based on your task:**

- [ ] [references/components.md](references/components.md) - if browsing component index by category or searching for specific components

**DO NOT load all files at once.** Load only what's relevant to your current task.

## 1) Pick the primitive family first (required)

- Load [references/components.md](references/components.md) to choose the correct primitive family before implementing a dialog, menu, select, combobox, calendar, or similar control.
- Prefer the primitive that already owns the accessibility behavior you need instead of recreating it with generic `div` wrappers.

## 2) Decide state ownership and composition model (required)

- Use controlled state when the parent must coordinate open state, selection, or validation.
- Use uncontrolled defaults when the component can manage its own internal interaction state.
- Use `asChild` when the primitive must render through your semantic element or design-system wrapper.

## 3) Compose accessibility and runtime behavior carefully (required)

- Preserve the expected Root/Trigger/Content/Portal/Item structure for the primitive.
- Keep focus management, keyboard behavior, and labelling intact.
- Use `forceMount` and virtualization only when the interaction or performance requirements justify them.
- Be deliberate about SSR and portal behavior when rendering overlays in Nuxt.

## 4) Style the composition outside the primitive contract

- Add layout and visual classes to the rendered parts without breaking their semantics.
- Keep design-system styling separate from behavior assumptions so primitives remain reusable.

## 5) Final self-check before finishing

- The chosen primitive matches the interaction pattern.
- Controlled or uncontrolled state is intentional.
- Accessibility behavior is preserved.
- Styling did not break structure, semantics, or keyboard support.
- Only the relevant component reference files were loaded.

## Key Concepts

| Concept                 | Description                                                           |
| ----------------------- | --------------------------------------------------------------------- |
| `asChild`               | Render as child element instead of wrapper, merging props/behavior    |
| Controlled/Uncontrolled | Use `v-model` for controlled, `default*` props for uncontrolled       |
| Parts                   | Components split into Root, Trigger, Content, Portal, etc.            |
| `forceMount`            | Keep element in DOM for animation libraries                           |
| Virtualization          | Optimize large lists (Combobox, Listbox, Tree) with virtual scrolling |
| Context Injection       | Access component context from child components                        |

## Installation

```ts
// nuxt.config.ts (auto-imports all components)
export default defineNuxtConfig({
  modules: ['reka-ui/nuxt']
})
```

```ts
import { RekaResolver } from 'reka-ui/resolver'
// vite.config.ts (with auto-import resolver)
import Components from 'unplugin-vue-components/vite'

export default defineConfig({
  plugins: [
    vue(),
    Components({ resolvers: [RekaResolver()] })
  ]
})
```

## Basic Patterns

```vue
<!-- Dialog with controlled state -->
<script setup>
import { DialogRoot, DialogTrigger, DialogPortal, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose } from 'reka-ui'
const open = ref(false)
</script>

<template>
  <DialogRoot v-model:open="open">
    <DialogTrigger>Open</DialogTrigger>
    <DialogPortal>
      <DialogOverlay class="fixed inset-0 bg-black/50" />
      <DialogContent class="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded">
        <DialogTitle>Title</DialogTitle>
        <DialogDescription>Description</DialogDescription>
        <DialogClose>Close</DialogClose>
      </DialogContent>
    </DialogPortal>
  </DialogRoot>
</template>
```

```vue
<!-- Select with uncontrolled default -->
<SelectRoot default-value="apple">
  <SelectTrigger>
    <SelectValue placeholder="Pick fruit" />
  </SelectTrigger>
  <SelectPortal>
    <SelectContent>
      <SelectViewport>
        <SelectItem value="apple"><SelectItemText>Apple</SelectItemText></SelectItem>
        <SelectItem value="banana"><SelectItemText>Banana</SelectItemText></SelectItem>
      </SelectViewport>
    </SelectContent>
  </SelectPortal>
</SelectRoot>
```

```vue
<!-- asChild for custom trigger element -->
<DialogTrigger as-child>
  <button class="my-custom-button">Open</button>
</DialogTrigger>
```

## Recent Updates (v2.6.0-v2.8.0)

- **New component**: Rating (v2.8.0)
- **ScrollArea**: Added "glimpse" scrollbar mode (v2.8.0)
- **PopperContent**: Added `hideShiftedArrow` prop (v2.8.0)
- **TimeField**: Added `stepSnapping` support (v2.8.0)
- **Breaking**: `weekStartsOn` now locale-independent for date components (v2.8.0)
- **Virtualization**: `estimateSize` accepts function for Listbox/Tree (v2.7.0)
- **Composables**: `useLocale`, `useDirection` exposed (v2.6.0)
- **Select**: `disableOutsidePointerEvents` prop on Content (v2.7.0)
- **Toast**: `disableSwipe` prop (v2.6.0)

## Resources

- [Reka UI Docs](https://reka-ui.com)
- [GitHub](https://github.com/unovue/reka-ui)
- [Nuxt UI](https://ui.nuxt.com) (styled Reka components)
- [shadcn-vue](https://www.shadcn-vue.com) (styled Reka components)

---

_Token efficiency: ~350 tokens base, components.md index ~100 tokens, per-component ~50-150 tokens_
