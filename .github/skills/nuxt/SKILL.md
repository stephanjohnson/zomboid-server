---
name: nuxt
description: Use when working on Nuxt 4+ projects. Covers server routes, SSR boundaries, file-based routing, middleware, plugins, composables, and configuration. Load this with vue-best-practices for Nuxt apps, and let Nuxt-specific guidance override generic Vue patterns when they conflict.
license: MIT
metadata:
  version: "1.0.0"
---

# Nuxt Best Practices

Use this skill as the Nuxt-specific layer on top of the generic Vue guidance. Follow the workflow in order unless the task is trivially small.

## When to Use

Working with:

- Server routes (API endpoints, server middleware, server utils)
- File-based routing (pages, layouts, route groups)
- Nuxt middleware (route guards, navigation)
- Nuxt plugins (app extensions)
- Nuxt-specific features (auto-imports, layers, modules)
- Request-safe shared state with `useState()`
- SSR, hydration, and client/server boundary decisions

**For core Vue component/composable patterns:** use `vue-best-practices` first, then apply the Nuxt overrides in this skill.

## Core Principles

- Prefer Nuxt-native primitives before introducing generic Vue patterns or extra libraries.
- Treat server, client, and universal execution as separate runtime contexts. Decide the boundary before writing code.
- Prefer `useState()` for Nuxt-wide shared state instead of adding Pinia by default.
- Keep secrets, privileged IO, and trusted data shaping on the server.
- Use Nuxt routing, data fetching, and head management APIs instead of recreating them manually.

## Available Guidance

Read specific files based on current work:

- **[references/server.md](references/server.md)** - API routes, server middleware, validation (Zod), WebSocket, SSE
- **[references/routing.md](references/routing.md)** - File-based routing, route groups, typed router, definePage
- **[references/middleware-plugins.md](references/middleware-plugins.md)** - Route middleware, plugins, app lifecycle
- **[references/nuxt-composables.md](references/nuxt-composables.md)** - Nuxt composables (useRequestURL, useFetch, navigation)
- **[references/nuxt-components.md](references/nuxt-components.md)** - NuxtLink, NuxtImg, NuxtTime (prefer over HTML elements)
- **[references/nuxt-config.md](references/nuxt-config.md)** - Configuration, modules, auto-imports, layers

**For Vue composables and component boundaries:** use `vue-best-practices`
**For content-driven sites:** use `nuxt-content` skill
**For creating modules:** use `nuxt-modules` skill
**For AppHost wiring, Docker, CI/CD, and deployment:** use `aspire` skill
**For reusable utilities and composables:** check `vueuse` before writing custom helpers

## Loading Files

**Consider loading these reference files based on your task:**

- [ ] [references/server.md](references/server.md) - if creating API endpoints or server middleware
- [ ] [references/routing.md](references/routing.md) - if setting up pages, layouts, or route groups
- [ ] [references/nuxt-composables.md](references/nuxt-composables.md) - if using Nuxt composables (useFetch, useRequestURL, etc.)
- [ ] [references/middleware-plugins.md](references/middleware-plugins.md) - if working with middleware or plugins
- [ ] [references/nuxt-components.md](references/nuxt-components.md) - if using Nuxt components (NuxtLink, NuxtImg, etc.)
- [ ] [references/nuxt-config.md](references/nuxt-config.md) - if editing nuxt.config.ts

**DO NOT load all files at once.** Load only what's relevant to your current task.

## 1) Confirm the execution boundary before coding (required)

- Decide whether the task belongs in `server/`, `pages/`, `components/`, `app/`, or shared universal code.
- If code touches browser-only APIs, mark the client boundary explicitly.
- If code touches cookies, headers, secrets, or privileged data access, move it to the server.
- If shared state must survive navigation and remain request-safe in SSR, prefer `useState()`.

## 2) Load the required references for the task (required)

- Server routes, server middleware, validation, SSE, or WebSocket work -> load [references/server.md](references/server.md)
- Pages, layouts, route groups, or navigation structure -> load [references/routing.md](references/routing.md)
- `useFetch`, `useAsyncData`, `useRequestURL`, navigation helpers, or shared Nuxt composables -> load [references/nuxt-composables.md](references/nuxt-composables.md)
- Route middleware, plugins, or app lifecycle hooks -> load [references/middleware-plugins.md](references/middleware-plugins.md)
- `NuxtLink`, `NuxtImg`, or `NuxtTime` usage -> load [references/nuxt-components.md](references/nuxt-components.md)
- `nuxt.config.ts`, modules, layers, or runtime config -> load [references/nuxt-config.md](references/nuxt-config.md)
- AppHost wiring, Docker, CI/CD, or deployment work -> load `aspire` skill

## 3) Apply Nuxt-first implementation rules (required)

- Prefer `useAsyncData()` or `useFetch()` for request-aware data fetching instead of ad hoc client-only effects.
- Prefer route middleware and server handlers over manual router interception or browser-only auth guards.
- Keep page components thin composition surfaces; move reusable feature logic into composables and child components.
- Prefer framework primitives like `NuxtLink`, `NuxtPage`, `NuxtLayout`, `useHead`, and `definePageMeta` over custom replacements.
- Keep SSR output deterministic. Avoid reading time-, random-, or browser-specific values during server render unless guarded.

## 4) Add optional framework features only when the requirement exists

- Content-driven pages -> use `nuxt-content`
- SEO concerns -> use `nuxt-seo`
- Custom framework extensions -> use `nuxt-modules`
- Reusable browser helpers -> check `vueuse`

## 5) Nuxt-specific testing guidance

- Prefer testing `useState()` and Nuxt-native state patterns instead of introducing Pinia just for tests.
- For component and composable tests, use `vue-testing-best-practices` and apply these Nuxt overrides.

## 6) Final self-check before finishing

- Vue guidance was applied first, and Nuxt-specific rules were used where they override generic Vue patterns.
- The server/client/universal boundary is explicit and correct.
- Shared state uses `useState()` unless there is a strong reason for a different store pattern.
- Data fetching, routing, and middleware use Nuxt-native APIs.
- SSR and hydration behavior are predictable.
- Only the relevant reference files were loaded.

## Quick Start

```ts
// server/api/hello.get.ts
import { z } from 'zod'

export default defineEventHandler(async (event) => {
  const { name } = await getValidatedQuery(event, z.object({
    name: z.string().default('world'),
  }).parse)
  return { message: `Hello ${name}` }
})
```

## Nuxt 4 vs Older Versions

**You are working with Nuxt 4+.** Key differences:

| Old (Nuxt 2/3)    | New (Nuxt 4)                    |
| ----------------- | ------------------------------- |
| `<Nuxt />`        | `<NuxtPage />`                  |
| `context.params`  | `getRouterParam(event, 'name')` |
| `window.origin`   | `useRequestURL().origin`        |
| String routes     | Typed router with route names   |
| Separate layouts/ | Parent routes with `<slot>`     |

**If you're unsure about Nuxt 4 patterns, read the relevant guidance file first.**

## Latest Documentation

**When to fetch latest docs:**

- New Nuxt 4 features not covered here
- Module-specific configuration
- Breaking changes or deprecations
- Advanced use cases

**Official sources:**

- Nuxt: https://nuxt.com/docs
- h3 (server engine): https://v1.h3.dev/
- Nitro: https://nitro.build/

## Token Efficiency

Main skill: ~300 tokens. Each sub-file: ~800-1500 tokens. Only load files relevant to current task.
