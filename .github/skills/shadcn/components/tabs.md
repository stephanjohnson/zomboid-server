---
description: Styled tabs built on the reka-ui tabs primitives.
tags: [shadcn-vue, reka-ui, tabs]
---

# Tabs

Use `Tabs` to switch between related views while keeping each panel in the same spatial context.

## When to Use

- Settings subsections
- Account/password views
- Small sets of mutually exclusive content panels

## Wraps

- `reka-ui` tabs primitives

## What Shadcn Adds

- Styled tab list, triggers, and content panels with shared button-like treatment

## Installation

```bash
pnpm dlx shadcn-vue@latest add tabs
```

## Example Patterns

- Vanilla: account/password panel tabs
- Contextual: settings card or analytics view switcher

## Official Docs Example Coverage

- `Account`: card-backed account settings panel.
- `Password`: second tab showing a related but separate credential workflow.

## Practical Notes

- The official example uses cards inside tab panels rather than trying to make the tabs themselves carry all spacing and structure.
- Tabs work best when the user should stay in the same page context and compare a small number of related panels.
- If the sections need deep-linking or independent loading, consider route-level navigation instead.

## Related Components

- `button-group`, `stepper`, `navigation-menu`
