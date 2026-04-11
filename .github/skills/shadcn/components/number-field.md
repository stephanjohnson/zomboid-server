---
description: Styled number field built on the reka-ui number-field primitive.
tags: [shadcn-vue, reka-ui, number-field]
---

# Number Field

Use `NumberField` when numeric entry benefits from step controls and constrained formatting.

## When to Use

- Quantity, percentage, and bounded numeric inputs
- Settings and pricing controls

## Wraps

- `reka-ui` number-field primitive

## What Shadcn Adds

- Styled increment/decrement affordances and field shell

## Installation

```bash
pnpm dlx shadcn-vue@latest add number-field
```

## Example Patterns

- Vanilla: quantity stepper
- Contextual: settings row or pricing control

## Official Docs Example Coverage

- `Disabled`: non-interactive numeric control.
- `Decimal`: signed and fractional formatting.
- `Percentage`: percent formatting with decimal steps.
- `Currency`: localized currency presentation.
- `Form`: validated numeric input integrated with form state.

## Practical Notes

- The official docs lean heavily on `format-options` for locale-aware presentation.
- Use `NumberField` instead of plain `Input type="number"` when step controls and formatting are part of the UX.
