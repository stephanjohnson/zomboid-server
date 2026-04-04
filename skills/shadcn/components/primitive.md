---
description: Base primitive wrapper for advanced shadcn-vue composition.
tags: [shadcn-vue, reka-ui, primitive]
---

# Primitive

Use `Primitive` only for advanced composition cases where you need a base wrapper with predictable prop forwarding.

## When to Use

- Library or design-system internals
- Very low-level custom wrappers

## Wraps

- `reka-ui` primitive base

## What Shadcn Adds

- Alignment with the rest of the wrapper conventions

## Installation

```bash
pnpm dlx shadcn-vue@latest add primitive
```

## Example Patterns

- Vanilla: internal wrapper abstraction
- Contextual: advanced design-system composition
