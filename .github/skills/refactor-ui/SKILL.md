---
name: refactor-ui
description: Use when reviewing or improving UI quality. Applies Refactoring UI principles to hierarchy, spacing, typography, color, and depth so Vue, Nuxt, and shadcn interfaces feel intentional instead of accidental.
license: MIT
metadata:
  version: "1.0.0"
---

# Refactor UI

Use this skill as a design review and implementation workflow. It is most useful after the feature structure is clear and before you start polishing one-off visual details.

## When to Use

- Reviewing UI that feels flat, noisy, cramped, or inconsistent
- Turning rough functional layouts into polished interfaces
- Refining shadcn, Reka, Vue, or Nuxt app surfaces
- Deciding hierarchy, spacing, typography, color, and depth rules

## Available Guidance

| File | Topics |
| ---- | ------ |
| **[references/tailwind-scales.md](references/tailwind-scales.md)** | Concrete spacing, type, color, shadow, and width scales with before/after examples |

## Loading Files

**Consider loading these reference files based on your task:**

- [ ] [references/tailwind-scales.md](references/tailwind-scales.md) - if implementing UI changes and need concrete Tailwind values for spacing, typography, color hierarchy, or elevation

## Core Principles

- Start from the feature, not the app shell.
- Design the smallest useful version first and iterate on real UI.
- Limit choices with defined scales and tokens instead of improvising values.
- Emphasize by de-emphasizing competing elements before making the primary element louder.
- Treat hierarchy, spacing, typography, color, and depth as a system, not isolated tweaks.

## 1) Start from the feature, not the shell (required)

- Begin with the main interaction the user came to perform.
- Delay global shell decisions until the feature itself is readable and useful.
- Work in grayscale or low-color states first so hierarchy and spacing carry the design.
- Design pessimistically: ship the smallest version that clearly solves the problem.

## 2) Establish hierarchy before styling details (required)

- Identify one primary action or focal point per view.
- Demote metadata, helper copy, labels, and tertiary controls with lighter color, smaller size, or lower weight.
- Use at most a small set of text colors and weights for most interfaces.
- Avoid defaulting to `label: value` patterns when the value can stand on its own.
- Treat section headings like structural labels unless they truly deserve headline prominence.

## 3) Fix layout and spacing with a scale (required)

- Start with more white space than feels necessary, then tighten deliberately.
- Use a constrained spacing scale instead of arbitrary increments.
- Keep group spacing larger than internal spacing so grouping is obvious without borders.
- Do not stretch content just because the viewport is wide. Use width constraints, columns, or fixed sidebars when appropriate.
- Let density be an intentional product decision, not the accidental result of squeezing everything together.

## 4) Tune typography for readability (required)

- Use a handcrafted type scale rather than many near-identical sizes.
- Prefer highly legible fonts with enough weights to build hierarchy cleanly.
- Keep paragraph line lengths under control.
- Align mixed-size text by baseline, not by visual centering.
- Match line-height to font size and line length instead of applying one global value.

## 5) Apply color and depth as systems, not decoration (required)

- Define complete color ramps for neutrals and semantic colors before reaching for ad hoc shades.
- Use slightly warm or cool neutrals instead of dead greys when the product needs character.
- Keep text contrast accessible without washing color out.
- Use depth cues to communicate elevation: tighter shadows for low elevation, larger softer shadows for overlays.
- Prefer a small, reusable elevation system over one-off shadow values.

## 6) Final polish pass before finishing

- Check that the primary action or content block is obvious within one screen glance.
- Remove decorative elements that are not helping hierarchy, readability, or feedback.
- Ensure buttons and actions reflect importance, not only semantics.
- Confirm forms, tables, and mixed-content layouts still scan cleanly on mobile.
- Tighten the design system if you introduced too many one-off values.

## Final self-check before finishing

- The feature is the visual focus, not the surrounding layout chrome.
- Hierarchy is clear without relying on louder colors everywhere.
- Spacing and typography follow a repeatable system.
- Colors and shadows feel intentional and reusable.
- The UI reads clearly on both desktop and mobile.

## Related Skills

- `shadcn` for styled component composition
- `reka-ui` for headless primitive behavior

_Token efficiency: Main skill ~350 tokens and intended to stay loaded while refining UI decisions_
