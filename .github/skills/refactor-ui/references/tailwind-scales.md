# Tailwind Implementation Scales

Concrete scales and patterns for applying Refactoring UI principles with Tailwind CSS.

## Spacing Scale

Use a constrained set of spacing values instead of arbitrary numbers. Stick to this subset for consistency:

```
Tight:    gap-1 (4px)   gap-1.5 (6px)  gap-2 (8px)
Medium:   gap-3 (12px)  gap-4 (16px)   gap-6 (24px)
Loose:    gap-8 (32px)  gap-12 (48px)  gap-16 (64px)
Sections: gap-20 (80px) gap-24 (96px)
```

**Rule:** Spacing between groups should always be larger than spacing within groups.

```html
<!-- Bad: same spacing everywhere, no grouping -->
<div class="space-y-4">
  <h2>Title</h2>
  <p>Description</p>
  <h2>Another Title</h2>
  <p>Another description</p>
</div>

<!-- Good: tighter within groups, looser between groups -->
<div class="space-y-8">
  <div class="space-y-2">
    <h2>Title</h2>
    <p>Description</p>
  </div>
  <div class="space-y-2">
    <h2>Another Title</h2>
    <p>Another description</p>
  </div>
</div>
```

## Type Scale

Use a handcrafted set of sizes. Avoid adjacent sizes that are too similar.

```
xs:   text-xs   (12px)  — captions, badges, metadata
sm:   text-sm   (14px)  — secondary text, help text
base: text-base (16px)  — body text
lg:   text-lg   (18px)  — subheadings, emphasized body
xl:   text-xl   (20px)  — section headings
2xl:  text-2xl  (24px)  — page headings
3xl:  text-3xl  (30px)  — hero headings
```

**Skip sizes to create clear hierarchy.** If body is `text-sm`, jump to `text-lg` or `text-xl` for headings — not `text-base`.

### Weight Hierarchy

Use weight to reinforce size hierarchy, not replace it:

```
font-normal (400)  — body text, descriptions
font-medium (500)  — labels, nav items, subtle emphasis
font-semibold (600) — headings, primary actions
font-bold (700)    — hero text, strong emphasis (use sparingly)
```

## Text Color Hierarchy

Use at most 3-4 text colors for most interfaces:

```
Primary:   text-foreground            — headings, primary content
Secondary: text-muted-foreground      — descriptions, metadata, help text
Tertiary:  text-muted-foreground/60   — placeholders, disabled, timestamps
Inverse:   text-primary-foreground    — text on colored backgrounds
```

**Before making something louder, try making everything around it quieter.**

```html
<!-- Bad: everything at full contrast -->
<div>
  <span class="text-foreground font-semibold">John Doe</span>
  <span class="text-foreground">john@example.com</span>
  <span class="text-foreground">3 hours ago</span>
</div>

<!-- Good: hierarchy through de-emphasis -->
<div>
  <span class="text-foreground font-medium">John Doe</span>
  <span class="text-muted-foreground text-sm">john@example.com</span>
  <span class="text-muted-foreground/60 text-xs">3 hours ago</span>
</div>
```

## Shadow / Elevation System

Use a small set of elevations, not one-off shadows:

```
Flat:      shadow-none     — inline content, cards at rest
Raised:    shadow-sm       — cards, buttons on hover
Floating:  shadow-md       — dropdowns, popovers
Overlay:   shadow-lg       — modals, dialogs
Prominent: shadow-xl       — command palettes, spotlights
```

**Lower elevation = tighter, darker shadow. Higher elevation = softer, more spread.**

## Width Constraints

Don't stretch content to fill the viewport. Use `max-w-*` constraints:

```
Prose:     max-w-prose  (65ch) — long-form text, articles
Forms:     max-w-md     (28rem) — single-column forms
Cards:     max-w-sm     (24rem) — card grids, sidebars
Content:   max-w-4xl    (56rem) — main content area
Page:      max-w-6xl    (72rem) — page container
Full:      max-w-7xl    (80rem) — wide layouts, dashboards
```

## Before/After: Card Component

```html
<!-- Before: flat, no hierarchy, arbitrary spacing -->
<div class="border p-4">
  <div class="text-base font-bold">Project Update</div>
  <div class="text-base text-gray-500 mt-2">March 2026</div>
  <div class="text-base mt-2">We shipped the new dashboard with improved performance metrics and user feedback integration.</div>
  <button class="mt-2 bg-blue-500 text-white px-4 py-2">Read More</button>
</div>

<!-- After: clear hierarchy, intentional spacing, depth -->
<div class="rounded-lg border bg-card p-6 shadow-sm">
  <div class="space-y-1.5">
    <h3 class="text-lg font-semibold text-foreground">Project Update</h3>
    <p class="text-sm text-muted-foreground">March 2026</p>
  </div>
  <p class="mt-4 text-sm text-muted-foreground leading-relaxed">
    We shipped the new dashboard with improved performance metrics and user feedback integration.
  </p>
  <button class="mt-6 inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90">
    Read More
  </button>
</div>
```

Key changes: grouped heading + date with tight spacing (`space-y-1.5`), looser spacing to body (`mt-4`) and CTA (`mt-6`), de-emphasized date with `text-sm text-muted-foreground`, constrained padding with `p-6`, subtle depth with `shadow-sm`.
