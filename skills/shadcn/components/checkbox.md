---
description: Styled checkbox built on the reka-ui checkbox primitive.
tags: [shadcn-vue, reka-ui, checkbox]
---

# Checkbox

Use `Checkbox` for boolean selection and multi-select lists where options are independent.

## When to Use

- Consent and settings toggles with explicit labels
- Multi-select option lists
- Task rows and filter panels

## Wraps

- `reka-ui` checkbox primitive

## What Shadcn Adds

- Styled box, indicator, focus ring, and disabled states

## Installation

```bash
pnpm dlx shadcn-vue@latest add checkbox
```

## Example Patterns

- Vanilla: labeled checkbox row
- Contextual: inside `form` validation or bulk-selection panels

## Official Docs Example Coverage

- `Basic labeled row`: checkbox plus `Label` for simple consent text.
- `Helper-text layout`: a checkbox paired with title and supporting description.
- `Disabled setting`: a non-interactive row to communicate unavailable state.
- `Card-like selection row`: a full bordered setting row that changes styling when checked.

## Practical Notes

- The official examples strongly prefer pairing `Checkbox` with `Label` or richer descriptive text rather than showing a bare control.
- For card-like rows, move the visual state to the parent container so the whole row reads as the selectable unit.
- Use `Switch` when the mental model is on/off for a single setting. Use `Checkbox` when independent selection is the point.

## Related Components

- `label`, `form`, `switch`, `radio-group`
