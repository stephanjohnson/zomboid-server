---
description: Slide-in drawer pattern for constrained layouts and mobile surfaces.
tags: [shadcn-vue, drawer, overlay]
---

# Drawer

Use `Drawer` for mobile-first overlays and bottom-sheet interactions where a full dialog feels too heavy.

## When to Use

- Mobile settings and filter panels
- Touch-first flows and contextual actions
- Responsive dialog alternatives

## Built From

- shadcn-vue drawer registry components and a slide-in overlay pattern

## What Shadcn Adds

- Drawer-specific content regions and responsive sheet-like behavior

## Installation

```bash
pnpm dlx shadcn-vue@latest add drawer
```

## Example Patterns

- Vanilla: bottom sheet with actions
- Contextual: mobile filter or quick-create flow

## Official Docs Example Coverage

- `Mobile bottom sheet`: goal-adjustment example with inline controls.
- `Responsive Modal (Dialog & Drawer)`: the same responsive composition pattern documented on `Dialog`.

## Practical Notes

- The official drawer example assumes touch-friendly spacing and bottom-sheet behavior, not a desktop side panel.
- If the same workflow must behave like a centered modal on larger screens, follow the documented dialog/drawer switch pattern.

## Related Components

- `dialog`, `sheet`, `button`
