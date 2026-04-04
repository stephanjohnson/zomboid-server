---
description: Carousel pattern for horizontally scrollable content.
tags: [shadcn-vue, carousel, media]
---

# Carousel

Use `Carousel` for horizontally browsable groups of related content.

## When to Use

- Media galleries and feature highlights
- Card collections with a bounded viewport

## Built From

- Carousel library integration and shadcn-styled controls

## What Shadcn Adds

- Prev/next controls, layout helpers, and standard wrapper styling

## Installation

```bash
pnpm dlx shadcn-vue@latest add carousel
```

## Example Patterns

- Vanilla: basic slide set
- Contextual: product card or media gallery carousel

## Official Docs Example Coverage

- `Sizes`: controlling slide width with `basis-*` utilities on `CarouselItem`.
- `Spacing`: using negative margin on `CarouselContent` and padding on items instead of `gap`.
- `Orientation`: switching between horizontal and vertical carousels.
- `Options`: passing Embla options through `opts`.
- `API`: capturing the Embla API via `@init-api` or template refs.
- `Events`: listening to Embla events after API initialization.
- `Slot Props`: using `canScrollNext`, `canScrollPrev`, and related helpers from the default slot.
- `Plugins`: adding Embla plugins such as autoplay.

## Practical Notes

- The official docs treat `basis-*` and `pl-*`/`-ml-*` utilities as the primary sizing and spacing API rather than extra component props.
- Use the API only when you need custom indicators, external controls, analytics hooks, or autoplay behavior.
- When the content is mostly static and never overflows, a grid is usually simpler than a carousel.
