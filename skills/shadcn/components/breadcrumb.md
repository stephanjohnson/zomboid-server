---
description: Hierarchical breadcrumb navigation for shadcn-vue.
tags: [shadcn-vue, breadcrumb, navigation]
---

# Breadcrumb

Use `Breadcrumb` to show the current resource path and give users a quick route back up the hierarchy.

## When to Use

- Deep navigation trees and settings paths
- File explorers and resource detail pages
- Documentation and admin interfaces

## Built From

- Navigation semantics, separators, links, and optional menu composition

## What Shadcn Adds

- Standard breadcrumb structure, separators, collapse patterns, and link styling

## Installation

```bash
pnpm dlx shadcn-vue@latest add breadcrumb
```

## Example Patterns

- Vanilla: simple path with separators
- Contextual: collapsed or dropdown breadcrumb in dense admin surfaces

## Official Docs Example Coverage

- `Custom separator`: swapping in a slash icon or other separator component.
- `Dropdown`: embedding `DropdownMenu` inside a breadcrumb segment.
- `Collapsed`: using `BreadcrumbEllipsis` for truncated paths.
- `Link component`: `as-child` composition with `NuxtLink`.
- `Responsive`: dropdown on desktop and drawer on mobile for long paths.

## Practical Notes

- The official docs treat breadcrumbs as a composition surface, not a fixed widget. Use dropdowns and drawers once the path becomes too long.
- Prefer `as-child` when your router owns navigation.

## Related Components

- `dropdown-menu`, `button`, `sidebar`
