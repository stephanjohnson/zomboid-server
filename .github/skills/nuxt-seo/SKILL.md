---
name: nuxt-seo
description: Use when configuring SEO for Nuxt apps. Covers site config, crawlability, sitemaps, OG images, schema.org, and SEO utilities. Pair this with nuxt and nuxt-content when SEO work touches routing or content collections.
license: MIT
metadata:
  version: "1.0.0"
---

# Nuxt SEO

Use this skill as the SEO layer for Nuxt apps. Follow the workflow in order so crawlability, metadata, and structured data stay consistent.

```bash
npx nuxi module add @nuxtjs/seo
```

## When to Use

Working with:

- SEO configuration (site URL, name, indexability)
- Robots.txt and sitemap.xml generation
- Dynamic OG image generation
- JSON-LD structured data (schema.org)
- Breadcrumbs and canonical URLs

**For Nuxt app structure:** use `nuxt`
**For content-driven metadata:** use `nuxt-content`

## Core Principles

- Set the site foundation first. Most SEO errors come from missing or inconsistent site config.
- Make indexability explicit; do not rely on default robots behavior for sensitive or preview routes.
- Generate metadata from the same typed source of truth as the page content whenever possible.
- Keep canonical URLs, sitemap entries, and schema output aligned.
- Prefer module APIs over manual `<meta>` duplication.

## Loading Files

**Consider loading these reference files based on your task:**

- [ ] [references/site-config.md](references/site-config.md) - if configuring site URL, name, or SEO foundation
- [ ] [references/crawlability.md](references/crawlability.md) - if setting up robots.txt or sitemap.xml
- [ ] [references/og-image.md](references/og-image.md) - if generating dynamic OG images
- [ ] [references/schema-org.md](references/schema-org.md) - if adding JSON-LD structured data
- [ ] [references/utilities.md](references/utilities.md) - if working with breadcrumbs, canonical URLs, or link checking

**DO NOT load all files at once.** Load only what's relevant to your current task.

## 1) Establish the site foundation first (required)

- Load [references/site-config.md](references/site-config.md) before working on robots, sitemaps, OG images, or schema.
- Confirm site URL, environment-specific indexability, canonical behavior, and shared metadata defaults.

## 2) Load the matching SEO capability references (required)

- Robots, crawlability, or sitemap concerns -> load [references/crawlability.md](references/crawlability.md)
- Dynamic or route-aware social images -> load [references/og-image.md](references/og-image.md)
- Structured data or rich results -> load [references/schema-org.md](references/schema-org.md)
- Breadcrumbs, canonicals, or validation helpers -> load [references/utilities.md](references/utilities.md)

## 3) Apply SEO from the application data model (required)

- Keep page metadata close to the route, page, or content record that owns it.
- For content sites, prefer collection-driven metadata and `asSeoCollection()` where it fits.
- For dynamic routes, ensure canonical URLs and OG images resolve from real route params and server-safe data.

## 4) Validate crawlability and output before finishing

- Check which routes should be indexed and which should be blocked.
- Confirm sitemap inclusion/exclusion rules are intentional.
- Ensure structured data reflects the rendered page, not stale defaults.

## 5) Final self-check before finishing

- Site config is present and correct.
- Crawlability rules are explicit.
- OG image generation matches the content and route model.
- Schema output and canonical URLs are aligned with rendered pages.
- Only the relevant reference files were loaded.

## Site Config

Foundation for all SEO modules. Configure `site` in `nuxt.config.ts`, access via `useSiteConfig()`. See [references/site-config.md](references/site-config.md) for full options.

## Module Overview

| Module            | Purpose         | Key API                       |
| ----------------- | --------------- | ----------------------------- |
| nuxt-site-config  | Shared config   | `useSiteConfig()`             |
| @nuxtjs/robots    | robots.txt      | `useRobotsRule()`             |
| @nuxtjs/sitemap   | sitemap.xml     | `defineSitemapEventHandler()` |
| nuxt-og-image     | OG images       | `defineOgImage()`             |
| nuxt-schema-org   | JSON-LD         | `useSchemaOrg()`              |
| nuxt-seo-utils    | Meta utilities  | `useBreadcrumbItems()`        |
| nuxt-link-checker | Link validation | Build-time checks             |

## Nuxt Content v3

Use `asSeoCollection()` for automatic sitemap, og-image, and schema-org from frontmatter:

```ts
// content.config.ts
import { defineCollection, defineContentConfig } from '@nuxt/content'
import { asSeoCollection } from '@nuxtjs/seo/content'

export default defineContentConfig({
  collections: {
    posts: defineCollection(asSeoCollection({ type: 'page', source: 'posts/**' }))
  }
})
```

**Important:** Load `@nuxtjs/seo` before `@nuxt/content` in modules array:

```ts
export default defineNuxtConfig({
  modules: ['@nuxtjs/seo', '@nuxt/content']
})
```

Frontmatter fields: `ogImage`, `sitemap`, `robots`, `schemaOrg`.

## Related Skills

- [nuxt-content](../nuxt-content/SKILL.md) - For MDC rendering with SEO frontmatter

## Links

- [Documentation](https://nuxtseo.com)
- [GitHub](https://github.com/harlan-zw/nuxt-seo)

## Token Efficiency

Main skill: ~250 tokens. Each sub-file: ~400-600 tokens. Only load files relevant to current task.
