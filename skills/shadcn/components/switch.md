---
description: Styled switch built on the reka-ui switch primitive.
tags: [shadcn-vue, reka-ui, switch]
---

# Switch

Use `Switch` for immediate on/off settings where the binary state should feel lightweight and direct.

## When to Use

- Settings toggles
- Preference rows
- Compact binary controls in cards or forms

## Wraps

- `reka-ui` switch primitive

## What Shadcn Adds

- Track and thumb styling plus focus and disabled states

## Installation

```bash
pnpm dlx shadcn-vue@latest add switch
```

## Example Patterns

- Vanilla: labeled switch row
- Contextual: settings panel with description text and validation

## Official Docs Example Coverage

- `Labeled setting row`: a single switch paired with `Label` for a binary preference.

## Practical Notes

- The official example is intentionally lightweight. For descriptive settings rows, pair `Switch` with `Field` or a bordered container.
- Prefer `Checkbox` over `Switch` when the user is selecting from a set rather than toggling a live preference.

## Related Components

- `checkbox`, `form`, `field`
