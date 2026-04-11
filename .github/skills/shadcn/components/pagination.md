---
description: Pagination controls for shadcn-vue.
tags: [shadcn-vue, pagination, navigation]
---

# Pagination

Use `Pagination` when users must navigate across multiple pages of tabular or list content.

## When to Use

- Resource tables and logs
- Search results and paged content indexes
- Any dataset that cannot remain in a single view

## Built From

- Navigation semantics and button-like pagination items

## What Shadcn Adds

- Styled pagination items, ellipsis, and previous/next affordances

## Installation

```bash
pnpm dlx shadcn-vue@latest add pagination
```

## Example Patterns

- Vanilla: previous/next plus numbered pages
- Contextual: table footer with results summary

## Official Docs Example Coverage

- `Static composition`: explicit previous, page links, ellipsis, and next.
- `Slot-driven pagination`: dynamic item generation with current-page awareness.

## Practical Notes

- The official examples show both hand-authored pagination UIs and the slot-driven API. Use the latter for real datasets.
- Keep pagination paired with result counts or filters when the page set changes meaningfully.

## Related Components

- `table`, `button-group`, `breadcrumb`
