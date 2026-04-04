---
description: Styled scroll area built on the reka-ui scroll-area primitives.
tags: [shadcn-vue, reka-ui, scroll-area]
---

# Scroll Area

Use `ScrollArea` when a bounded region needs custom scrollbar treatment without losing accessibility.

## When to Use

- Long menus and cards with constrained height
- Side panels and code or log viewers

## Wraps

- `reka-ui` scroll-area primitives

## What Shadcn Adds

- Styled scrollbars and consistent bounded-region presentation

## Installation

```bash
pnpm dlx shadcn-vue@latest add scroll-area
```

## Example Patterns

- Vanilla: scrollable list region
- Contextual: sidebar or command panel content

## Official Docs Example Coverage

- `Tag list`: bounded, scrollable version list with separators.
- `Story/content region`: custom scrollbar treatment over long prose content.

## Practical Notes

- The official patterns use `ScrollArea` when the region itself is intentionally bounded. Do not wrap whole-page content in it to simulate normal scrolling.
- Pair with `Separator` when scannability matters inside long scrollable lists.
