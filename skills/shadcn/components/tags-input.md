---
description: Styled tags-input built on the reka-ui tags-input primitive.
tags: [shadcn-vue, reka-ui, tags-input]
---

# Tags Input

Use `TagsInput` for multi-value text entry where each value becomes a removable token.

## When to Use

- Invite lists, labels, and keyword entry
- Filter builders and multi-email fields

## Wraps

- `reka-ui` tags-input primitive

## What Shadcn Adds

- Styled tag tokens and consistent field shell behavior

## Installation

```bash
pnpm dlx shadcn-vue@latest add tags-input
```

## Example Patterns

- Vanilla: add/remove tag tokens
- Contextual: team invite or filter editor form

## Official Docs Example Coverage

- `Basic tags input`: inline removable tokens plus trailing text input.
- `Tags with Listbox`: tag entry composed with `Popover` and `reka-ui` listbox primitives for assisted selection.

## Practical Notes

- The official page shows two modes: freeform token entry and assisted selection. Decide which one your UX actually needs.
- When suggestions matter, the page composes tags input with `Popover`, `ListboxRoot`, `ListboxFilter`, and `ListboxItem` rather than overloading the base control.
- Use stable string serialization for token values so removal and deduping remain predictable.
