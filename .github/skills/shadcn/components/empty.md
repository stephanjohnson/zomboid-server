---
description: Empty-state composition primitives for shadcn-vue.
tags: [shadcn-vue, empty, states]
---

# Empty

Use `Empty` primitives to design intentional empty states instead of leaving blank space.

## When to Use

- Empty lists, dashboards, and resource views
- First-run product states and no-results screens

## Built From

- Custom structural primitives for media, title, description, and actions

## What Shadcn Adds

- Consistent empty-state structure that can scale from simple to expressive cases

## Installation

```bash
pnpm dlx shadcn-vue@latest add empty
```

## Example Patterns

- Vanilla: icon, title, description, and CTA
- Contextual: empty table or onboarding dashboard

## Official Docs Example Coverage

- `Outline`: dashed-border empty state for drop zones or setup prompts.
- `Background`: muted or gradient-backed empty states.
- `Avatar`: person-centric offline or unavailable states.
- `Avatar Group`: team and collaboration empty states.
- `InputGroup`: searchable `404` or no-results layouts with inline input affordances.

## Practical Notes

- The official patterns treat empty states as task surfaces, not just messages. Prefer a next action, shortcut, or recovery path.
- `EmptyMedia` supports both icons and richer media, so use it to set tone before adding more text.
- Keep the copy short; the action should usually be more important than the description.
