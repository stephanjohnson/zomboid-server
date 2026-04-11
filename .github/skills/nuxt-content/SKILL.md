---
name: nuxt-content
description: Use when working with Nuxt Content v3, markdown content, or content-driven features in Nuxt. Covers typed collections, querying, MDC rendering, database configuration, and preview workflows.
license: MIT
metadata:
  version: "1.0.0"
---

# Nuxt Content v3

Use this skill for content-driven Nuxt apps with typed collections and SQL-backed queries. Follow the workflow in order unless the task is a tiny content fix.

## When to Use

Working with:

- Content collections (`content.config.ts`, `defineCollection`)
- Remote sources (GitHub repos, external APIs via `defineCollectionSource`)
- Content queries (`queryCollection`, navigation, search)
- MDC rendering (`<ContentRenderer>`, prose components)
- Database configuration (SQLite, PostgreSQL, D1, LibSQL)
- Content hooks (`content:file:beforeParse`, `content:file:afterParse`)
- i18n multi-language content
- NuxtStudio or preview mode
- LLMs integration (`nuxt-llms`)

**For Nuxt app conventions:** use `nuxt` skill first

## Core Principles

- Treat content as schema-driven application data, not untyped markdown blobs.
- Define collections first, then shape content files and queries around those contracts.
- Keep rendering declarative with `ContentRenderer` and MDC components instead of post-processing HTML manually.
- Prefer collection-aware queries over ad hoc filesystem assumptions.
- Keep editorial workflows predictable: local authoring, preview, and deployment should use the same data model.

## Available Guidance

Read specific files based on current work:

- **[references/collections.md](references/collections.md)** - defineCollection, schemas, sources, content.config.ts
- **[references/querying.md](references/querying.md)** - queryCollection, navigation, search, surroundings
- **[references/rendering.md](references/rendering.md)** - ContentRenderer, MDC syntax, prose components, Shiki
- **[references/config.md](references/config.md)** - Database setup, markdown plugins, renderer options
- **[references/studio.md](references/studio.md)** - NuxtStudio integration, preview mode, live editing

## Loading Files

**Consider loading these reference files based on your task:**

- [ ] [references/collections.md](references/collections.md) - if setting up collections, schemas, or content.config.ts
- [ ] [references/querying.md](references/querying.md) - if using queryCollection, navigation, or search
- [ ] [references/rendering.md](references/rendering.md) - if rendering markdown/MDC or working with ContentRenderer
- [ ] [references/config.md](references/config.md) - if configuring database, markdown plugins, or renderer options
- [ ] [references/studio.md](references/studio.md) - if integrating NuxtStudio or preview mode

**DO NOT load all files at once.** Load only what's relevant to your current task.

## 1) Define the content model first (required)

- Decide whether each collection is `page` content, structured `data`, or a remote source.
- Load [references/collections.md](references/collections.md) before changing `content.config.ts`, schemas, or collection sources.
- Make frontmatter and content body fit the schema instead of allowing inconsistent authoring patterns.

## 2) Load the matching query and rendering references (required)

- Querying, navigation, search, and surrounding content -> load [references/querying.md](references/querying.md)
- MDC, prose components, or `ContentRenderer` work -> load [references/rendering.md](references/rendering.md)
- Database, markdown plugins, or renderer options -> load [references/config.md](references/config.md)
- Preview mode or editorial workflows -> load [references/studio.md](references/studio.md)

## 3) Prefer typed, collection-aware implementation patterns (required)

- Query through `queryCollection()` and related helpers instead of duplicating file path logic.
- Keep collection schemas narrow and explicit so queries, rendering, and generated types stay predictable.
- Use content navigation metadata intentionally; do not rely on implicit ordering for important navigation.
- Treat remote sources as first-class collections with clear mapping and normalization.

## 4) Add editorial features only when the product needs them

- Multi-language content -> keep locale structure explicit
- Preview or live editing -> align with the same schema and rendering pipeline
- Search -> use collection metadata and content indexes deliberately instead of scanning raw markdown at runtime

## 5) Final self-check before finishing

- Collections and schemas match the real content model.
- Queries are collection-aware and typed.
- Rendering uses `ContentRenderer` and MDC conventions where appropriate.
- Preview and deployment paths use the same content contracts.
- Only the relevant reference files were loaded.

## Key Concepts

| Concept         | Purpose                                                           |
| --------------- | ----------------------------------------------------------------- |
| Collections     | Typed content groups with schemas                                 |
| Page vs Data    | `page` = routes + body, `data` = structured data only             |
| Remote sources  | `source.repository` for GitHub, `defineCollectionSource` for APIs |
| queryCollection | SQL-like fluent API for content                                   |
| MDC             | Vue components inside markdown                                    |
| ContentRenderer | Renders parsed markdown body                                      |

## Quick Start

```ts
// content.config.ts
import { defineCollection, defineContentConfig, z } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    blog: defineCollection({
      type: 'page',
      source: 'blog/**',
      schema: z.object({
        title: z.string(),
        date: z.date(),
      }),
    }),
  },
})
```

```vue
<!-- pages/blog/[...slug].vue -->
<script setup lang="ts">
const { data: page } = await useAsyncData(
  () => queryCollection('blog').path(useRoute().path).first()
)
</script>

<template>
  <ContentRenderer v-if="page" :value="page" />
</template>
```

**Verify setup:** Run `npx nuxi typecheck` to confirm collection types resolve. If `queryCollection` returns empty, check that content files exist in the path matching your `source` glob.

## Directory Structure

```
project/
├── content/                    # Content files
│   ├── blog/                   # Maps to 'blog' collection
│   └── .navigation.yml         # Navigation metadata
├── components/content/         # MDC components
└── content.config.ts           # Collection definitions
```

## Official Documentation

- Nuxt Content: https://content.nuxt.com
- MDC syntax: https://content.nuxt.com/docs/files/markdown#mdc-syntax
- Collections: https://content.nuxt.com/docs/collections/collections

## Token Efficiency

Main skill: ~300 tokens. Each sub-file: ~800-1200 tokens. Only load files relevant to current task.
