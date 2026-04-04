---
name: shadcn
description: Use when building with shadcn-vue components. Covers registry installation, styled wrappers over Reka UI primitives, component mapping, contextual examples, and composition guidance for Vue and Nuxt apps.
license: MIT
metadata:
  version: "1.0.0"
---

# Shadcn Vue

Use this skill as the styled component layer on top of `reka-ui`. Follow the workflow in order so component selection, wrapper behavior, and examples stay aligned.

## When to Use

- Building or refactoring UI with shadcn-vue components
- Deciding whether to use a shadcn wrapper or raw Reka primitives
- Documenting or extending generated registry components
- Building components that need both a minimal usage example and a real composition example

**For underlying accessibility and primitive behavior:** use `reka-ui`
**For hierarchy, spacing, and visual polish:** use `refactor-ui`

## Core Principles

- Treat every shadcn component as a styled wrapper around a smaller primitive model, usually from `reka-ui`.
- Start from the wrapped primitive's behavior and API, then document what shadcn adds.
- Prefer generated registry components over bespoke local rewrites.
- For each mapped component, capture both a vanilla usage pattern and a contextual usage pattern when the component commonly appears inside larger surfaces.
- If shadcn-vue MCP is available, use it to inspect registry entries and installation payloads before manually reverse-engineering wrappers.

## Available Guidance

| File | Topics |
| ---- | ------ |
| **[references/components.md](references/components.md)** | Component index and mapping status |
| `components/*.md` | Per-component wrapper details, examples, and composition notes |

## Loading Files

**Consider loading these reference files based on your task:**

- [ ] [references/components.md](references/components.md) - if you need to choose a component or see which component mappings exist
- [ ] [components/<name>.md](components/accordion.md) - if you are working on a specific shadcn component and need the wrapper details

**DO NOT load all files at once.** Load only the component mapping files relevant to the current task.

## 1) Pick the layer first (required)

- Use `shadcn` when you want styled defaults and design-system consistency.
- Use `reka-ui` when you need the primitive behavior but plan to own the styling and composition yourself.
- If you are unsure, load the shadcn component mapping first and confirm which primitive it wraps.

## 2) Map the wrapper to the primitive (required)

- Read the component guide to identify the wrapped primitive, forwarded props, added slots, default classes, icons, and dependencies.
- Do not assume the shadcn wrapper exposes behavior beyond the underlying primitive.
- When manually copying registry files, keep helper imports and utility dependencies intact.

## 3) Start with a vanilla example, then compose it into a real surface (required)

- Build a minimal example first so the base API is clear.
- Add a second example that shows the component in a real UI surface such as a form, card, admin panel, or content section.
- Be explicit when a component often appears inside forms but is not itself a form control.

## 4) Preserve registry conventions (required)

- Import from `@/components/ui/<component>`.
- Keep `cn()` helper usage, forwarded props, and slot structure consistent with the registry output.
- Prefer local `class` extension and composition before changing the wrapper internals.

## 5) Final self-check before finishing

- The task truly called for the shadcn layer instead of raw Reka primitives.
- The relevant component mapping file was loaded.
- The wrapper behavior matches the underlying primitive.
- The documentation includes both baseline and contextual examples where that adds real value.
- Styling changes remain consistent with the broader component system.

## Key Concepts

| Concept | Description |
| ------- | ----------- |
| Registry component | A generated wrapper copied from the shadcn-vue registry into your project |
| Wrapped primitive | The underlying `reka-ui` primitive that owns behavior and accessibility |
| Forwarded props | Props and emits passed through to the primitive rather than reimplemented |
| Vanilla example | Minimal usage showing the component's base API |
| Contextual example | Usage inside a real surface such as a form, card, or admin flow |
| MCP inspection | Optional shadcn-vue MCP workflow for inspecting registry metadata and installation payloads |

## Quick Reference

```bash
pnpm dlx shadcn-vue@latest add <component>
```

Manual inspection and local MCP entrypoint:

```bash
npx shadcn-vue@latest mcp
```

_Token efficiency: Main skill ~350 tokens, component docs should be loaded one at a time._