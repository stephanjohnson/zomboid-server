---
description: Styled aspect-ratio wrapper built on the reka-ui primitive.
tags: [shadcn-vue, reka-ui, aspect-ratio]
---

# Aspect Ratio

Use `AspectRatio` to preserve image, video, or preview proportions while allowing responsive width.

## When to Use

- Media thumbnails and previews
- Embedded video or card media

## Wraps

- `reka-ui` aspect-ratio primitive

## What Shadcn Adds

- Registry-friendly import surface and easy class extension

## Installation

```bash
pnpm dlx shadcn-vue@latest add aspect-ratio
```

## Example Patterns

- Vanilla: image thumbnail box
- Contextual: media card or content preview surface

## Official Docs Example Coverage

- `Responsive media frame`: the official page shows a single-image preview inside a `16 / 9` container, which is the core pattern for screenshots, article hero media, and embedded thumbnails.
- `Card media shell`: the same pattern is intended to be composed into cards or carousel items, where the ratio container owns the crop and the parent owns spacing, borders, and metadata.

## Practical Notes

- Keep `AspectRatio` responsible only for geometry; put borders, captions, and actions outside unless the media should visually own them.
- Use `object-cover` for decorative previews and `object-contain` when the full asset must remain visible.
- Prefer wrapping a single media node. If you need overlays, place them inside the ratio container and position them absolutely.

## Related Components

- `card`, `carousel`, `avatar`
