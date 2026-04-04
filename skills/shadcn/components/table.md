---
description: Table primitives and layout patterns for tabular data in shadcn-vue.
tags: [shadcn-vue, table, data]
---

# Table

Use `Table` primitives when the content is genuinely tabular and benefits from aligned columns and row scanning.

## When to Use

- Admin and data-heavy interfaces
- Audit logs, transactions, and inventories
- Dense read-only or action-heavy row lists

## Built From

- Custom table structure helpers and surrounding shadcn composition

## What Shadcn Adds

- Consistent cell spacing, muted headers, and row hover styling

## Installation

```bash
pnpm dlx shadcn-vue@latest add table
```

## Example Patterns

- Vanilla: basic header and body table
- Contextual: data rows with badges, actions, and empty states

## Official Docs Example Coverage

- `Invoice table`: caption, header, body, and footer total row.

## Practical Notes

- The official example is a clean semantic table first. Sorting, filtering, and row actions should be layered on top rather than baked into the primitive docs.
- If the data stops being tabular, use `Item`, `Card`, or list composition instead.

## Related Components

- `badge`, `pagination`, `dropdown-menu`, `skeleton`
