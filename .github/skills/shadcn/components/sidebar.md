---
description: Application sidebar system for shadcn-vue.
tags: [shadcn-vue, sidebar, layout]
---

# Sidebar

Use `Sidebar` for app-shell navigation, grouped resources, and collapsible workspace layouts.

## When to Use

- Admin and dashboard shells
- Documentation or app navigation with grouped sections
- Responsive layouts that need mobile sheet behavior and desktop persistence

## Built From

- Sidebar-specific shadcn components plus collapsible, menu, button, and sheet patterns

## What Shadcn Adds

- Full sidebar system with provider, trigger, group, menu, and responsive collapse conventions

## Installation

```bash
pnpm dlx shadcn-vue@latest add sidebar
```

## Example Patterns

- Vanilla: persistent nav sidebar with grouped links
- Contextual: collapsible app shell with document and user sections

## Official Docs Example Coverage

- `Structure`: provider, sidebar, header, content, footer, groups, rail, inset, and trigger roles.
- `Your First Sidebar`: root provider setup, `AppSidebar.vue`, and first grouped menu.
- `SidebarProvider`: controlled state, keyboard shortcut, and persisted state.
- `Sidebar`: `side`, `variant`, and `collapsible` modes.
- `SidebarGroup` and `SidebarMenu`: collapsible groups, actions, badges, skeletons, separators, and submenus.
- `Trigger and useSidebar`: default trigger plus custom trigger via the hook.
- `Theming and Styling`: CSS variables and `data-*` hooks for app-shell customization.

## Practical Notes

- The official docs are explicit that sidebar code is meant to be owned and modified after generation; treat it as scaffold, not black box.
- Use `SidebarProvider` at the app-shell root so keyboard shortcuts, persisted state, and mobile behavior stay coherent.
- `Sidebar` is one of the few shadcn components where reading the generated source is part of correct usage.

## Related Components

- `sheet`, `collapsible`, `dropdown-menu`, `breadcrumb`
