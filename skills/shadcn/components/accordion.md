---
description: Styled accordion sections for shadcn-vue, built on top of Reka UI accordion primitives.
tags: [shadcn-vue, reka-ui, accordion, disclosure, forms]
---

# Accordion

A vertically stacked set of interactive headings that reveal associated content. In shadcn-vue, `Accordion` wraps the Reka accordion primitives and adds registry-friendly styling, default icon affordances, and a standard import surface.

## When to Use

- FAQ sections and help content
- Product details or settings panels with grouped sections
- Progressive disclosure for long forms or admin screens
- Content groupings where multiple related sections may expand independently

Use `Collapsible` instead when you only need a single expandable region rather than a coordinated group of items.

## Wraps

| Shadcn export | Underlying primitive |
| ------------- | -------------------- |
| `Accordion` | `AccordionRoot` |
| `AccordionItem` | `AccordionItem` |
| `AccordionTrigger` | `AccordionHeader` + `AccordionTrigger` |
| `AccordionContent` | `AccordionContent` |

## Registry Files

- `ui/accordion/Accordion.vue`
- `ui/accordion/AccordionItem.vue`
- `ui/accordion/AccordionTrigger.vue`
- `ui/accordion/AccordionContent.vue`
- `ui/accordion/index.ts`

## What Shadcn Adds Over Reka

- Root wrapper forwards root props and emits with `useForwardPropsEmits()`.
- Item wrapper forwards props with `useForwardProps()` and adds a bottom border by default.
- Trigger wrapper adds a header wrapper, focus-visible ring treatment, spacing, hover underline, and a default chevron icon that rotates when open.
- Content wrapper adds the standard accordion open/close animation classes, smaller body text, and an inner padding container.

## Dependencies to Watch When Copying Manually

- `reka-ui` for the underlying primitives
- `@vueuse/core` for `reactiveOmit()` and prop forwarding helpers used in wrapper files
- `lucide-vue-next` for the default chevron icon in the trigger
- `@/lib/utils` for the `cn()` helper used to merge local classes

If the project was bootstrapped with shadcn-vue, these are typically already in place. They matter most when copying the registry files manually into a custom setup.

## Installation

### CLI

```bash
pnpm dlx shadcn-vue@latest add accordion
```

### Manual

1. Copy the accordion registry files into `@/components/ui/accordion`.
2. Ensure `reka-ui`, `@vueuse/core`, and `lucide-vue-next` are available.
3. Keep the `cn()` helper import path aligned with the rest of the project.
4. If you are unsure about the file list, inspect the registry entry or use the shadcn-vue MCP/CLI metadata before copying files by hand.

## Core Usage Rules

- Use `type="single"` when only one section should be open at a time.
- Add `collapsible` when a single accordion should also allow closing the currently open item.
- Use `type="multiple"` when more than one section may remain expanded.
- Give every `AccordionItem` a stable, explicit `value`.
- Use `v-model` or `modelValue` when parent state needs to control which items are open.

## Example: Vanilla Usage

```vue
<script setup lang="ts">
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
</script>

<template>
  <Accordion type="single" collapsible class="w-full" default-value="accessibility">
    <AccordionItem value="accessibility">
      <AccordionTrigger>Is it accessible?</AccordionTrigger>
      <AccordionContent>
        Yes. The wrapper keeps the keyboard and ARIA behavior from Reka UI.
      </AccordionContent>
    </AccordionItem>

    <AccordionItem value="styling">
      <AccordionTrigger>Does it come styled?</AccordionTrigger>
      <AccordionContent>
        Yes. shadcn-vue adds the default trigger, border, and animation classes.
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</template>
```

## Example: Content-Heavy Usage

```vue
<script setup lang="ts">
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
</script>

<template>
  <Accordion type="single" collapsible class="w-full" default-value="product">
    <AccordionItem value="product">
      <AccordionTrigger>Product information</AccordionTrigger>
      <AccordionContent>
        <p>
          This package combines the shadcn visual defaults with the underlying
          Reka disclosure behavior.
        </p>
        <p class="mt-2">
          Use it when the content is too dense to show all at once but still
          belongs in the normal page flow.
        </p>
      </AccordionContent>
    </AccordionItem>

    <AccordionItem value="shipping">
      <AccordionTrigger>Shipping details</AccordionTrigger>
      <AccordionContent>
        Keep dense supporting copy inside content panels and reserve the trigger
        text for short, scannable labels.
      </AccordionContent>
    </AccordionItem>
  </Accordion>
</template>
```

## Example: Usage Inside a Form

`Accordion` is not a form control. Use it to organize sections of a long form while keeping the actual controls inside each panel.

```vue
<script setup lang="ts">
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
</script>

<template>
  <form class="space-y-6">
    <Accordion type="multiple" class="w-full" :default-value="['profile']">
      <AccordionItem value="profile">
        <AccordionTrigger>Profile settings</AccordionTrigger>
        <AccordionContent>
          <div class="grid gap-4 sm:grid-cols-2">
            <div class="grid gap-2">
              <Label for="display-name">Display name</Label>
              <Input id="display-name" placeholder="Ada Lovelace" />
            </div>
            <div class="grid gap-2">
              <Label for="email">Email</Label>
              <Input id="email" type="email" placeholder="ada@example.com" />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="notifications">
        <AccordionTrigger>Notifications</AccordionTrigger>
        <AccordionContent>
          <div class="grid gap-4">
            <div class="flex items-center justify-between rounded-md border p-4">
              <div>
                <p class="text-sm font-medium">Email updates</p>
                <p class="text-muted-foreground text-sm">
                  Send release and billing updates to the team.
                </p>
              </div>
              <Switch />
            </div>

            <div class="grid gap-2">
              <Label for="notes">Internal notes</Label>
              <Textarea id="notes" placeholder="Add onboarding notes" />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>

    <Button type="submit">Save changes</Button>
  </form>
</template>
```

### Form-specific guidance

- Keep submit actions and high-priority validation summaries outside collapsed panels when possible.
- Open the section that contains an error rather than hiding the user’s next step.
- Use accordion sections to reduce scan load, not to hide mandatory context.

## API Notes

### Root state

- `type="single" | "multiple"` controls whether one or many sections can be open.
- `defaultValue` sets the initial open item or items.
- `modelValue` / `v-model` makes the accordion controlled by parent state.
- `collapsible` only matters in single mode.

### Item requirements

- Every item needs a unique `value`.
- `disabled` prevents that item from opening.

### Content behavior

- `forceMount` keeps the content mounted even when closed, which is useful for measurement, animation libraries, or preserving DOM state.

## Styling Notes

- Default item styling adds a bottom border and removes the last border.
- Trigger styling includes focus-visible ring treatment, hover underline, and open-state icon rotation.
- Content styling includes accordion up/down animations and inner spacing.
- Extend styling by passing `class` to the wrapper exports before rewriting internal structure.

## Accessibility Notes

- Keyboard and ARIA behavior come from the underlying Reka primitives.
- Keep trigger labels concise and descriptive.
- Preserve a sensible heading structure around the accordion when using it inside long documents or settings pages.

## Common Pitfalls

- Forgetting the `value` prop on `AccordionItem`
- Using accordion for a single disclosure when `Collapsible` would be simpler
- Hiding critical form feedback inside collapsed sections
- Manually copying the wrapper files without the helper dependencies they rely on

## Related Files

- `reka-ui/components/accordion.md` for the primitive-level API
- `reka-ui/SKILL.md` for behavior and accessibility rules
