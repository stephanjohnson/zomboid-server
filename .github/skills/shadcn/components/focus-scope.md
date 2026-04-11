---
description: Focus containment utility built on the reka-ui focus-scope primitive.
tags: [shadcn-vue, reka-ui, focus-scope]
---

# Focus Scope

Use `FocusScope` for advanced focus containment and restoration when composing custom overlays or complex interactive regions.

## When to Use

- Custom overlay internals and trapped focus regions
- Advanced accessibility composition beyond the higher-level dialog/popover wrappers

## Wraps

- `reka-ui` focus-scope primitive

## What Shadcn Adds

- Consistent import and wrapper conventions for low-level focus utilities

## Installation

```bash
pnpm dlx shadcn-vue@latest add focus-scope
```

## Example Patterns

- Vanilla: trapped focus container
- Contextual: custom overlay or inspector pane implementation
