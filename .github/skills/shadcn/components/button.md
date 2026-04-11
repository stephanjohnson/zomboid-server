---
description: Styled shadcn-vue button with variants, sizes, and as-child composition.
tags: [shadcn-vue, button, actions]
---

# Button

Use `Button` for primary, secondary, destructive, ghost, and link-style actions with shared design-system classes.

## When to Use

- Primary and secondary actions
- Icon-only or icon-leading actions
- Links styled like buttons through `as-child`

## Built From

- Native `button` semantics plus class-variance styling in the registry wrapper

## What Shadcn Adds

- Variant and size APIs
- Shared focus, disabled, and icon spacing styles
- `as-child` composition for anchors and router links

## Installation

```bash
pnpm dlx shadcn-vue@latest add button
```

## Example Patterns

- Vanilla: default, outline, ghost, destructive, and link variants
- Contextual: icon buttons in toolbars and `as-child` links in navigation or cards

## Official Docs Example Coverage

- `Size`: small, default, and large buttons, including matching icon sizes.
- `Default`, `Outline`, `Secondary`, `Ghost`, `Destructive`, `Link`: the core variant surface the registry ships.
- `Icon`: icon-only buttons with the required `aria-label` for accessibility.
- `With Icon`: icon-leading buttons where spacing is handled by the component styles instead of manual margins.
- `Rounded`: circular icon buttons using `rounded-full`.
- `Spinner`: disabled/loading action buttons paired with `Spinner`.
- `Button Group`: composed action bars that hand off layout to `ButtonGroup`.
- `Link (asChild)`: routing or anchor elements styled as buttons with `as-child`.

## Practical Notes

- Use `as-child` for `NuxtLink`, anchor, or custom navigation components instead of nesting interactive elements.
- For icon-only buttons, always add an accessible name with `aria-label` or visually hidden text.
- The official docs call out Tailwind v4 cursor behavior; if your project expects pointer cursors on buttons, add that override at the global layer.

## Related Components

- `button-group`, `dropdown-menu`, `toolbar`
