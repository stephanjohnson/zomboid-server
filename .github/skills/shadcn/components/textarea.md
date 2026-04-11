---
description: Styled multiline text input for shadcn-vue.
tags: [shadcn-vue, textarea, forms]
---

# Textarea

Use `Textarea` for longer freeform content such as notes, descriptions, prompts, and support messages.

## When to Use

- Multi-line user input
- Message, bio, and notes fields
- Settings panels with optional long-form content

## Built From

- Native `textarea` element wrapped with shadcn classes

## What Shadcn Adds

- Shared field styling consistent with `Input`
- Focus, disabled, and resize behavior defaults

## Installation

```bash
pnpm dlx shadcn-vue@latest add textarea
```

## Example Patterns

- Vanilla: basic multiline field
- Contextual: inside a support form or content editor settings panel

## Official Docs Example Coverage

- `Basic multiline input`: the page keeps the base example intentionally minimal and expects richer composition to happen through `Field`, `Form`, or `InputGroup`.

## Practical Notes

- Reach for `InputGroupTextarea` once the textarea needs inline actions, counters, or headers/footers.
- Pair with `FieldDescription` or equivalent helper text when message length or expectations matter.

## Related Components

- `input`, `label`, `field`, `form`
