---
description: Styled slider built on the reka-ui slider primitive.
tags: [shadcn-vue, reka-ui, slider]
---

# Slider

Use `Slider` for numeric ranges that benefit from direct manipulation instead of text entry.

## When to Use

- Volume, opacity, pricing, or threshold controls
- Quick range tuning in forms or dashboards

## Wraps

- `reka-ui` slider primitive

## What Shadcn Adds

- Styled track, range, thumb, and focus states

## Installation

```bash
pnpm dlx shadcn-vue@latest add slider
```

## Example Patterns

- Vanilla: single-thumb range slider
- Contextual: settings card with live numeric feedback

## Official Docs Example Coverage

- `Single value slider`: a straightforward bounded numeric slider.

## Practical Notes

- The official page is intentionally minimal. Real usage typically pairs `Slider` with nearby numeric feedback or labels so the current value stays legible.

## Related Components

- `number-field`, `progress`, `form`
