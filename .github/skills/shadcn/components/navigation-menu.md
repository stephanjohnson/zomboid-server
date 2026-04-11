---
description: Styled navigation menu built on the reka-ui navigation-menu primitives.
tags: [shadcn-vue, reka-ui, navigation-menu]
---

# Navigation Menu

Use `NavigationMenu` for site or section navigation where links can expand into richer panels.

## When to Use

- Marketing or documentation site navigation
- Rich navigation panels with grouped links
- Desktop nav bars with nested content

## Wraps

- `reka-ui` navigation-menu primitives

## What Shadcn Adds

- Trigger styling helpers, panel transitions, indicator styling, and viewport defaults

## Installation

```bash
pnpm dlx shadcn-vue@latest add navigation-menu
```

## Example Patterns

- Vanilla: simple trigger/content navigation
- Contextual: product docs or app section mega-menu

## Official Docs Example Coverage

- `Simple link list`: basic trigger and content composition.
- `Rich content panel`: documentation/marketing mega-menu with featured card and link grid.
- `Trigger style helper`: use of `navigationMenuTriggerStyle()` for standalone links.
- `Icon list`: compact content panel with icon-led links.

## Practical Notes

- The official examples show that `NavigationMenu` is best when each top-level item may reveal richer content than a plain list.
- Once the navigation becomes command-oriented instead of link-oriented, switch to `Menubar` or `DropdownMenu`.

## Related Components

- `menubar`, `breadcrumb`, `sidebar`
