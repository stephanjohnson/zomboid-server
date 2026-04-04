---
description: Flexible item row primitive for shadcn-vue.
tags: [shadcn-vue, item, lists]
---

# Item

Use `Item` for reusable list rows that combine media, title, description, and actions.

## When to Use

- Settings lists and menus
- Resource rows and compact dashboards
- Linkable list content with structured metadata

## Built From

- Custom structural primitives such as media, content, actions, header, and footer

## What Shadcn Adds

- A highly reusable list-row pattern used across many product surfaces

## Installation

```bash
pnpm dlx shadcn-vue@latest add item
```

## Example Patterns

- Vanilla: title and description row
- Contextual: link row, avatar row, or dropdown-enabled settings item

## Official Docs Example Coverage

- `Variants`: default, outline, and muted row shells.
- `Size`: compact and standard item densities.
- `Icon`: icon-led action rows.
- `Avatar`: single avatar and avatar-group list rows.
- `Image`: album/media rows with thumbnail treatment.
- `Group`: stacked item groups with separators.
- `Header`: grid-style item cards with top media.
- `Link`: `as-child` navigation rows.
- `Dropdown`: embedding `Item` inside `DropdownMenuItem` content.

## Practical Notes

- The official docs position `Item` as a reusable layout primitive, not a specialized data-list widget.
- Use `ItemGroup` when rows should feel like one related cluster and `ItemSeparator` when visual rhythm matters.
- When the row itself navigates, use `as-child` so hover and focus styles land on the anchor.
