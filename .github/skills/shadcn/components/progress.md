---
description: Styled progress bar built on the reka-ui progress primitive.
tags: [shadcn-vue, reka-ui, progress]
---

# Progress

Use `Progress` to represent the completion state of a task, upload, or workflow.

## When to Use

- Uploads and background operations
- Step progress and completion feedback

## Wraps

- `reka-ui` progress primitive

## What Shadcn Adds

- Styled track and indicator with standard spacing and color defaults

## Installation

```bash
pnpm dlx shadcn-vue@latest add progress
```

## Example Patterns

- Vanilla: determinate progress bar
- Contextual: upload card or onboarding progress panel

## Official Docs Example Coverage

- `Animated determinate progress`: a mounted example that updates from one value to another.

## Practical Notes

- The official docs only show determinate progress. If you need indeterminate loading, combine `Skeleton` or a spinner-based pattern instead.
