---
description: Structured shadcn-vue card container with header, content, and footer sections.
tags: [shadcn-vue, card, layout]
---

# Card

Use `Card` for grouped content blocks such as forms, summaries, settings sections, and dashboard panels.

## When to Use

- Settings and account panels
- Summary or KPI blocks
- Forms inside bounded content sections

## Built From

- Custom structural wrappers rather than a direct Reka primitive

## What Shadcn Adds

- Standardized card shell, spacing, and section subcomponents

## Installation

```bash
pnpm dlx shadcn-vue@latest add card
```

## Example Patterns

- Vanilla: card with title and body copy
- Contextual: form or settings section inside a dashboard

## Official Docs Example Coverage

- `Login card`: the official page centers on an authentication card with `CardHeader`, `CardAction`, `CardContent`, and `CardFooter` working together.
- `Action in header`: the example uses `CardAction` for a lightweight secondary route such as `Sign Up`.
- `Structured form section`: the example demonstrates that cards are most effective when they bound a complete sub-task instead of arbitrary content.

## Practical Notes

- Put the task framing in `CardHeader`, the main fields/content in `CardContent`, and destructive or submit actions in `CardFooter`.
- `CardAction` is best for low-priority links or utilities that belong to the same unit of work.
- If a card becomes a full page layout, it is no longer acting like a card; move back to sectioning elements.

## Related Components

- `button`, `input`, `accordion`, `table`
