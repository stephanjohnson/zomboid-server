---
description: Styled menubar built on the reka-ui menubar primitives.
tags: [shadcn-vue, reka-ui, menubar]
---

# Menubar

Use `Menubar` for desktop-like, persistent command menus where categories of actions remain visible.

## When to Use

- Editor and desktop-style applications
- Persistent top-level command groups
- Interfaces with keyboard-friendly command navigation

## Wraps

- `reka-ui` menubar primitives

## What Shadcn Adds

- Styled triggers, content, submenus, separators, and shortcut formatting

## Installation

```bash
pnpm dlx shadcn-vue@latest add menubar
```

## Example Patterns

- Vanilla: File/Edit-style menu
- Contextual: editor toolbar or admin action bar

## Official Docs Example Coverage

- `Desktop command bar`: File/Edit/View/Profiles menus with submenus, checkboxes, radios, and shortcuts.

## Practical Notes

- The official pattern is intentionally desktop-like and persistent. Do not use `Menubar` as a mobile navigation substitute.
- Use `DropdownMenu` for single-trigger menus and `NavigationMenu` for site navigation.

## Related Components

- `dropdown-menu`, `navigation-menu`, `toolbar`
