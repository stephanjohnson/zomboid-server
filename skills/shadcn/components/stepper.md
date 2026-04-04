---
description: Multi-step progress and form flow component for shadcn-vue.
tags: [shadcn-vue, stepper, flows]
---

# Stepper

Use `Stepper` for guided multi-step tasks where the user should see current position and upcoming steps.

## When to Use

- Checkout, onboarding, and setup flows
- Multi-step forms and guided tasks

## Built From

- Stepper primitives and shadcn-specific visual treatment

## What Shadcn Adds

- Styled indicators, labels, separators, and trigger composition

## Installation

```bash
pnpm dlx shadcn-vue@latest add stepper
```

## Example Patterns

- Vanilla: horizontal step progress
- Contextual: form wizard with validation between steps

## Official Docs Example Coverage

- `Horizontal`: a standard multi-step progress header with active, completed, and inactive states.
- `Vertical`: stacked steps for narrower layouts or detail-rich onboarding.
- `Form`: validated multi-step form flow using `Form`, `Input`, and `Select`.

## Practical Notes

- The official examples treat the stepper as a state machine shell around your workflow, not as the source of form truth.
- Use vertical orientation when step descriptions need room; use horizontal orientation when the titles alone are enough.
- When validation blocks progression, keep the form state outside the visual indicator so the stepper remains presentational.
