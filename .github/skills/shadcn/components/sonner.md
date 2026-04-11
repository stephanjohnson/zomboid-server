---
description: Opinionated toast system used by shadcn-vue in place of the deprecated toast component.
tags: [shadcn-vue, sonner, toast]
---

# Sonner

Use `Sonner` for transient notifications in modern shadcn-vue apps. It replaces the older `toast` component.

## When to Use

- Success, error, and async status notifications
- Lightweight app-wide feedback

## Built From

- Third-party Sonner integration rather than Reka toast primitives

## What Shadcn Adds

- A documented default notification path that matches the rest of the system

## Installation

```bash
pnpm dlx shadcn-vue@latest add sonner
```

## Example Patterns

- Vanilla: trigger a simple toast
- Contextual: async action feedback after save, delete, or copy operations

## Official Docs Example Coverage

- `Root installation`: add `vue-sonner/style.css` and mount `Toaster` at the app root.
- `Types`: default, success, info, warning, error, and promise-driven toasts.
- `With Dialog`: dialog-safe toast triggering that guards outside interaction.

## Practical Notes

- The official docs require `Toaster` plus stylesheet setup before any examples work.
- Prefer `toast.promise()` for async flows so loading, success, and error states stay unified.
- `toast` is deprecated in this ecosystem; use `Sonner` as the default notification path.

## Related Components

- `toast`, `alert`
