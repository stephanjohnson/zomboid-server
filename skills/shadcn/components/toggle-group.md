---
description: Styled toggle-group built on the reka-ui toggle-group primitives.
tags: [shadcn-vue, reka-ui, toggle-group]
---

# Toggle Group

Use `ToggleGroup` when several toggle buttons should behave as a coordinated set.

## When to Use

- Text alignment or formatting groups
- Segmented multi-choice controls

## Wraps

- `reka-ui` toggle-group primitives

## What Shadcn Adds

- Grouped button styling and shared layout conventions

## Installation

```bash
pnpm dlx shadcn-vue@latest add toggle-group
```

## Example Patterns

- Vanilla: multiple formatting toggles
- Contextual: segmented preference switcher

## Official Docs Example Coverage

- `Default`: multi-select formatting group.
- `Outline`: bordered group styling.
- `Single`: one-of-many behavior.
- `Small` and `Large`: density variants.
- `Disabled`: non-interactive grouped state.

## Practical Notes

- The official examples distinguish clearly between `type="single"` and `type="multiple"`; choose based on selection semantics, not visuals.
- Use `ButtonGroup` when grouped actions should not hold selection state.
