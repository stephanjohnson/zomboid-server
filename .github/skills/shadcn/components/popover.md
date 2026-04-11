---
description: Styled popover built on the reka-ui popover primitives.
tags: [shadcn-vue, reka-ui, popover]
---

# Popover

Use `Popover` for anchored floating content that should stay tied to a trigger without becoming a full modal.

## When to Use

- Small pickers and filters
- Contextual info or form fragments
- Building blocks for composed patterns like comboboxes

## Wraps

- `reka-ui` popover primitives

## What Shadcn Adds

- Styled content shell and consistent trigger/content composition conventions

## Installation

```bash
pnpm dlx shadcn-vue@latest add popover
```

## Example Patterns

- Vanilla: simple trigger and content panel
- Contextual: filter popover or combobox trigger surface

## Official Docs Example Coverage

- `Dimensions editor`: trigger button opening a compact settings form with labeled inputs.

## Practical Notes

- The official example reinforces that popovers are ideal for short, anchored tasks.
- If the content becomes blocking or long-form, move to `Dialog` or `Sheet`.

## Related Components

- `tooltip`, `hover-card`, `combobox`
