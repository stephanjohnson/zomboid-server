---
description: Keyboard shortcut token display for shadcn-vue.
tags: [shadcn-vue, kbd, typography]
---

# Kbd

Use `Kbd` to display keyboard shortcuts and key hints in a consistent inline token style.

## When to Use

- Shortcut help in menus and docs
- Command palette hints

## Built From

- Custom inline token styling

## What Shadcn Adds

- Consistent keyboard key appearance across docs and product UI

## Installation

```bash
pnpm dlx shadcn-vue@latest add kbd
```

## Example Patterns

- Vanilla: single key token
- Contextual: menu shortcut or help legend

## Official Docs Example Coverage

- `Group`: clustered shortcut tokens with `KbdGroup`.
- `Button`: keyboard hints embedded inside button labels.
- `Tooltip`: shortcuts shown inside tooltip content.
- `Input Group`: command-palette style hinting with `InputGroupAddon`.

## Practical Notes

- The official examples use `Kbd` as supporting UI, never the primary content.
- Prefer grouping discrete keys rather than rendering a whole shortcut as a single token when readability matters.
