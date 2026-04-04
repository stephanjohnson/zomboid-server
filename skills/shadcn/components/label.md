---
description: Accessible label primitive with shadcn-vue styling.
tags: [shadcn-vue, reka-ui, label]
---

# Label

Use `Label` to connect form controls to visible text while keeping spacing and typography consistent.

## When to Use

- Any labeled form control
- Input groups and settings rows
- Paired helper text and validation contexts

## Wraps

- `reka-ui` label primitive

## What Shadcn Adds

- Shared text sizing and spacing defaults for form labels

## Installation

```bash
pnpm dlx shadcn-vue@latest add label
```

## Example Patterns

- Vanilla: label and input pair
- Contextual: stacked inside `field` or `form`

## Official Docs Example Coverage

- `Checkbox row`: the official page shows the most common pattern, a labeled checkbox pair.

## Practical Notes

- The docs keep `Label` intentionally minimal. Its value comes from consistent association with controls, not extra behavior.
- Prefer `FieldLabel` once the control is inside a more structured `Field` composition.

## Related Components

- `input`, `textarea`, `field`, `form`
