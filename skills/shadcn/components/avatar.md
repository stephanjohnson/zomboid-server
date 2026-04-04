---
description: Styled avatar built on the reka-ui avatar primitives.
tags: [shadcn-vue, reka-ui, avatar]
---

# Avatar

Use `Avatar` for user or team identity where an image should gracefully fall back to initials or an icon.

## When to Use

- User menus and profile rows
- Comments, activity feeds, and lists
- Team settings and assignments

## Wraps

- `reka-ui` avatar primitives

## What Shadcn Adds

- Shared sizing, radius, fallback styling, and image clipping defaults

## Installation

```bash
pnpm dlx shadcn-vue@latest add avatar
```

## Example Patterns

- Vanilla: image with initials fallback
- Contextual: avatar plus name and role inside a card or menu row

## Official Docs Example Coverage

- `Single avatar`: image plus fallback initials.
- `Multiple avatars`: a small stack/group treatment using shared avatar styling.

## Practical Notes

- The official examples show that avatar groups are mostly a composition pattern driven by parent layout classes.
- Always provide meaningful `alt` text when the image carries identity.

## Related Components

- `badge`, `dropdown-menu`, `item`
