# Visual Design Language

This document is the source of truth for the UI system in `zomboid-server/src`.

All future UI work must align with these rules unless a clear product requirement makes an exception necessary. When an exception is needed, document it in the PR or task notes before shipping.

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
- Do not add custom CSS files, scoped `<style>` blocks, or inline visual styles for standard UI work.
- Do not build one-off visual systems for individual pages.
- Do not hard-code color ramps like `slate`, `amber`, `emerald`, or `white/10` for application surfaces when a semantic token already exists.

## Theme Contract

The global theme in `app/assets/css/main.css` is the only place where visual tokens should be defined.

Use semantic tokens only:

- `background`
- `foreground`
- `card`
- `card-foreground`
- `popover`
- `popover-foreground`
- `primary`
- `primary-foreground`
- `secondary`
- `secondary-foreground`
- `muted`
- `muted-foreground`
- `accent`
- `accent-foreground`
- `destructive`
- `destructive-foreground`
- `border`
- `input`
- `ring`

Never replace semantic tokens with page-specific color systems.

## Component Hierarchy

Reach for these primitives before writing custom markup:

- `Button`
- `Input`
- `Textarea`
- `Select`
- `Switch`
- `Checkbox`
- `Label`
- `Card`
- `Badge`
- `Alert`
- `Separator`
- `Tabs`

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
- Responsive layout classes like `md:grid-cols-2`
- Content flow helpers like `text-center` or `line-clamp-*`

Avoid unless absolutely necessary:

- Arbitrary tracking values
- Arbitrary border radii
- Custom gradients
- Custom shadows
- Hard-coded palette utilities
- Inline `:style` values for backgrounds, borders, or typography
- Decorative utility stacks that duplicate what a shadcn component already provides

If a class only changes appearance and not layout, stop and ask whether the base component or theme token should handle it instead.

## Layout Patterns

Use these default patterns across the app.

### Pages

- Page content should live in a centered container with consistent spacing.
- Primary actions should sit near the page title or in the relevant card footer.
- Avoid oversized hero sections unless the product explicitly needs them.

### Forms

- Forms should usually live in a `Card`.
- Use `CardHeader` for context, `CardContent` for fields, and `CardFooter` for actions.
- Use responsive grids for multi-column field layouts.
- Field labels should use `Label`.
- Validation and error states should use `Alert`.

### Lists and Collections

- Repeated items should usually be rendered as `Card` instances.
- Metadata should use `Badge` where appropriate.
- Section separation should come from spacing, cards, and `Separator`, not decorative background treatments.

### Settings Toggles

- Pair `Switch` or `Checkbox` with clear labels and short supporting text.
- Use bordered rows or cards for grouped settings instead of floating controls with ad hoc alignment.

## Typography

- Let the shadcn type scale do the work.
- Use `CardTitle`, `CardDescription`, and standard body text styles before adding manual type classes.
- Use emphasis sparingly.
- Avoid highly stylized uppercase label systems unless the pattern is already part of the shared UI.

## Radius, Border, and Shadow

- Use the system radius from the theme.
- Use standard card borders and input borders.
- Avoid custom rounded values like `rounded-[2rem]`.
- Avoid custom shadow treatments. Use component defaults.

## Color Usage

- Default surfaces should be `background`, `card`, or `muted`.
- Interactive emphasis should come from `primary`, `secondary`, `accent`, or `destructive`.
- Status chips should use `Badge` variants before inventing new fills or outlines.
- Alerts should use `Alert` variants before custom notification styling.

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
- Use real labels for form controls.
- Keep clickable targets large enough by relying on existing button and input sizing.

## Implementation Checklist

Before shipping a UI change, verify:

- The screen uses existing shadcn primitives where applicable.
- There are no new `<style>` blocks.
- There are no new inline background or border styles.
- There are no hard-coded palette-driven surface classes when semantic tokens exist.
- Tailwind classes are mostly structural.
- New patterns are reusable and consistent with adjacent screens.

## Decision Rule

When choosing between speed and consistency, choose consistency.

If a UI element looks like a control, status, section, message, or content container that already exists elsewhere in the app, reuse the system version instead of designing a new one.
