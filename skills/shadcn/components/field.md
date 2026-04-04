---
description: Field composition helper for labels, controls, descriptions, and validation messaging.
tags: [shadcn-vue, field, forms]
---

# Field

Use `Field`-style composition when you want a reusable layout wrapper around a label, control, help text, and error state.

## When to Use

- Repeating form field layouts
- Settings screens with descriptive helper text
- Validation-heavy forms that need consistent spacing

## Built From

- Label, control, description, and message composition primitives

## What Shadcn Adds

- Repeatable field layout conventions and clearer form structure

## Installation

```bash
pnpm dlx shadcn-vue@latest add field
```

## Example Patterns

- Vanilla: single field with helper text
- Contextual: responsive form grid with grouped fields and inline errors

## Official Docs Example Coverage

- `Input`, `Textarea`, `Select`, `Slider`: single-control field layouts.
- `Fieldset`: semantic grouping for related address/payment sections.
- `Checkbox`, `Radio`, `Switch`: horizontal control rows with labels and descriptions.
- `Choice Card`: full-card selection UIs built from `FieldLabel` wrapping a selectable control.
- `Field Group`: stacked groups separated by `FieldSeparator`.
- `Responsive Layout`: container-aware field orientation changes.
- `Validation and Errors`: `data-invalid`, `aria-invalid`, and `FieldError` placement.

## Practical Notes

- The official docs position `Field` as the preferred modern form layout primitive, even for cases that older `Form` abstractions handled.
- Use `FieldContent` whenever the label and description need to stay visually grouped beside a control.
- For responsive layouts, keep semantic grouping with `FieldSet` even when the visual layout changes.

## Related Components

- `form`, `label`, `input`, `textarea`
