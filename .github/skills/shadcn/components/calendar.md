---
description: Styled calendar built on the reka-ui calendar primitives.
tags: [shadcn-vue, reka-ui, calendar]
---

# Calendar

Use `Calendar` when users should pick dates from a visible calendar grid.

## When to Use

- Date selection in forms and popovers
- Scheduling and availability interfaces

## Wraps

- `reka-ui` calendar primitives

## What Shadcn Adds

- Styled month grid, day cells, and navigation affordances

## Installation

```bash
pnpm dlx shadcn-vue@latest add calendar
```

## Example Patterns

- Vanilla: embedded calendar
- Contextual: used inside `date-picker`

## Official Docs Example Coverage

- `Calendar Systems`: switching between Gregorian and alternate calendars such as Persian/Hijri/Jalali using `@internationalized/date` placeholders.
- `Month and Year Selector`: enabling month-and-year layouts and supplying `placeholder` or `defaultPlaceholder`.
- `Date of Birth Picker`: composing `Calendar` inside a `Popover` with a trigger button.
- `Date and Time Picker`: pairing the calendar with a native time input.
- `Natural Language Picker`: combining calendar selection with `chrono-node` parsing.
- `Custom Heading and Cell Size`: overriding heading and cell presentation with slots and utility classes.

## Practical Notes

- The official docs repeatedly emphasize `placeholder` or `defaultPlaceholder` when using advanced calendar layouts or non-default calendar systems.
- Keep `Calendar` embedded when date picking is the main task, and move it into `Popover` only when space needs to be preserved.
- Use `RangeCalendar` instead of stretching a single-date calendar into a start/end workflow.
