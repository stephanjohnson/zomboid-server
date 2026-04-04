---
description: Styled hover card built on the reka-ui hover-card primitives.
tags: [shadcn-vue, reka-ui, hover-card]
---

# Hover Card

Use `HoverCard` for lightweight previews that appear on hover or focus without taking over the page.

## When to Use

- User previews and link previews
- Supplemental metadata on hover
- Desktop-first content inspection

## Wraps

- `reka-ui` hover-card primitives

## What Shadcn Adds

- Styled content surface and shared card-like presentation

## Installation

```bash
pnpm dlx shadcn-vue@latest add hover-card
```

## Example Patterns

- Vanilla: profile preview card
- Contextual: link preview inside a table or content list

## Official Docs Example Coverage

- `Profile preview`: a link-triggered hover card with avatar, name, description, and joined date metadata.

## Practical Notes

- The official example uses `Button variant="link"` as the trigger, reinforcing that hover cards are secondary previews rather than primary workflows.
- Use `Popover` instead when the content needs active interaction.

## Related Components

- `popover`, `tooltip`, `card`
