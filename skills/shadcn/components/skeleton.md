---
description: Loading placeholder surface for shadcn-vue.
tags: [shadcn-vue, skeleton, loading]
---

# Skeleton

Use `Skeleton` to represent pending content while preserving layout and reducing perceived load jumps.

## When to Use

- Loading cards, tables, and profile rows
- Async content where shape matters before data arrives

## Built From

- Custom animated placeholder surface

## What Shadcn Adds

- Standard muted loading treatment and rounded placeholder styling

## Installation

```bash
pnpm dlx shadcn-vue@latest add skeleton
```

## Example Patterns

- Vanilla: simple line or block placeholder
- Contextual: card and table loading states

## Official Docs Example Coverage

- `Profile row placeholder`: avatar circle plus stacked text lines.

## Practical Notes

- The official docs keep skeletons structural. Match the eventual layout closely instead of rendering arbitrary gray bars.
- Remove skeletons as soon as useful content can be shown; do not stack them with spinners unless the distinction is intentional.

## Related Components

- `card`, `table`, `empty`
