# Visual Design Language

This document is the source of truth for the UI system in `zomboid-server/src`.

All future UI work must align with these rules unless a clear product requirement makes an exception necessary. When an exception is needed, document it in the PR or task notes before shipping.

## Reference Implementations

The onboarding page (`app/pages/onboarding.vue` and its `OnboardingSetupPanel` component) and the dashboard page (`app/pages/profiles/[profileId]/index.vue` with its `SectionCards` component) are the gold-standard screens. When in doubt about how a pattern should look or behave, match these two pages.

## Goal

Create a calm, consistent, shadcn-first interface that feels like one system instead of a mix of bespoke screens.

The design language should read as:

- Neutral, readable, and structured.
- Component-driven instead of hand-styled.
- Token-based instead of hard-coded.
- Consistent across admin, profile, telemetry, and store surfaces.

## Core Rules

- Use shadcn base components first.
- Prefer composition over custom styling.
- Use Tailwind only for layout, spacing, sizing, and responsive structure.
- Do not add custom CSS files or inline visual styles for standard UI work. Scoped `<style>` blocks are acceptable only for keyframe animations that cannot be expressed with Tailwind (e.g. the floating logo in the auth layout).
- Do not build one-off visual systems for individual pages.
- Do not hard-code color ramps for application surfaces when a semantic token already exists. Status indicator dots and contextual action buttons are the exception — see the Status Indicators and Button Patterns sections below.

## Theme Contract

The global theme in `app/assets/css/theme.css` is the only place where visual tokens should be defined.

Use semantic tokens for surfaces, text, and borders:

- `background`, `foreground`
- `card`, `card-foreground`
- `popover`, `popover-foreground`
- `primary`, `primary-foreground`
- `secondary`, `secondary-foreground`
- `muted`, `muted-foreground`
- `accent`, `accent-foreground`
- `destructive`, `destructive-foreground`
- `border`, `input`, `ring`

Never replace semantic tokens with page-specific color systems. Hard-coded palette colors are reserved for the small, fixed set of status indicators and contextual action buttons documented below.

## Component Hierarchy

Reach for these primitives before writing custom markup:

**Layout and surfaces:**
`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `Separator`, `Tabs`, `Badge`, `Alert`, `AlertDescription`, `Progress`

**Form controls:**
`Button`, `Input`, `Textarea`, `Select`, `Switch`, `Checkbox`, `Label`, `RadioGroup`, `RadioGroupItem`

**Field system (for grouped form rows):**
`FieldSet`, `FieldLegend`, `Field`, `FieldLabel`, `FieldTitle`, `FieldContent`, `FieldDescription`

If the needed pattern does not exist:

1. Check whether a shadcn primitive already supports it with variants or composition.
2. If not, add or scaffold the missing base component in `app/components/ui`.
3. Only then build a feature-specific wrapper on top of that base component.

Do not skip straight to ad hoc page markup for controls that should be system components.

## Layer Boundary

Application code must only consume the shadcn UI layer from `app/components/ui`.

- Pages, layouts, feature components, and composables must not import `reka-ui` directly.
- `reka-ui` is allowed only inside the shadcn wrapper components in `app/components/ui`.
- If a primitive needs adjustment, fix it in the shared shadcn wrapper instead of bypassing that layer in feature code.

This keeps the dependency stack clean:

1. App and feature code use shadcn components.
2. Shadcn wrapper components may use Reka internally.
3. No feature surface should know or care about the underlying primitive library.

## Tailwind Usage Rules

Tailwind is allowed for structure, not for inventing a second visual language.

Good Tailwind usage:

- `flex`, `grid`, `gap-*`, `space-y-*`
- `w-*`, `max-w-*`, `min-h-*`
- `items-center`, `justify-between`
- Responsive and container-query classes like `md:grid-cols-2`, `@xl/main:grid-cols-2`
- Content flow helpers like `text-center`, `text-balance`, `line-clamp-*`
- Opacity modifiers on semantic tokens like `border-border/70`, `bg-card/80`, `from-primary/5`

Avoid unless absolutely necessary:

- Arbitrary border radii (use `rounded-xl` or the theme radius)
- Custom shadow values (use `shadow-xs` or `shadow-sm` from the theme)
- Hard-coded palette utilities for surfaces when a semantic token exists
- Inline `:style` values for backgrounds, borders, or typography
- Decorative utility stacks that duplicate what a shadcn component already provides

If a class only changes appearance and not layout, stop and ask whether the base component or theme token should handle it instead.

## Layout Patterns

### Page Spacing

Dashboard-style pages use `flex flex-col gap-4 py-4 md:gap-6 md:py-6` as the outer wrapper.

Content sections within a page use `px-4 lg:px-6` for horizontal padding.

The default layout wraps page content in a `@container/main` so that child grids can use container queries (`@xl/main`, `@5xl/main`) instead of only viewport breakpoints.

### Pages

- Page content flows as a vertical flex column with consistent `gap-4`/`gap-6` spacing.
- Primary actions sit in a flex row between sections, wrapped with `flex items-center justify-between`.
- Avoid oversized hero sections unless the product explicitly needs them.

### Auth / Onboarding Pages

- Two-column grid: left column holds the form, right column holds a background image (hidden on mobile).
- Form content width adapts per route (e.g. `max-w-sm` for login, `max-w-xl`/`max-w-2xl` for onboarding).
- The page header uses a kicker + title + subtitle pattern (see Typography section).

### Forms

- Large forms use a bordered section container: `rounded-xl border border-border/70 bg-card/80 p-6 shadow-xs md:p-7`.
- Within the section, a title block comes first (`text-base font-semibold` title + `text-sm text-muted-foreground` description), followed by a field grid.
- Use responsive grids for multi-column field layouts: `grid gap-5 md:grid-cols-2`. Full-width fields span `md:col-span-2`.
- Field labels use `Label`. Each field group uses `grid gap-2` (label → input → helper text).
- Helper text below inputs is `text-xs text-muted-foreground`.
- Validation feedback uses the same helper text position with dynamic color (e.g. `text-destructive` for errors).
- Error summaries use `Alert variant="destructive"` outside the form section.
- Submit buttons are full-width (`w-full`) with a supporting note below center-aligned in `text-xs text-muted-foreground`.

For grouped radio/checkbox options, use the Field system:

- Wrap in `FieldSet` with `FieldLegend` and `FieldDescription`.
- Each option uses `FieldLabel` containing a horizontal `Field` with `FieldContent` (title + description) and the control on the right.

### Lists and Collections

- List items inside a `Card` use `divide-y divide-border` with `py-4 first:pt-0 last:pb-0`.
- Each row is a flex container: avatar/icon on the left, text in the middle, status or action on the right.
- Initials avatars use a `size-10` circle with a tinted background (e.g. `bg-emerald-500/10`, `bg-primary/10`) and `text-sm font-medium` initials.
- Empty states are centered with `py-8 text-center`, a primary message in `text-sm text-muted-foreground`, and optional secondary text in `text-xs text-muted-foreground`.

### Settings Toggles

- Pair `Switch` or `Checkbox` with clear labels and short supporting text.
- Use bordered rows or cards for grouped settings instead of floating controls with ad hoc alignment.

## Status Cards

The dashboard uses a 4-up metric card grid. Follow this pattern for any summary/metric display:

- Grid: `grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4`.
- Each card uses a subtle gradient: `bg-gradient-to-t from-primary/5 to-card` with `shadow-xs`.
- `CardDescription` holds an icon (`size-3.5 text-muted-foreground`) and a short label.
- `CardTitle` holds a status dot + the metric value, styled `text-lg font-semibold tabular-nums`.
- `CardFooter` holds secondary context in `text-sm text-muted-foreground`, and optionally a `Progress` bar (`h-1.5 w-full`).

## Status Indicators

A fixed palette of hard-coded colors is used exclusively for real-time status. These are the only allowed non-token colors:

| State | Dot / Icon Color | Usage |
|---|---|---|
| Online / Ready / Active | `bg-emerald-500` | Status dots, player online indicators |
| Transitioning / Starting | `text-amber-500` (on spinner) | `LoaderCircle` with `animate-spin` |
| Error / Offline | `bg-red-500` | Status dots for error states |
| Neutral / Unknown | `bg-muted-foreground` | Default when no status is known |

Status dots are `size-2 rounded-full` inline with the metric text.

Animated spinners use `LoaderCircle` from lucide with `size-4 animate-spin`.

Do not invent new status colors. If a new state is needed, map it to one of these four.

## Button Patterns

### Standard Variants

- **Primary action:** Default `Button` (e.g. form submit, "Initialize application").
- **Destructive action:** `variant="destructive"` (e.g. "Stop Server").
- **Secondary action:** `variant="outline"` (e.g. "Backups", "Logs", "Edit").
- **Tertiary / utility:** `variant="ghost"` (e.g. "Refresh").

### Contextual Server Actions

Server control buttons use a small, fixed set of contextual colors since they represent real-time operations, not general UI:

- **Start:** `bg-emerald-600 hover:bg-emerald-700 text-white` with `Play` icon.
- **Stop:** `variant="destructive"` with `Power` icon.
- **Restart:** `border-yellow-600 text-yellow-600 hover:bg-yellow-600/10` on an outline button with `RotateCcw` icon.

### Button Content

- Action buttons use `size="sm"` in toolbars and action rows.
- Icons are `size-4` and placed before the label.
- Loading states change the label text (e.g. "Starting...") and set `disabled`.
- Link-style buttons use `as-child` wrapping a `NuxtLink`.

## Icon Sizing

Use consistent icon sizes:

- `size-3` — Inline copy/check icons in tight spaces.
- `size-3.5` — Card description labels, metadata rows.
- `size-4` — Button icons, action items, status spinners.

All icons come from `lucide-vue-next`.

## Typography

Follow a strict type hierarchy. Do not add ad hoc font-size or font-weight classes outside these tiers:

| Role | Classes | Example |
|---|---|---|
| Page title | `text-2xl font-bold` | "Create your server workspace" |
| Section kicker | `text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground` | "First-Run Setup" |
| Section title | `text-base font-semibold` | Form section headings, card group headings |
| Card metric | `text-lg font-semibold tabular-nums` | Status card values, counts |
| Card title (list) | `text-base font-medium` | "Online Players", "Server Profile" |
| Body | `text-sm` | Descriptions, list item names, card footer text |
| Helper / muted | `text-xs text-muted-foreground` | Field hints, supporting notes, timestamps |
| Validation error | `text-xs text-destructive` | Inline field errors |

Use `CardTitle` and `CardDescription` for card headers — they map to this scale. Use `text-balance` on subtitle text that may wrap awkwardly.

The section kicker pattern (uppercase, tracked, muted) is used on auth/onboarding pages to label the current step. Do not use it elsewhere without a clear reason.

## Radius, Border, and Shadow

- Use the system radius from the theme (`rounded-md` for inputs, `rounded-lg` for cards, `rounded-xl` for form sections).
- Use standard card borders and input borders.
- Form section containers use `border-border/70` (slightly transparent) and `bg-card/80` for a layered look.
- Status cards use `shadow-xs`. Content cards use the component default.
- Avoid custom rounded values like `rounded-[2rem]`.
- Avoid custom shadow values outside the theme scale.

## Color Usage

- Default surfaces should be `background`, `card`, or `muted`.
- Status card gradient: `bg-gradient-to-t from-primary/5 to-card` — this is the only sanctioned gradient.
- Interactive emphasis should come from `primary`, `secondary`, `accent`, or `destructive`.
- Status indication uses the fixed palette documented in the Status Indicators section.
- Status chips should use `Badge` variants before inventing new fills or outlines.
- Alerts should use `Alert` variants before custom notification styling.
- Tinted avatar backgrounds use the relevant status color at `/10` opacity (e.g. `bg-emerald-500/10`).

## Loading and Transition States

- Server action buttons show a text change ("Start Server" → "Starting...") and become `disabled` while loading.
- Status cards show a `LoaderCircle` spinner (`size-4 animate-spin text-amber-500`) during transitional phases (updating, initializing, starting).
- Phase progress is shown with a `Progress` bar (`h-1.5 w-full`) in the card footer, with percentage in the title detail text.
- Page-level navigation shows `NuxtLoadingIndicator` colored with `var(--color-primary)`.
- Toast notifications use Sonner with `rich-colors` for server action feedback (success/error).

## Connection Info Pattern

Metadata rows (e.g. host, ports) use a horizontal flex layout inside a `Card`:

- `CardContent` with `flex flex-wrap items-center gap-x-6 gap-y-2`.
- A leading label in `text-sm font-medium`.
- Each datum: `text-xs text-muted-foreground` label + `code` badge (`rounded bg-muted px-1.5 py-0.5 text-xs font-medium`).
- Copy-to-clipboard: a `size-6` ghost button with `Clipboard` / `Check` icon (`size-3`), check icon in `text-emerald-500`.

## Responsive Design

**Mobile-first.** Default layout is single-column; expand at breakpoints.

- `md` (768px): Multi-column form grids, sidebar visibility changes.
- `lg` (1024px): Sidebar visible and inset, padding increases from `px-4` to `px-6`.
- Container queries on `@container/main`: `@xl/main:grid-cols-2`, `@5xl/main:grid-cols-4` for metric card grids.

The auth layout uses a 2-column grid (`lg:grid-cols-2`) where the right column (background image) is hidden on mobile.

The onboarding form adapts its max-width per route: `max-w-sm` default, `max-w-xl md:max-w-2xl` for the setup form.

## Store and Commerce Surfaces

Store screens must follow the same system as admin and profile screens.

- Product, category, cart, and bundle views should be composed from `Card`, `Badge`, `Button`, `Input`, `Alert`, and `Separator`.
- Do not introduce a separate storefront-only gradient, glass, or color language.
- Product options should use system buttons or system selection components.
- Pricing, metadata, and stock status should read as structured content, not marketing art direction.

## Telemetry and Admin Surfaces

Telemetry editors and admin tools should feel like product UI, not dashboards from another brand.

- Prefer nested cards and section spacing over tinted panels.
- Keep badges semantic and restrained.
- Use system components for toggles, tabs, and grouped controls.

## Accessibility and Interaction

- Preserve focus rings from the shadcn components.
- Keep contrast driven by semantic tokens.
- Do not remove outlines or rings.
- Use real labels for form controls (every `Input` should have a corresponding `Label` with a matching `for`/`id`).
- Keep clickable targets large enough by relying on existing button and input sizing.
- Copy-to-clipboard buttons should include a `title` attribute for tooltip context.

## Implementation Checklist

Before shipping a UI change, verify:

- The screen uses existing shadcn primitives where applicable.
- There are no new `<style>` blocks (except for keyframe animations).
- There are no new inline background or border styles outside the documented patterns.
- Hard-coded palette colors are limited to the status indicator and contextual button palettes documented above.
- Tailwind classes are mostly structural.
- Typography follows the documented hierarchy — no ad hoc font-size or font-weight combos.
- Status indicators use the standard dot pattern and fixed color palette.
- Forms follow the bordered section + field grid pattern from onboarding.
- New patterns are reusable and consistent with the reference implementations.

## Decision Rule

When choosing between speed and consistency, choose consistency.

If a UI element looks like a control, status, section, message, or content container that already exists in the reference implementations, reuse the system version instead of designing a new one.
