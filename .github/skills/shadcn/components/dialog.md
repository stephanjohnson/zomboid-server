---
description: Styled dialog built on the reka-ui dialog primitives.
tags: [shadcn-vue, reka-ui, dialog]
---

# Dialog

Use `Dialog` for modal workflows that require focused interaction away from the surrounding page.

## When to Use

- Create, edit, and confirm workflows
- Settings subflows and detail forms
- Short, contained modal tasks

## Wraps

- `reka-ui` dialog primitives

## What Shadcn Adds

- Overlay, content shell, title/description, header/footer, and default animation classes

## Installation

```bash
pnpm dlx shadcn-vue@latest add dialog
```

## Example Patterns

- Vanilla: open dialog with title and actions
- Contextual: form, picker, or command dialog workflow

## Official Docs Example Coverage

- `Custom close button`: explicit `DialogClose` wiring inside the footer.
- `Dialog with form`: validated profile editing form kept alive across open/close cycles.
- `Responsive Modal (Dialog & Drawer)`: switching between dialog and drawer based on viewport size.
- `Menu-triggered dialog`: notes for composing dialog with `ContextMenu` or `DropdownMenu`.

## Practical Notes

- The official docs explicitly note that dialogs triggered from menus should wrap the menu rather than being mounted entirely inside menu content.
- Use `DialogClose as-child` when the close affordance should look like a regular button.
- If the same workflow should become bottom-sheet-like on mobile, use the documented dialog/drawer composition instead of forcing dialog sizing.

## Related Components

- `alert-dialog`, `sheet`, `drawer`
