---
description: Styled text input wrapper for shadcn-vue.
tags: [shadcn-vue, input, forms]
---

# Input

Use `Input` for standard single-line text, email, password, search, and file-style entry surfaces.

## When to Use

- Basic form entry
- Search bars and inline edit fields
- Inputs paired with labels, buttons, or validation messages

## Built From

- Native `input` element wrapped with shadcn classes

## What Shadcn Adds

- Shared field sizing, border, focus ring, and disabled styles
- Consistent file-input styling hooks

## Installation

```bash
pnpm dlx shadcn-vue@latest add input
```

## Example Patterns

- Vanilla: default input with placeholder
- Contextual: with label, with trailing button, inside `form` or `field`

## Official Docs Example Coverage

- `Default`: plain text or email input.
- `File`: browser-native file input with label.
- `Disabled`: non-interactive field styling.
- `With Label`: the default labeled field pattern.
- `With Button`: inline subscription/search style row.

## Practical Notes

- Use plain `Input` when the control remains visually standalone. Move to `InputGroup` when the add-ons are visually part of the same field.
- File inputs keep native browser behavior; do not expect the same styling flexibility as text fields.
- For validated forms, wrap with `Field` or `Form` so descriptions and errors stay consistent.

## Related Components

- `textarea`, `label`, `field`, `form`, `input-group`
