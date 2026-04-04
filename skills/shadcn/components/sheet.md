---
description: Dialog-based sheet pattern for shadcn-vue.
tags: [shadcn-vue, sheet, dialog]
---

# Sheet

Use `Sheet` when you want dialog behavior presented as a side-attached panel instead of a centered modal.

## When to Use

- Settings drawers and side panels
- Responsive navigation or detail panes
- Complementary content that should not fully replace the page

## Built From

- `Dialog` semantics with sheet-specific content placement

## What Shadcn Adds

- Side-based positioning variants and sheet-specific content wrappers

## Installation

```bash
pnpm dlx shadcn-vue@latest add sheet
```

## Example Patterns

- Vanilla: side sheet with title and actions
- Contextual: mobile nav, filters, or record details

## Official Docs Example Coverage

- `Profile sheet`: side-attached editing surface with fields and footer actions.

## Practical Notes

- The official example treats `Sheet` as a dialog variant with spatial placement changed, not as a totally separate mental model.
- Use `Sheet` when the page context should remain visually present while secondary details are edited.

## Related Components

- `dialog`, `drawer`, `sidebar`
