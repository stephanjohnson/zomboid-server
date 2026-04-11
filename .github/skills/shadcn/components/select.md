---
description: Styled select built on the reka-ui select primitives.
tags: [shadcn-vue, reka-ui, select]
---

# Select

Use `Select` for button-triggered option picking when the option list should stay out of the normal document flow.

## When to Use

- Compact option picking in forms
- Filter bars and settings panels
- Grouped or scrollable option lists

## Wraps

- `reka-ui` select primitives

## What Shadcn Adds

- Trigger styling, chevron icon, content styling, and item defaults

## Installation

```bash
pnpm dlx shadcn-vue@latest add select
```

## Example Patterns

- Vanilla: basic select with placeholder
- Contextual: grouped or scrollable options inside a settings form

## Official Docs Example Coverage

- `Scrollable`: grouped timezone selection with long option lists.
- `Multiple`: multi-select behavior using the same trigger/content pattern.

## Practical Notes

- Use `Select` when the list should stay hidden until triggered and keyboard navigation through options matters.
- The official docs lean on `SelectGroup` and `SelectLabel` once lists become long enough to need scanning help.
- If the user needs fuzzy filtering or freeform search, move to `Combobox` instead.

## Related Components

- `combobox`, `dropdown-menu`, `form`
