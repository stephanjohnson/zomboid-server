---
description: Styled range calendar built on the reka-ui range-calendar primitive.
tags: [shadcn-vue, reka-ui, range-calendar]
---

# Range Calendar

Use `RangeCalendar` when date ranges should be selected from a visible calendar grid.

## When to Use

- Booking ranges and reporting windows
- Availability and planning tools

## Wraps

- `reka-ui` range-calendar primitive

## What Shadcn Adds

- Styled day-range presentation aligned with the rest of the calendar system

## Installation

```bash
pnpm dlx shadcn-vue@latest add range-calendar
```

## Example Patterns

- Vanilla: embedded range calendar
- Contextual: `date-range-picker` composition

## Official Docs Example Coverage

- `Two-month range picker`: embedded range selection across adjacent months.
- `About`: guidance on using `Calendar` for single-date work and `RangeCalendar` for start/end flows.

## Practical Notes

- The official example keeps range selection visible and embedded, which is a better default than hiding a range workflow prematurely.
- Use a composed date-range popover only when page space is the real constraint.
