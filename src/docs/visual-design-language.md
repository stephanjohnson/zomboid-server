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
- Fully functional in both light and dark modes.

## Core Rules

- Use shadcn base components first.
- Prefer composition over custom styling.
- Use CVA (Class Variance Authority) for variant management when building or extending components.
- Use Tailwind only for layout, spacing, sizing, and responsive structure.
- Do not add custom CSS files or inline visual styles for standard UI work. Scoped `<style>` blocks are acceptable only for keyframe animations that cannot be expressed with Tailwind (e.g. the floating logo in the auth layout).
- Do not build one-off visual systems for individual pages.
- Never use Tailwind's built-in color palette (`emerald-*`, `red-*`, `slate-*`, `blue-*`, etc.) directly in component or page code. All colors must come from semantic tokens defined in `theme.css`. This ensures the theme file has full control over the visual identity and that dark mode works automatically.
- All components and surfaces must work correctly in both light and dark modes. Test both before shipping.

## Theme Contract

The global theme in `app/assets/css/theme.css` is the only place where visual tokens should be defined.

### Color Space

All color tokens use the **oklch()** color space. oklch provides perceptually uniform color mixing and consistent contrast across the palette. When adding or adjusting tokens, always use oklch values -- never hsl, rgb, or hex.

### Dark Mode

Dark mode is implemented via the `.dark` class on the root element, using the `@custom-variant dark (&:is(.dark *))` directive in Tailwind.

- Every semantic token must have both a `:root` (light) and `.dark` variant defined in `theme.css`.
- Use `dark:` prefix classes sparingly and only when a token-based approach cannot express the need (e.g. `dark:bg-input/30` for a semi-transparent input background in dark mode).
- The primary color may shift between light and dark modes for legibility, but should remain recognizably the same hue.
- Test all new surfaces in both modes. Do not assume light-mode-only usage.

### Semantic Tokens

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

### Sidebar Tokens

The sidebar has its own token set for visual separation from the main content area:

- `sidebar`, `sidebar-foreground`
- `sidebar-primary`, `sidebar-primary-foreground`
- `sidebar-accent`, `sidebar-accent-foreground`
- `sidebar-border`, `sidebar-ring`

### Chart Tokens

Data visualization uses a five-step chart palette (`chart-1` through `chart-5`). Use these tokens for all chart and graph coloring instead of hard-coded palette values.

Never use Tailwind palette colors directly. Every color in the application must resolve to a semantic token from `theme.css`.

## Component Hierarchy

Reach for these primitives before writing custom markup:

**Layout and surfaces:**
`Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`, `Separator`, `Tabs`, `Badge`, `Alert`, `AlertDescription`, `Progress`

**Navigation and sidebar:**
`Sidebar`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarGroup`, `SidebarGroupLabel`, `SidebarGroupContent`, `SidebarMenu`, `SidebarMenuItem`, `SidebarMenuButton`, `SidebarProvider`, `SidebarInset`

**Overlays and dialogs:**
`Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`, `Sheet`, `SheetContent`, `SheetHeader`, `SheetTitle`, `SheetDescription`, `Popover`, `PopoverContent`, `PopoverTrigger`, `Tooltip`, `TooltipContent`, `TooltipTrigger`, `DropdownMenu`, `DropdownMenuContent`, `DropdownMenuItem`, `DropdownMenuTrigger`

**Form controls:**
`Button`, `Input`, `Textarea`, `Select`, `NumberField`, `Switch`, `Checkbox`, `Label`, `RadioGroup`, `RadioGroupItem`, `Toggle`, `ToggleGroup`

**Field system (for grouped form rows):**
`FieldSet`, `FieldLegend`, `Field`, `FieldLabel`, `FieldTitle`, `FieldContent`, `FieldDescription`

**Data display:**
`Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`, `TableCaption`

If the needed pattern does not exist:

1. Check whether a shadcn primitive already supports it with variants or composition.
2. If not, add or scaffold the missing base component in `app/components/ui`.
3. Only then build a feature-specific wrapper on top of that base component.

Do not skip straight to ad hoc page markup for controls that should be system components.

For numeric entry, use `NumberField` instead of `Input type="number"`.

- Use `Input` for freeform text, passwords, search, and raw string values.
- Use `NumberField` for bounded numeric values, quantities, prices, percentages, ports, sort order, and other step-based numeric controls.
- If a repeated numeric-input composition is needed, create a shared wrapper in `app/components/`, not in `app/components/ui/`.
- Do not patch or fork the shared shadcn number-field primitives for feature-specific behavior.

## Container Nesting and Border Layering

Keep the container hierarchy flat. Visible borders should never stack more than **two levels deep** (e.g. a page-level Card containing input fields that have their own borders). Deeply nested borders create visual noise, reduce contrast between levels of hierarchy, and make the interface feel cluttered.

### The Two-Border Rule

Count the visible bordered containers from the outermost surface to the innermost content. At most two should carry a visible border at any point in the tree:

1. **Level 0** -- Page background (`background` token). No border.
2. **Level 1** -- Primary container. A `Card` or a bordered form section (`rounded-xl border border-border/70 bg-card/80`). This is the outermost border.
3. **Level 2** -- Interactive controls inside that container. Input fields, select dropdowns, checkbox list containers. These have their own `border-input` border. This is the maximum.

A Card inside another Card, or a bordered `div` inside a bordered section inside a Card, violates this rule.

### What to Use Instead of Nested Borders

When content inside a Card needs visual grouping, reach for these tools in order of preference:

| Need | Solution | Example |
| --- | --- | --- |
| Separate sibling items in a list | `divide-y divide-border` on the parent | Player list rows inside a Card |
| Separate logical sections in a form | `Separator` or `space-y-6` gap | Multi-section settings form |
| Group related fields visually | Background tint: `rounded-lg bg-muted/10 p-4` | Advanced options block inside a Card |
| Expandable sub-sections | `Collapsible` with a `border-t` separator on the content, not a bordered wrapper | Config editor groups |
| Repeated items (variants, option groups) | Background tint + spacing: `rounded-lg bg-muted/10 p-4` in a `space-y-3` list | Product variants inside a form section |
| Tabbed sub-content | `Tabs` with padding on `TabsContent`, no additional border | Settings categories |

### Patterns to Avoid

- **Card inside Card.** Never wrap a `Card` in another `Card`. If you need a sub-container, use a background tint or spacing instead.
- **Card inside a bordered section.** The `rounded-xl border border-border/70 bg-card/80` form section pattern already acts as a Card-level container. Do not place full `Card` components inside it. Use background tints (`rounded-lg bg-muted/10 p-4`) for sub-groups.
- **Bordered div inside a bordered div inside a Card.** Three visible borders stacking is always wrong. Replace at least one layer with spacing or a background tint.
- **Collapsible wrappers with their own border inside a Card.** Use `border-t` on the content separator only, or use a background tint for the collapsed group. Do not give the collapsible wrapper its own `border` class.

### Existing Violations

Some existing components (e.g. config editor sections with collapsible groups containing nested Cards) predate this rule. These should be refactored toward the flat pattern when touched. New code must follow the two-border rule from the start.

## Layer Boundary

Application code must only consume the shadcn UI layer from `app/components/ui`.

- Pages, layouts, feature components, and composables must not import `reka-ui` directly.
- `reka-ui` is allowed only inside the shadcn wrapper components in `app/components/ui`.
- If a primitive needs adjustment, fix it in the shared shadcn wrapper instead of bypassing that layer in feature code.

This keeps the dependency stack clean:

1. App and feature code use shadcn components.
2. Shadcn wrapper components may use Reka internally.
3. No feature surface should know or care about the underlying primitive library.

## CVA Variant Pattern

Components that support visual variants must use Class Variance Authority (CVA) for type-safe variant management. This keeps variant logic declarative and co-located with the component.

```ts
const buttonVariants = cva('base-classes', {
  variants: {
    variant: { default: '...', destructive: '...', outline: '...', ghost: '...' },
    size: { sm: '...', default: '...', lg: '...', icon: '...' },
  },
  defaultVariants: { variant: 'default', size: 'default' },
})
```

- Define variants alongside the component, not in consuming code.
- Expose a `class` prop that is merged with `cn()` so consumers can add layout classes without overriding visual ones.
- Use the `cn()` utility (clsx + tailwind-merge) for all class composition to handle Tailwind conflicts intelligently.

## Tailwind Usage Rules

Tailwind is allowed for structure, not for inventing a second visual language.

Good Tailwind usage:

- `flex`, `grid`, `gap-*`, `space-y-*`
- `w-*`, `max-w-*`, `min-h-*`
- `items-center`, `justify-between`
- Responsive and container-query classes like `md:grid-cols-2`, `@xl/main:grid-cols-2`
- Content flow helpers like `text-center`, `text-balance`, `line-clamp-*`
- Opacity modifiers on semantic tokens like `border-border/70`, `bg-card/80`, `from-primary/5`
- Dark-mode overrides like `dark:bg-input/30` when token-based approaches are insufficient

Avoid unless absolutely necessary:

- Arbitrary border radii (use `rounded-xl` or the theme radius)
- Custom shadow values (use `shadow-xs` or `shadow-sm` from the theme)
- Hard-coded palette utilities for surfaces when a semantic token exists
- Inline `:style` values for backgrounds, borders, or typography
- Decorative utility stacks that duplicate what a shadcn component already provides

If a class only changes appearance and not layout, stop and ask whether the base component or theme token should handle it instead.

## Component Sizing Standards

Use consistent, predictable sizing for interactive elements:

| Component         | Default Height         | Small         | Large          |
| ---               | ---                    | ---           | ---            |
| Button            | `h-9` (36px)           | `h-8` (32px)  | `h-10` (40px)  |
| Input / Select    | `h-9` (36px)           | --            | --             |
| Icon button       | `size-9` (36px square) | `size-8`      | `size-10`      |
| Toggle            | `h-9`                  | `h-8`         | `h-10`         |
| Sidebar menu item | `h-8`                  | `h-7`         | `h-12`         |

- Default padding for buttons: `px-4 py-2` (default), `px-3 py-1` (small), `px-6 py-2` (large).
- Default padding for inputs: `px-3 py-1`.
- Interactive elements should always use `text-sm` and `font-medium` for label text.

## Layout Patterns

### Page Spacing

Dashboard-style pages use `flex flex-col gap-4 py-4 md:gap-6 md:py-6` as the outer wrapper.

Content sections within a page use `px-4 lg:px-6` for horizontal padding.

The default layout wraps page content in a `@container/main` so that child grids can use container queries (`@xl/main`, `@5xl/main`) instead of only viewport breakpoints.

### Pages

- Page content flows as a vertical flex column with consistent `gap-4`/`gap-6` spacing.
- Primary actions sit in a flex row between sections, wrapped with `flex items-center justify-between`.
- Avoid oversized hero sections unless the product explicitly needs them.

### Page Headings

Page headings sit directly on the page background -- **never inside a Card or bordered section**. The layout header already provides navigation context (sidebar trigger, breadcrumb). The page heading adds the title, description, and page-level actions.

Structure:

```html
<div class="px-4 lg:px-6">
  <div class="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
    <div class="min-w-0 flex-1 space-y-1">
      <h2 class="text-2xl font-bold">Page title here</h2>
      <p class="text-sm text-balance text-muted-foreground">
        Optional description text.
      </p>
    </div>
    <!-- Page-level actions (search, buttons) aligned right on desktop -->
  </div>
</div>
```

Rules:

- The heading uses `text-2xl font-bold` (page title tier).
- Description uses `text-sm text-muted-foreground`.
- On desktop (`md`+), the title block and actions sit side by side. On mobile, they stack.
- Do not wrap the heading in a `Card`, bordered `section`, or any container with a visible border or shadow. The heading is part of the page flow, not a content card.
- If the page uses `Tabs` below the heading, the `TabsList` sits between the heading and the tab content as a separate row -- not inside the heading area or inside a card.

Anti-patterns:

- Card containing the page title, description, tabs, and search together (turns the heading into a "hero block").
- Bordered section wrapping both the heading and the tab content.
- Repeating kicker + title patterns inside tab panels when the page heading already establishes context.

### Sidebar Layout

The application uses a sidebar-based layout with the following structure:

```text
SidebarProvider
  Sidebar (collapsible, with sidebar tokens)
    SidebarHeader
    SidebarContent
      SidebarGroup(s)
        SidebarGroupLabel
        SidebarGroupContent
          SidebarMenu
            SidebarMenuItem(s)
              SidebarMenuButton
    SidebarFooter
  SidebarInset
    Header (breadcrumb/navigation bar)
    Main content area
```

- The sidebar uses its own token set (`sidebar`, `sidebar-foreground`, etc.) for visual separation.
- On desktop (>= `md` / 768px), the sidebar is persistent and can be collapsed to icon-only mode.
- On mobile (< `md`), the sidebar renders as a sheet/drawer overlay.
- Toggle the sidebar with keyboard shortcut (Cmd/Ctrl + B).
- Collapsed state shows `size-8` icon-only buttons.
- Active menu items use `sidebar-accent` background with `font-medium`.

### Auth / Onboarding Pages

- Two-column grid: left column holds the form, right column holds a background image (hidden on mobile).
- Form content width adapts per route (e.g. `max-w-sm` for login, `max-w-xl`/`max-w-2xl` for onboarding).
- The page header uses a kicker + title + subtitle pattern (see Typography section).

### Forms

- Large forms use a bordered section container: `rounded-xl border border-border/70 bg-card/80 p-6 shadow-xs md:p-7`.
- Within the section, a title block comes first (`text-base font-semibold` title + `text-sm text-muted-foreground` description), followed by a field grid.
- Use responsive grids for multi-column field layouts: `grid gap-5 md:grid-cols-2`. Full-width fields span `md:col-span-2`.
- Field labels use `Label`. Each field group uses `grid gap-2` (label -> input -> helper text).
- Helper text below inputs is `text-xs text-muted-foreground`.
- Validation feedback uses the same helper text position with dynamic color (e.g. `text-destructive` for errors).
- Error summaries use `Alert variant="destructive"` outside the form section.
- Submit buttons are full-width (`w-full`) with a supporting note below center-aligned in `text-xs text-muted-foreground`.

For grouped radio/checkbox options, use the Field system:

- Wrap in `FieldSet` with `FieldLegend` and `FieldDescription`.
- Each option uses `FieldLabel` containing a horizontal `Field` with `FieldContent` (title + description) and the control on the right.

For numeric fields:

- Use `NumberField` for the control instead of `Input type="number"`.
- Keep the default `NumberFieldInput` alignment unless a specific product requirement says otherwise.
- Preserve `min`, `max`, `step`, disabled, and placeholder behavior when wrapping numeric controls.

### Input Field Styling

Inputs and number fields follow a consistent visual pattern:

- Height: `h-9` (36px).
- Padding: `px-3 py-1`.
- Border: 1px solid `border-input`.
- Background: transparent in light mode, `bg-input/30` in dark mode.
- Border radius: `rounded-md`.
- Focus state: `focus-visible:border-ring` with `focus-visible:ring-ring/50` and `focus-visible:ring-[3px]`.
- Invalid state: `ring-destructive/20` with `border-destructive`.
- Placeholder: `text-muted-foreground`.
- Selection highlight: `selection:bg-primary selection:text-primary-foreground`.
- Disabled: `opacity-50 cursor-not-allowed`.

Text fields use `Input`. Numeric fields use `NumberField` with `NumberFieldInput`, `NumberFieldDecrement`, and `NumberFieldIncrement`.

### Lists and Collections

- List items inside a `Card` use `divide-y divide-border` with `py-4 first:pt-0 last:pb-0`.
- Each row is a flex container: avatar/icon on the left, text in the middle, status or action on the right.
- Initials avatars use a `size-10` circle with a tinted background (e.g. `bg-primary/10`, `bg-primary/10`) and `text-sm font-medium` initials.
- Empty states are centered with `py-8 text-center`, a primary message in `text-sm text-muted-foreground`, and optional secondary text in `text-xs text-muted-foreground`.

### Settings Toggles

- Pair `Switch` or `Checkbox` with clear labels and short supporting text.
- Use bordered rows or cards for grouped settings instead of floating controls with ad hoc alignment.

## Tabs

Use the shadcn `Tabs`, `TabsList`, and `TabsTrigger` components with their default styling. Do not override `TabsList` with custom background or layout classes (e.g. `bg-transparent`, `flex flex-wrap`).

- `TabsList` provides its own background, padding, and border radius. Use it as-is.
- `TabsTrigger` handles active/inactive states through data attributes. Do not add custom active styling.
- Place `TabsList` as its own row in the page flow, between the page heading and the tab content. Do not nest it inside a Card or bordered section.
- `TabsContent` uses `mt-0` when the tab content follows immediately with its own spacing.
- Badges inside `TabsTrigger` are fine for showing counts (`Badge variant="secondary"`).

## Data Tables

Use `@tanstack/vue-table` for complex data grids that require sorting, filtering, or pagination.

- Wrap in a responsive container with `overflow-auto`.
- Use `text-sm` for table body text, `caption-bottom` for captions.
- Table headers, body, and footer use the system `Table` components.
- Support responsive column hiding at breakpoints for mobile.
- Keep column definitions declarative and co-located with the table component.

For simple, static data lists, prefer `Card` with `divide-y` rows over a full table implementation.

## Dialogs, Sheets, and Overlays

### Dialogs

Use `Dialog` for focused interactions that require user attention (confirmations, forms, detail views).

- Center on screen with a backdrop of `bg-black/80`.
- Content uses `bg-card` with `rounded-lg` and `shadow-lg`.
- Always include `DialogHeader` with `DialogTitle` and optional `DialogDescription`.
- Footer actions go in `DialogFooter`.

### Sheets

Use `Sheet` for supplementary panels that slide in from the side (filters, detail sidebars, mobile navigation).

- Full height, anchored to the edge of the viewport.
- Same header/title/description structure as Dialog.

### Popovers and Dropdowns

- `Popover` for interactive content anchored to a trigger.
- `DropdownMenu` for action lists anchored to a trigger.
- Both use directional slide animations based on placement side.

### Tooltips

- Use `Tooltip` for brief, non-interactive context on hover/focus.
- Keep content short -- one line is ideal.

## Animation and Transition Patterns

Animations should be subtle and fast. The default duration is **200ms**.

### Standard Transitions

- `transition-all` for general smooth transitions on interactive elements.
- `transition-[color,box-shadow]` for focus ring and color state changes.
- `transition-[width,height,padding]` for layout transitions (e.g. sidebar collapse).
- `transition-transform duration-200` for icon rotations (e.g. accordion chevrons).
- `transition-opacity` for hover effects.

### Open/Close Animations

Overlays (dialogs, popovers, dropdowns, sheets) use a consistent enter/exit pattern:

- **Enter:** `fade-in-0` + `zoom-in-95` (scale from 95% to 100%).
- **Exit:** `fade-out-0` + `zoom-out-95` (scale from 100% to 95%).
- **Duration:** 200ms.

Directional overlays (dropdowns, popovers) add a slide based on placement:

- Bottom: `slide-in-from-top-2`
- Top: `slide-in-from-bottom-2`
- Left: `slide-in-from-right-2`
- Right: `slide-in-from-left-2`

### Accordion Animations

Use the `accordion-down` and `accordion-up` keyframes defined in the theme for expand/collapse:

- Duration: 0.2s ease-out.
- Animate `height` from 0 to the content's natural height.

### Rules

- Do not add animations longer than 300ms.
- Do not animate layout properties (width, height) outside of accordion and sidebar patterns.
- Do not use spring or bounce easing -- keep everything linear or ease-out.
- Loading spinners use `animate-spin` (standard Tailwind).

## Status Cards

The dashboard uses a 4-up metric card grid. Follow this pattern for any summary/metric display:

- Grid: `grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4`.
- Each card uses a subtle gradient: `bg-gradient-to-t from-primary/5 to-card` with `shadow-xs`.
- `CardDescription` holds an icon (`size-3.5 text-muted-foreground`) and a short label.
- `CardTitle` holds a status dot + the metric value, styled `text-lg font-semibold tabular-nums`.
- `CardFooter` holds secondary context in `text-sm text-muted-foreground`, and optionally a `Progress` bar (`h-1.5 w-full`).

## Status Indicators

Status indicators must use the existing shadcn semantic tokens, not Tailwind palette colors. Map each state to the token that best represents its intent:

| State | Token | Usage |
| --- | --- | --- |
| Online / Ready / Active | `bg-primary` | Status dots, player online indicators |
| Transitioning / Starting | `text-accent-foreground` (on spinner) | `LoaderCircle` with `animate-spin` |
| Error / Offline | `bg-destructive` | Status dots for error states |
| Neutral / Unknown | `bg-muted-foreground` | Default when no status is known |

Status dots are `size-2 rounded-full` inline with the metric text.

Animated spinners use `LoaderCircle` from lucide with `size-4 animate-spin`.

Do not invent new status states. If a new state is needed, map it to one of these four. Never use Tailwind palette colors (`emerald-*`, `red-*`, `amber-*`, `slate-*`, `blue-*`, `green-*`, `yellow-*`, etc.) directly in component or page code. All colors come from the semantic tokens in `theme.css`.

## Button Patterns

### Standard Variants

Buttons use CVA with the following variant set:

| Variant       | Usage                                                  | Visual                                       |
| ---           | ---                                                    | ---                                          |
| `default`     | Primary action (form submit, "Initialize application") | Primary background, primary-foreground text  |
| `destructive` | Dangerous action ("Stop Server", "Delete")             | Destructive background, destructive-fg text  |
| `outline`     | Secondary action ("Backups", "Logs", "Edit")           | Border only, background on hover             |
| `secondary`   | Lower-emphasis alternative                             | Secondary background                         |
| `ghost`       | Tertiary / utility ("Refresh")                         | No background, subtle hover                  |
| `link`        | Inline text link style                                 | Underline, no background or border           |

### Size Variants

| Size | Classes | Usage |
| --- | --- | --- |
| `sm` | `h-8 px-3` | Toolbars, action rows, compact spaces |
| `default` | `h-9 px-4 py-2` | Standard buttons |
| `lg` | `h-10 px-6` | Prominent actions, hero CTAs |
| `icon` | `size-9` (square) | Icon-only buttons |

### Contextual Server Actions

Server control buttons use shadcn semantic tokens and button variants:

- **Start:** `variant="default"` (primary) with `Play` icon.
- **Stop:** `variant="destructive"` with `Power` icon.
- **Restart:** `variant="outline"` with `RotateCcw` icon.

### Button Content

- Icons are `size-4` and placed before the label with `gap-2`.
- Loading states change the label text (e.g. "Start Server" -> "Starting...") and set `disabled`.
- Link-style buttons use `as-child` wrapping a `NuxtLink`.
- All buttons use `font-medium` and `text-sm`.
- Focus ring: `focus-visible:ring-ring/50` with `focus-visible:ring-[3px]`.

## Badge Patterns

Badges use CVA with the following variants:

| Variant       | Usage                            |
| ---           | ---                              |
| `default`     | Primary badge (status, category) |
| `secondary`   | Lower-emphasis metadata          |
| `destructive` | Warning or error indicator       |
| `outline`     | Bordered, no fill                |

- Sizing: `px-2 py-0.5`, `text-xs`, `font-medium`.
- Icons inside badges: `size-3` with `gap-1`.
- Prefer `Badge` variants over custom pill/chip styling.

## Icon Sizing

Use consistent icon sizes:

- `size-3` -- Inline copy/check icons in tight spaces, badge icons.
- `size-3.5` -- Card description labels, metadata rows.
- `size-4` -- Button icons, action items, status spinners (default).
- `size-5` -- Emphasis icons, navigation items.

All icons come from `lucide-vue-next`.

## Typography

Follow a strict type hierarchy. Do not add ad hoc font-size or font-weight classes outside these tiers:

| Role | Classes | Example |
| --- | --- | --- |
| Page title | `text-2xl font-bold` | "Create your server workspace" |
| Section kicker | `text-xs font-semibold uppercase tracking-[0.35em] text-muted-foreground` | "First-Run Setup" |
| Section title | `text-base font-semibold` | Form section headings, card group headings |
| Card metric | `text-lg font-semibold tabular-nums` | Status card values, counts |
| Card title (list) | `text-base font-medium` | "Online Players", "Server Profile" |
| Body | `text-sm` | Descriptions, list item names, card footer |
| Interactive label | `text-sm font-medium leading-none` | Button text, input labels, menu items |
| Helper / muted | `text-xs text-muted-foreground` | Field hints, supporting notes, timestamps |
| Validation error | `text-xs text-destructive` | Inline field errors |

Use `CardTitle` and `CardDescription` for card headers -- they map to this scale. Use `text-balance` on subtitle text that may wrap awkwardly.

The section kicker pattern (uppercase, tracked, muted) is used on auth/onboarding pages to label the current step. Do not use it elsewhere without a clear reason.

### Font Stack

The system uses the default sans-serif system font stack (`ui-sans-serif, system-ui, ...`). Do not import custom web fonts unless a product decision requires it. The system stack ensures fast loading and native feel across platforms.

- **Sans:** `font-sans` (default for all UI text).
- **Mono:** `font-mono` for code snippets, technical values, and connection info.
- **Serif:** `font-serif` is available but not used in standard UI.

## Radius, Border, and Shadow

- Base radius: `0.625rem` (10px). The theme derives all radius tokens from this:
  - `rounded-sm`: `calc(var(--radius) - 4px)` -- 6px
  - `rounded-md`: `calc(var(--radius) - 2px)` -- 8px (inputs, buttons)
  - `rounded-lg`: `var(--radius)` -- 10px (cards)
  - `rounded-xl`: `calc(var(--radius) + 4px)` -- 14px (form sections)
- Use standard card borders and input borders.
- Form section containers use `border-border/70` (slightly transparent) and `bg-card/80` for a layered look.
- Status cards use `shadow-xs`. Content cards use the component default.
- Shadow scale: `shadow-2xs`, `shadow-xs`, `shadow-sm`, `shadow`, `shadow-md`, `shadow-lg`, `shadow-xl`, `shadow-2xl`. Use only these values.
- Avoid custom rounded values like `rounded-[2rem]`.
- Avoid custom shadow values outside the theme scale.

## Color Usage

Every color in the application must come from a semantic token. Never use Tailwind's built-in palette (`red-500`, `slate-300`, `blue-600`, etc.) directly in templates. If a color isn't available as a token, add it to `theme.css` first.

- Default surfaces: `background`, `card`, or `muted`.
- Status card gradient: `bg-gradient-to-t from-primary/5 to-card` -- this is the only sanctioned gradient.
- Interactive emphasis: `primary`, `secondary`, `accent`, or `destructive`.
- Status indication: `primary` (active), `accent` (transitioning), `destructive` (error), or `muted-foreground` (neutral).
- Status chips: use `Badge` variants before inventing new fills or outlines.
- Alerts: use `Alert` variants before custom notification styling.
- Tinted backgrounds: use semantic tokens at `/10` opacity (e.g. `bg-primary/10`, `bg-primary/10`).

## Loading and Transition States

- Server action buttons show a text change ("Start Server" -> "Starting...") and become `disabled` while loading.
- Status cards show a `LoaderCircle` spinner (`size-4 animate-spin text-accent-foreground`) during transitional phases (updating, initializing, starting).
- Phase progress is shown with a `Progress` bar (`h-1.5 w-full`) in the card footer, with percentage in the title detail text.
- Page-level navigation shows `NuxtLoadingIndicator` colored with `var(--color-primary)`.
- Toast notifications use Sonner with `rich-colors` for server action feedback (success/error).

## Connection Info Pattern

Metadata rows (e.g. host, ports) use a horizontal flex layout inside a `Card`:

- `CardContent` with `flex flex-wrap items-center gap-x-6 gap-y-2`.
- A leading label in `text-sm font-medium`.
- Each datum: `text-xs text-muted-foreground` label + `code` badge (`rounded bg-muted px-1.5 py-0.5 text-xs font-medium`).
- Copy-to-clipboard: a `size-6` ghost button with `Clipboard` / `Check` icon (`size-3`), check icon in `text-primary`.

## Responsive Design

**Mobile-first.** Default layout is single-column; expand at breakpoints.

- `md` (768px): Multi-column form grids, sidebar visibility changes, sidebar converts from sheet overlay to persistent panel.
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

- Preserve focus rings from the shadcn components: `focus-visible:border-ring` with `focus-visible:ring-ring/50` at `focus-visible:ring-[3px]`.
- Do not remove `outline-none` from interactive elements that have ring-based focus indicators.
- Keep contrast driven by semantic tokens.
- Do not remove outlines or rings.
- Use real labels for form controls (every `Input` should have a corresponding `Label` with a matching `for`/`id`).
- Keep clickable targets large enough by relying on existing button and input sizing.
- Copy-to-clipboard buttons should include a `title` attribute for tooltip context.
- Use `aria-invalid` for validation states, `aria-disabled` for disabled states, `role="alert"` for alerts.
- Use `sr-only` for screen-reader-only text when visual context is sufficient for sighted users.

## Implementation Checklist

Before shipping a UI change, verify:

- The screen uses existing shadcn primitives where applicable.
- There are no new `<style>` blocks (except for keyframe animations).
- There are no new inline background or border styles outside the documented patterns.
- No Tailwind palette colors (`emerald-*`, `red-*`, `slate-*`, `blue-*`, etc.) appear anywhere -- all colors use semantic tokens from `theme.css`.
- Tailwind classes are mostly structural.
- Typography follows the documented hierarchy -- no ad hoc font-size or font-weight combos.
- Status indicators use the standard dot pattern and fixed color palette.
- Forms follow the bordered section + field grid pattern from onboarding.
- New patterns are reusable and consistent with the reference implementations.
- **Both light and dark modes render correctly.**
- **Focus states are visible and use the standard ring pattern.**
- **Animations use 200ms duration and standard easing.**
- **Component sizing matches the documented height standards.**

## Decision Rule

When choosing between speed and consistency, choose consistency.

If a UI element looks like a control, status, section, message, or content container that already exists in the reference implementations, reuse the system version instead of designing a new one.
