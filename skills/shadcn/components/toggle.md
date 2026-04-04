---
description: Styled toggle built on the reka-ui toggle primitive.
tags: [shadcn-vue, reka-ui, toggle]
---

# Toggle

Use `Toggle` for pressed-state buttons that represent a binary active/inactive choice.

## When to Use

- Toolbar formatting controls
- On/off options represented as a button

## Wraps

- `reka-ui` toggle primitive

## What Shadcn Adds

- Variant-aware button styling for pressed and inactive states

## Installation

```bash
pnpm dlx shadcn-vue@latest add toggle
```

## Example Patterns

- Vanilla: bold/italic style toggle
- Contextual: editor or filter toolbar control

## Official Docs Example Coverage

- `Default`: icon-only pressed-state button.
- `Outline`: bordered pressed-state variant.
- `With Text`: icon plus label.
- `Small` and `Large`: density variants.
- `Disabled`: non-interactive pressed-state control.

## Practical Notes

- The official examples frame `Toggle` as a toolbar/action-state control. If several toggles must coordinate, move to `ToggleGroup`.
