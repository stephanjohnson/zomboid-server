---
name: nuxt-modules
description: "Use when creating Nuxt modules: (1) Published npm modules (@nuxtjs/, nuxt-), (2) Local project modules (modules/ directory), (3) Runtime extensions (components, composables, plugins), (4) Server extensions (API routes, middleware), (5) Releasing/publishing modules to npm, (6) Setting up CI/CD workflows for modules. Provides defineNuxtModule patterns, Kit utilities, hooks, E2E testing, and release automation."
license: MIT
metadata:
  version: "1.0.0"
---

# Nuxt Module Development

Use this skill for creating Nuxt modules that extend framework functionality. Follow the workflow in order so the module shape, runtime injection, and release steps stay aligned.

**Related skills:** `nuxt` (application conventions), `vue-best-practices` (runtime component/composable patterns)

## When to Use

- Creating a published Nuxt module for npm
- Adding a local project module under `modules/`
- Injecting runtime components, composables, plugins, or server handlers
- Working with `defineNuxtModule`, Nuxt Kit utilities, or module hooks
- Writing E2E coverage for a module playground or fixture
- Publishing, versioning, or automating release workflows

## Quick Start

```bash
npx nuxi init -t module my-module
cd my-module && npm install
npm run dev        # Start playground
npm run dev:build  # Build in watch mode
npm run test       # Run tests
```

## Core Principles

- Decide whether the work belongs in an app, a layer, or a module before extracting it.
- Keep module setup declarative: options in, generated/runtime behavior out.
- Use Nuxt Kit utilities instead of manual file copying or brittle path assumptions.
- Test modules through real Nuxt fixtures or playgrounds, not only unit mocks.
- Treat publishing and CI as part of the module contract, not an afterthought.

## Available Guidance

- **[references/development.md](references/development.md)** - Module anatomy, defineNuxtModule, Kit utilities, hooks
- **[references/testing-and-publishing.md](references/testing-and-publishing.md)** - E2E testing, best practices, releasing, publishing
- **[references/ci-workflows.md](references/ci-workflows.md)** - Copy-paste CI/CD workflow templates

## Loading Files

**Consider loading these reference files based on your task:**

- [ ] [references/development.md](references/development.md) - if building module features, using defineNuxtModule, or working with Kit utilities
- [ ] [references/testing-and-publishing.md](references/testing-and-publishing.md) - if writing E2E tests, publishing to npm, or following best practices
- [ ] [references/ci-workflows.md](references/ci-workflows.md) - if setting up CI/CD workflows for your module

**DO NOT load all files at once.** Load only what's relevant to your current task.

## 1) Choose the right module shape first (required)

- Published package -> full module project with playground and tests
- Local project extension -> `modules/` directory module
- Simple one-off hook -> inline module in `nuxt.config.ts`

If you are unsure, load [references/development.md](references/development.md) before writing code.

## 2) Build around `defineNuxtModule()` and runtime boundaries (required)

- Keep install-time code in the module entry.
- Put app runtime code under `runtime/`.
- Use Nuxt Kit helpers for templates, auto-imports, components, server handlers, and hooks.
- Keep module options typed and minimal.

## 3) Test and package the module as a real integration (required)

- Load [references/testing-and-publishing.md](references/testing-and-publishing.md) when adding behavior that must work in a consumer app.
- Verify the playground or fixture reflects how downstream users will actually consume the module.
- Treat release metadata, peer dependencies, and generated files as part of the public API.

## 4) Add CI and release automation only when the module is meant to ship

- Load [references/ci-workflows.md](references/ci-workflows.md) for publish automation, versioning, or release validation.

## 5) Final self-check before finishing

- The chosen module type matches the use case.
- `defineNuxtModule()` options and runtime boundaries are clear.
- Runtime code lives under `runtime/` and install-time code stays in the module entry.
- The module is covered by a realistic fixture or playground when behavior matters.
- CI and publishing steps are present if the module is intended for distribution.

## Module Types

| Type      | Location         | Use Case                         |
| --------- | ---------------- | -------------------------------- |
| Published | npm package      | `@nuxtjs/`, `nuxt-` distribution |
| Local     | `modules/` dir   | Project-specific extensions      |
| Inline    | `nuxt.config.ts` | Simple one-off hooks             |

## Project Structure

```
my-module/
├── src/
│   ├── module.ts           # Entry point
│   └── runtime/            # Injected into user's app
│       ├── components/
│       ├── composables/
│       ├── plugins/
│       └── server/
├── playground/             # Dev testing
└── test/fixtures/          # E2E tests
```

## Resources

- [Module Guide](https://nuxt.com/docs/guide/going-further/modules)
- [Nuxt Kit](https://nuxt.com/docs/api/kit)
- [Module Starter](https://github.com/nuxt/starter/tree/module)

_Token efficiency: Main skill ~300 tokens, each reference ~700-1200 tokens_
