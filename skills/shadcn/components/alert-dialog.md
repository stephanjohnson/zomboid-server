---
description: Styled alert dialog built on the reka-ui alert-dialog primitives.
tags: [shadcn-vue, reka-ui, alert-dialog]
---

# Alert Dialog

Use `AlertDialog` for destructive or blocking confirmations that require explicit user acknowledgement.

## When to Use

- Delete, archive, or irreversible actions
- Sensitive confirmations with clear cancel and confirm paths

## Wraps

- `reka-ui` alert-dialog primitives

## What Shadcn Adds

- Dialog layout, button-ready footer, and default destructive-friendly styling

## Installation

```bash
pnpm dlx shadcn-vue@latest add alert-dialog
```

## Example Patterns

- Vanilla: confirm/cancel dialog
- Contextual: destructive action from a table row or settings page

## Official Docs Example Coverage

- `Destructive confirmation`: the official page centers on a simple cancel/continue flow.
- `Button-triggered variant`: using `AlertDialogTrigger as-child` so the entry point can be a styled button.

## Practical Notes

- Use `AlertDialog` when the action is consequential and the copy must be unambiguous.
- Keep the content short; if the user must inspect form fields or complex details, use `Dialog` instead.

## Related Components

- `dialog`, `button`, `dropdown-menu`
