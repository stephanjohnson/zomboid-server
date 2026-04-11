---
description: Structured input-group composition for icons, text, buttons, and textarea addons in shadcn-vue.
tags: [shadcn-vue, input-group, forms]
---

# Input Group

Use `InputGroup` when extra text, icons, actions, or status indicators should feel like part of the same field surface instead of adjacent controls.

## When to Use

- Search, URL, and command-style fields with inline affordances
- Textareas with inline footer or header actions
- Inputs that need units, prefixes, suffixes, or status indicators

Use plain `Input` or `Textarea` when the control is visually standalone. Use `ButtonGroup` when the grouped elements are still separate actions rather than one field.

## Built From

- Custom shadcn wrappers around field-shell composition
- `InputGroup`, `InputGroupAddon`, `InputGroupButton`, `InputGroupInput`, `InputGroupTextarea`, and `InputGroupText`

## What Shadcn Adds

- A shared field surface across input, textarea, icons, text, and inline buttons
- Alignment options for inline-start, inline-end, block-start, and block-end addons
- Unified focus handling through the `data-slot="input-group-control"` contract

## Installation

```bash
pnpm dlx shadcn-vue@latest add input-group
```

## Official Docs Example Coverage

- `Icon`: search, mail, card, and multi-icon suffix patterns.
- `Text`: currency, URL, domain, and character-count addons.
- `Button`: copy, favorite, secure-site, and trailing search actions.
- `Tooltip`: help and validation hints embedded in the field shell.
- `Textarea`: code-editor-like textarea headers and footers.
- `Spinner`: loading and disabled-processing states.
- `Label`: inline labels and labeled textarea headers.
- `Dropdown`: trailing action menus for search and file workflows.
- `Button Group`: composition with `ButtonGroupText` for prefix/suffix shells.
- `Custom Input`: using `data-slot="input-group-control"` on a custom control.

## Practical Notes

- The official docs stress addon placement after the control for correct focus navigation.
- Use `InputGroupInput` and `InputGroupTextarea` when you want the built-in shell styles; use a custom element only when you need behavior the wrappers do not provide.
- `InputGroup` is ideal for one field with supporting affordances. If the user is deciding between multiple options, switch to `Combobox`, `Select`, or a richer composed control.

## Related Components

- `input`, `textarea`, `button-group`, `kbd`, `tooltip`
