# Visual Design Alignment Plan

Audit of all pages and components against [visual-design-language.md](visual-design-language.md). Each item lists the file, what's wrong, and what to change.

The central rule: **no Tailwind palette colors anywhere**. Every color must come from shadcn semantic tokens (`primary`, `secondary`, `accent`, `destructive`, `muted`, `foreground`, `background`, `card`, `border`, etc.) defined in `theme.css`. This keeps the theme file in full control and ensures dark mode works automatically.

## Resolved Since Initial Audit

The following work is already complete and should not be tracked as open design debt:

- `app/components/config-editor/ConfigEditorSection.vue` -- the config editor section has already been flattened away from the earlier nested Card pattern, so the old nested-border findings are resolved.
- `app/components/config-editor/ConfigSettingField.vue` -- list, switch, and advanced regions no longer use the old nested bordered containers, and numeric settings now render through `NumberField`.
- Numeric control alignment is complete across the current profile, store, admin, and telemetry form surfaces. `Input type="number"` is no longer the outstanding pattern in these files:
- `app/pages/profiles/new.vue` and `app/pages/profiles/[profileId]/edit.vue`
- `app/components/store/ProductFormVariants.vue` and `app/components/store/ProductFormMerchandising.vue`
- `app/pages/admin/store/bundles/new.vue` and `app/pages/admin/store/bundles/[bundleId].vue`
- `app/pages/admin/store/categories/new.vue` and `app/pages/admin/store/categories/[categoryId].vue`
- `app/components/telemetry-studio/TelemetryAutomationInspector.vue`
- `app/components/telemetry-studio/TelemetryObjectivesEditor.vue`
- `app/components/telemetry-studio/TelemetryActionRulesEditor.vue`
- `app/components/telemetry-studio/TelemetryWorkflowsEditor.vue`

Some of those files still have other open issues below, but numeric input alignment is no longer one of them.

---

## 1. QuickActions.vue

**File:** `app/components/QuickActions.vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 55 | Palette color | `bg-green-600 hover:bg-green-700` (Start button) | Use `variant="default"` (primary) on the Button component |
| 70 | Palette color | `bg-yellow-600 hover:bg-yellow-700` (Restart button) | Use `variant="outline"` on the Button component |

---

## 2. ServerStatusCard.vue

**File:** `app/components/ServerStatusCard.vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 26 | Palette color | `bg-green-500` / `bg-yellow-500` / `bg-slate-400` for status dots | Replace with `bg-primary` / `bg-accent` / `bg-muted-foreground` |
| 49 | Palette color | `bg-green-500` / `bg-yellow-500` for RCON status | Replace with `bg-primary` / `bg-accent` |

---

## 3. AppSidebar.vue

**File:** `app/components/AppSidebar.vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 81 | Palette color | `bg-emerald-500` for running state | Replace with `bg-primary` |
| 82 | Palette color | `bg-red-500` for error state | Replace with `bg-destructive` |
| 83, 85 | Palette color | `bg-yellow-500` for transitioning / exists states | Replace with `bg-accent` |

---

## 4. profiles/[profileId]/players.vue

**File:** `app/pages/profiles/[profileId]/players.vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 71 | Palette color | `bg-green-500` for online player dot | Replace with `bg-primary` |
| 71 | Sizing | `h-2.5 w-2.5` | Replace with `size-2` per documented status dot pattern |

---

## 5. profiles/[profileId]/logs.vue

**File:** `app/pages/profiles/[profileId]/logs.vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 62 | Palette color | `border-blue-600 text-blue-600 hover:bg-blue-600/10` for reverse-order toggle | Use a `Toggle` component or a primary-based active state: `border-primary text-primary hover:bg-primary/10` |

---

## 6. profiles/[profileId]/index.vue

**File:** `app/pages/profiles/[profileId]/index.vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 94 | Palette color | `bg-emerald-600 hover:bg-emerald-700 text-white` (Start button) | Use `variant="default"` (primary) |
| 115 | Palette color | `border-yellow-600 text-yellow-600 hover:bg-yellow-600/10` (Restart button) | Use `variant="outline"` |

---

## 7. profiles/[profileId]/telemetry.vue

**File:** `app/pages/profiles/[profileId]/telemetry.vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 52 | Typography | `tracking-[0.28em]` | Change to `tracking-[0.35em]` per kicker pattern |
| 56 | Typography | `text-3xl font-semibold tracking-tight` | Change to `text-2xl font-bold` per page title tier |

---

## 8. ConfigEditorSection.vue

**File:** `app/components/config-editor/ConfigEditorSection.vue`

Status: resolved.

The old nested border findings for this file are already addressed in the current implementation. Leave it off the open issues list unless a new nesting regression is introduced.

---

## 9. ConfigSettingField.vue

**File:** `app/components/config-editor/ConfigSettingField.vue`

Status: resolved.

The earlier nested-border issues are already fixed, and the numeric control path is now aligned with `NumberField`. This file should now be treated as compliant.

---

## 10. ProductFormOptions.vue

**File:** `app/components/store/ProductFormOptions.vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 61+ | Two-border rule | `Card` components inside a bordered section | Replace inner Cards with `rounded-lg bg-muted/10 p-4` containers |
| 89-100 | Component hierarchy | Native `<select>` with `<option>` elements | Replace with shadcn `Select` / `SelectTrigger` / `SelectContent` / `SelectItem` |

---

## 11. ProductFormVariants.vue

**File:** `app/components/store/ProductFormVariants.vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 125+ | Two-border rule | `Card` components inside a bordered section | Replace inner Cards with `rounded-lg bg-muted/10 p-4` containers |
| 265-276 | Component hierarchy | Native `<select>` with `<option>` elements | Replace with shadcn `Select` components |

---

## 12. admin/store/bundles/new.vue

**File:** `app/pages/admin/store/bundles/new.vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 363-378 | Component hierarchy | Native `<select>` with `<option>` elements | Replace with shadcn `Select` components |

---

## 13. admin/store/bundles/[bundleId].vue

**File:** `app/pages/admin/store/bundles/[bundleId].vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 395-410 | Component hierarchy | Native `<select>` with `<option>` elements | Replace with shadcn `Select` components |

---

## 14. StoreAdminCatalogImport.vue

**File:** `app/components/store/StoreAdminCatalogImport.vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 4 | Layer boundary | Direct `import { CheckboxIndicator, CheckboxRoot } from 'reka-ui'` in feature component | Replace with shadcn `Checkbox` from `app/components/ui` |
| 365-378, 424-434 | Layer boundary | Direct use of `CheckboxRoot` / `CheckboxIndicator` primitives | Rewrite to use the shadcn `Checkbox` wrapper |
| 375-376 | Icon sizing | `h-4 w-4` instead of `size-4` | Use `size-4` (resolved when switching to shadcn Checkbox) |

---

## 15. store/cart.vue

**File:** `app/pages/store/cart.vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 34-74 | Two-border rule | Card components for each cart item nested inside a parent Card | Replace inner item Cards with `divide-y divide-border` rows or background-tinted containers |

---

## 16. store/product/[slug].vue

**File:** `app/pages/store/product/[slug].vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 214-227 | Two-border rule | "Selected variant" Card nested inside parent Card | Replace with `rounded-lg bg-muted/10 p-4` |
| 261-269 | Two-border rule | Feature bullet Cards nested inside parent Card | Replace with `divide-y divide-border` list or `space-y-2` with background tints |

---

## 17. store/bundle/[slug].vue

**File:** `app/pages/store/bundle/[slug].vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 141-165 | Two-border rule | Bundle item Cards nested inside parent Card | Replace with `divide-y divide-border` rows |

---

## 18. profiles/new.vue

**File:** `app/pages/profiles/new.vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 116-129 | Form pattern | Ad hoc `<div class="...rounded-md border p-4">` wrapper for Switch | Use `FieldSet` / `FieldLabel` / `Field` system components |

---

## 19. profiles/[profileId]/edit.vue

**File:** `app/pages/profiles/[profileId]/edit.vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 134-147 | Form pattern | Ad hoc bordered div wrapper for Switch | Use `FieldSet` / `FieldLabel` / `Field` system components |

---

## 20. ModStatusBadge.vue

**File:** `app/components/mods/ModStatusBadge.vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 44-52 | Palette color | Hand-built badge colors: `border-emerald-200 bg-emerald-50 text-emerald-700`, `border-red-200 bg-red-50 text-red-700`, `border-slate-200 bg-slate-50 text-slate-700` | Replace with shadcn `Badge` variants: installed -> `default`, error -> `destructive`, unknown -> `secondary` |

---

## 21. ProfileModsManager.vue

**File:** `app/components/mods/ProfileModsManager.vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 95-106 | Palette color | Same hand-built badge color combos as ModStatusBadge | Align with ModStatusBadge fix -- use shadcn `Badge` variants |

---

## 22. WorkshopThumbnail.vue

**File:** `app/components/mods/WorkshopThumbnail.vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 33 | Typography | `text-[10px] font-medium uppercase tracking-[0.18em]` | Use `text-xs`. Standardize tracking to `tracking-[0.35em]` if kicker, or drop uppercase + tracking if just a label |

---

## 23. Telemetry Studio (all components)

The telemetry studio is the largest area of non-compliance. It was built with a bespoke visual language (hard-coded slate/white palette, custom radii, custom shadows, light-mode-only gradients). It needs a comprehensive pass.

### TelemetryAutomationNode.vue

**File:** `app/components/telemetry-studio/TelemetryAutomationNode.vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 99 | Radius | `rounded-[22px]` | Use `rounded-xl` |
| 99 | Sizing | `min-w-[240px]` | Use `min-w-60` |
| 99 | Animation | `duration-150` | Use `duration-200` |
| 110, 146, 153, 164 | Palette color | `!bg-white` on handles | Use `!bg-background` |
| 110, 164 | Palette color | `!border-slate-950/20` | Use `!border-border` |
| 146 | Palette color | `!border-emerald-500` | Use `!border-primary` |
| 153 | Palette color | `!border-rose-500` | Use `!border-destructive` |
| 115, 133 | Palette color | `bg-white/80`, `bg-white/60`, `text-slate-700` | Use `bg-card/80`, `bg-card/60`, `text-foreground` |
| 118 | Palette color | `text-slate-500` | Use `text-muted-foreground` |
| 124 | Palette color | `text-slate-950` | Use `text-foreground` |
| 125 | Palette color | `text-slate-600` | Use `text-muted-foreground` |
| 115 | Palette color | `border-white/70` | Use `border-card/70` |
| 133 | Palette color | `border-slate-950/10` | Use `border-border` |
| 155 | Palette color | `text-emerald-700` (True label) | Use `text-primary` |
| 156 | Palette color | `text-rose-700` (False label) | Use `text-destructive` |
| 115, 118, 133 | Typography | `text-[11px]` | Use `text-xs` |
| 155-156 | Typography | `text-[10px]` | Use `text-xs` |
| 155-156 | Typography | `tracking-[0.24em]` | Use `tracking-[0.35em]` |

### TelemetryAutomationCanvas.vue

**File:** `app/components/telemetry-studio/TelemetryAutomationCanvas.vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 178 | Radius | `rounded-[22px]` | Use `rounded-xl` |
| 178 | Palette color | `border-slate-300/80 bg-white/90` | Use `border-border/70 bg-card/90` |
| 181 | Typography | `tracking-[0.24em]` | Use `tracking-[0.35em]` |
| 142 | Sizing | `h-[720px]` | Acceptable for canvas viewport; add comment |
| 213-246 | Custom CSS | Entire `<style>` block with hard-coded rgba colors, custom shadows, hard-coded font-size, light-only backgrounds | Rewrite using CSS vars that reference semantic tokens. Replace rgba with oklch tokens, replace custom shadows with theme shadow tokens, replace `bg-white` references with `var(--card)` or `var(--background)` |

### TelemetryAutomationStudio.vue

**File:** `app/components/telemetry-studio/TelemetryAutomationStudio.vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 233 | Palette color | `bg-slate-50` for selected state | Use `bg-muted` or `bg-accent` |
| 233 | Palette color | `border-slate-900/20` | Use `border-border` |
| 243 | Typography | `text-[11px]` | Use `text-xs` |
| 243, 270, 286 | Typography | `tracking-[0.2em]`, `tracking-[0.24em]` | Use `tracking-[0.35em]` |
| 316 | Sizing | `min-h-[720px]` | Acceptable for canvas; add comment |

### TelemetryStudioOverview.vue

**File:** `app/components/telemetry-studio/TelemetryStudioOverview.vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 48 | Palette color | `border-slate-300/70 bg-gradient-to-br from-slate-50 via-white to-amber-50/50` | Use `border-border/70 bg-gradient-to-t from-primary/5 to-card` (sanctioned gradient) or flat `bg-card` |
| 70, 76, 82, 88 | Typography | `tracking-[0.24em]` | Use `tracking-[0.35em]` |

### TelemetryObjectivesEditor.vue

**File:** `app/components/telemetry-studio/TelemetryObjectivesEditor.vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 77 | Palette color | `border-slate-300/70 bg-gradient-to-br from-white via-slate-50 to-amber-50/70` | Use `border-border/70` and sanctioned gradient or flat `bg-card` |
| 99, 105, 111 | Typography | `tracking-[0.24em]` | Use `tracking-[0.35em]` |
| 126 | Palette color | `bg-slate-50/70` | Use `bg-muted` |
| 350 | Palette color | `bg-slate-50/60` | Use `bg-muted` |

### TelemetryAutomationInspector.vue

**File:** `app/components/telemetry-studio/TelemetryAutomationInspector.vue`

| Line(s) | Rule | Issue | Fix |
| --- | --- | --- | --- |
| 200 | Typography | `tracking-[0.2em]` | Use `tracking-[0.35em]` |

---

## Summary

### By priority

**P0 -- Architectural violations (fix first):**

1. **StoreAdminCatalogImport.vue** -- reka-ui import in feature code
2. **Native `<select>` elements** -- 4 files (ProductFormOptions, ProductFormVariants, bundles/new, bundles/[bundleId])

**P1 -- Palette color violations (every file that uses Tailwind colors directly):**

1. **QuickActions.vue** -- `green-*`, `yellow-*` -> button variants
2. **ServerStatusCard.vue** -- `green-*`, `yellow-*`, `slate-*` -> semantic tokens
3. **AppSidebar.vue** -- `emerald-*`, `red-*`, `yellow-*` -> semantic tokens
4. **profiles/[profileId]/index.vue** -- `emerald-*`, `yellow-*` -> button variants
5. **players.vue** -- `green-*` -> `primary`
6. **logs.vue** -- `blue-*` -> `primary` or Toggle component
7. **ModStatusBadge.vue** -- `emerald-*`, `red-*`, `slate-*` -> Badge variants
8. **ProfileModsManager.vue** -- same as ModStatusBadge

**P2 -- Two-border rule violations:**

1. **ProductFormOptions.vue** -- Cards inside bordered section
2. **ProductFormVariants.vue** -- Cards inside bordered section
3. **store/cart.vue** -- Cards inside Card
4. **store/product/[slug].vue** -- Cards inside Card (2 spots)
5. **store/bundle/[slug].vue** -- Cards inside Card

**P3 -- Telemetry studio overhaul (largest effort, self-contained):**

1. **TelemetryAutomationNode.vue** -- slate/white palette, custom radii, custom font sizes
2. **TelemetryAutomationCanvas.vue** -- slate/white palette, custom radius, custom `<style>` block
3. **TelemetryAutomationStudio.vue** -- slate palette, custom font sizes
4. **TelemetryStudioOverview.vue** -- slate palette, non-sanctioned gradient
5. **TelemetryObjectivesEditor.vue** -- slate palette, non-sanctioned gradient
6. **TelemetryAutomationInspector.vue** -- tracking value

**P4 -- Typography and form pattern fixes:**

1. **telemetry.vue** -- wrong tracking value, wrong page title tier
2. **profiles/new.vue** -- ad hoc Switch wrapper instead of Field system
3. **profiles/[profileId]/edit.vue** -- ad hoc Switch wrapper instead of Field system
4. **WorkshopThumbnail.vue** -- ad hoc font size and tracking

### By count

| Violation category | Files | Instances |
| --- | --- | --- |
| Tailwind palette colors used directly | 16 | 40+ |
| Two-border rule | 5 | 6 open instances |
| Native `<select>` instead of shadcn Select | 4 | 4 |
| Typography (ad hoc sizes, weights, tracking) | 8 | 20+ |
| Custom CSS `<style>` block | 1 | 1 |
| reka-ui import in feature code | 1 | 1 |
| Form pattern (ad hoc control wrappers) | 2 | 2 |
| Custom border radius | 2 | 2 |

### Compliant files (no changes needed)

- `app/pages/onboarding.vue` + `OnboardingSetupPanel.vue` -- reference implementation
- `app/components/store/ProductFormDetails.vue`
- `app/components/store/ProductFormMerchandising.vue`
- `app/components/store/StoreAdminStatCards.vue`
- `app/components/store/StoreBundleCard.vue`
- `app/components/store/StoreProductCard.vue`
- `app/components/store/StoreAdminSectionTabs.vue`
- `app/components/config-editor/ProfileConfigEditor.vue` (fixed: page heading out of card, native TabsList, no bordered section wrapper)
- `app/components/config-editor/ConfigEditorSection.vue` (fixed: removed outer bordered section, collapsible groups use background tint instead of border, uses Separator instead of border-t)
- `app/components/config-editor/ConfigSettingField.vue` (fixed: removed nested bordered containers and uses `NumberField` for numeric settings)
- `app/components/NumericInput.vue` (shared app-level numeric wrapper built on `NumberField`; keeps feature code off `Input type="number"` without modifying shadcn primitives)
- All `app/components/ui/` base components (reka-ui usage is correct here)
- All layout files
