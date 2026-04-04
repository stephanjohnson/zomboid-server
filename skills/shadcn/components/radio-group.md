---
description: Styled radio group built on the reka-ui radio-group primitives.
tags: [shadcn-vue, reka-ui, radio-group]
---

# Radio Group

Use `RadioGroup` when exactly one option from a small set should be selected.

## When to Use

- Shipping, plan, and preference selection
- Mutually exclusive form choices
- Compact grouped option cards

## Wraps

- `reka-ui` radio-group primitives

## What Shadcn Adds

- Styled indicators, spacing, and label-friendly composition

## Installation

```bash
pnpm dlx shadcn-vue@latest add radio-group
```

## Example Patterns

- Vanilla: simple stacked radio choices
- Contextual: payment method or plan selector inside a form

## Official Docs Example Coverage

- `Stacked choice list`: labeled single-selection list with comfortable/default/compact choices.

## Practical Notes

- The official page keeps radio groups simple and label-driven. For richer choice cards, compose with `Field` or `Item`.
- Use radio groups only when a single choice must be selected.

## Related Components

- `checkbox`, `select`, `form`
