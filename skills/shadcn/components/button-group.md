---
description: Group adjacent shadcn-vue buttons into a cohesive action cluster.
tags: [shadcn-vue, button-group, actions]
---

# Button Group

Use `ButtonGroup` patterns when several related actions should read as a single cluster instead of isolated buttons.

## When to Use

- Segmented action bars
- Small sets of mutually related actions
- Toolbars and card footers with grouped buttons

## Built From

- Multiple `Button` instances plus shared grouping classes

## What Shadcn Adds

- Consistent spacing, border joining, and alignment conventions

## Installation

```bash
pnpm dlx shadcn-vue@latest add button-group
```

## Example Patterns

- Vanilla: adjacent outline actions
- Contextual: grouped filters or pagination controls

## Official Docs Example Coverage

- `Orientation`: vertical and horizontal group layouts.
- `Size`: grouped buttons that keep small, default, and large button sizing visually coherent.
- `Nested`: button groups composed inside larger groups for segmented control layouts.
- `Separator`: visual dividers between non-outline buttons.
- `Split`: primary action plus adjacent secondary trigger.
- `Input`: search-like layouts where an input and trailing button share a surface.
- `Input Group`: richer composed controls that mix `ButtonGroup` with `InputGroup`.
- `Dropdown Menu`: split-action menus using a button plus `DropdownMenuTrigger`.
- `Select`: grouped currency/unit selectors with an input and trailing action.
- `Popover`: grouped action trigger that opens supporting content.

## Practical Notes

- Reach for `ButtonGroup` when actions remain discrete actions. Use `ToggleGroup` only when selection state is the point of the control.
- Outline buttons usually do not need `ButtonGroupSeparator`; filled variants benefit from one.
- Nested groups are the official way to create prefix/suffix action zones without fighting border radii manually.

## Related Components

- `button`, `toggle-group`, `toolbar`
