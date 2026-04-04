---
description: Global config provider built on the reka-ui config-provider primitive.
tags: [shadcn-vue, reka-ui, config-provider]
---

# Config Provider

Use `ConfigProvider` to set shared direction, locale, or other cross-cutting primitive behavior.

## When to Use

- Locale-sensitive date and direction-aware interfaces
- App-wide primitive configuration

## Wraps

- `reka-ui` config-provider primitive

## What Shadcn Adds

- Alignment with the rest of the shadcn wrapper layer

## Installation

```bash
pnpm dlx shadcn-vue@latest add config-provider
```

## Example Patterns

- Vanilla: provider at feature boundary
- Contextual: app shell with direction and locale setup
