---
description: Compact status and metadata label for shadcn-vue.
tags: [shadcn-vue, badge, status]
---

# Badge

Use `Badge` for concise metadata such as status, type, environment, role, or count.

## When to Use

- Status chips and labels
- Small categorical markers
- Dense tables and settings summaries

## Built From

- Custom styled inline container

## What Shadcn Adds

- Variant-based color and border treatments with small, consistent sizing

## Installation

```bash
pnpm dlx shadcn-vue@latest add badge
```

## Example Patterns

- Vanilla: default and secondary badges
- Contextual: table rows, cards, and filter chips

## Official Docs Example Coverage

- `Variant set`: default, secondary, destructive, and outline.
- `Icon badge`: verified/status badge with leading icon.
- `Count badge`: compact circular numeric badges.
- `Link`: `as-child` badge styling applied to anchors.

## Practical Notes

- The official examples use badges for metadata, not for primary actions.
- When a badge becomes interactive, prefer `as-child` on a real link or button rather than simulating interactivity on a `div`.

## Related Components

- `alert`, `table`, `breadcrumb`
