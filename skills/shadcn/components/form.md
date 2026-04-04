---
description: Validation-aware form composition primitives for shadcn-vue.
tags: [shadcn-vue, forms, validation]
---

# Form

Use `form` primitives to connect validation libraries and field state to shadcn-styled controls.

## When to Use

- Validated forms with field descriptions and messages
- Shared field wiring for `Input`, `Select`, `Checkbox`, and related controls
- `vee-validate` or similar validation flows

## Built From

- Form context components and slot props layered around validation state

## What Shadcn Adds

- Consistent `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, and `FormMessage` composition

## Installation

```bash
pnpm dlx shadcn-vue@latest add form
```

## Example Patterns

- Vanilla: single validated input field
- Contextual: multi-field form using `vee-validate` and a typed schema

## Official Docs Example Coverage

- `Features`: the page explains the `vee-validate` plus schema-driven positioning of the abstraction.
- `Anatomy`: `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, and `FormMessage` composition.
- `Create a form schema`: Zod with `toTypedSchema`.
- `Define a form`: both `useForm` composable and `<Form />` component styles.
- `Build your form`: binding shadcn controls through `componentField` slot props.
- `Done`: complete typed example with validation and submit handling.

## Practical Notes

- The official docs now mark `Form` as not actively developed and recommend `Field` for most new work.
- Use this component when a team already relies on the `vee-validate` integration and shared field abstractions.
- If you only need accessible layout plus validation messaging, prefer `Field` plus your validator rather than reaching for more abstraction by default.

## Related Components

- `input`, `textarea`, `select`, `field`, `checkbox`
