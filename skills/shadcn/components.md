# Components

> Component inventory for the shadcn-vue skill. Align these guides with the `reka-ui` skill when a component is a styled wrapper over the same primitive.

## Form Controls

| Component | Kind | Description | File |
| --------- | ---- | ----------- | ---- |
| **button** | custom/native wrapper | Standard action button with variants, sizes, and `as-child` support | `components/button.md` |
| **button-group** | composed | Grouping pattern for adjacent button actions | `components/button-group.md` |
| **checkbox** | wraps `reka-ui` | Styled binary or indeterminate selection control | `components/checkbox.md` |
| **combobox** | composed | Searchable picker composed from popover and command patterns | `components/combobox.md` |
| **editable** | wraps `reka-ui` | Inline edit surface with preview and edit states | `components/editable.md` |
| **field** | custom/composed | Field wrapper for labels, help text, and grouped controls | `components/field.md` |
| **file-trigger** | custom | Trigger wrapper for file input interactions | `components/file-trigger.md` |
| **form** | composed | Validation-aware form composition and field wiring | `components/form.md` |
| **input** | custom/native wrapper | Styled text input wrapper around the native input element | `components/input.md` |
| **input-group** | composed | Input plus leading/trailing controls or addons | `components/input-group.md` |
| **label** | wraps `reka-ui` | Accessible label primitive with shadcn defaults | `components/label.md` |
| **listbox** | wraps `reka-ui` | List-based option picker with keyboard navigation | `components/listbox.md` |
| **number-field** | wraps `reka-ui` | Numeric input with increment and decrement affordances | `components/number-field.md` |
| **pin-input** | wraps `reka-ui` | Multi-slot code or OTP entry control | `components/pin-input.md` |
| **radio-group** | wraps `reka-ui` | Single-choice grouped selection control | `components/radio-group.md` |
| **select** | wraps `reka-ui` | Styled trigger-driven option list | `components/select.md` |
| **slider** | wraps `reka-ui` | Range selection control with draggable thumb | `components/slider.md` |
| **switch** | wraps `reka-ui` | Two-state toggle control | `components/switch.md` |
| **tags-input** | wraps `reka-ui` | Tokenized multi-value text entry | `components/tags-input.md` |
| **textarea** | custom/native wrapper | Styled multi-line text input | `components/textarea.md` |
| **toggle** | wraps `reka-ui` | Pressed-state toggle button | `components/toggle.md` |
| **toggle-group** | wraps `reka-ui` | Coordinated set of toggle buttons | `components/toggle-group.md` |

## Date and Time

| Component | Kind | Description | File |
| --------- | ---- | ----------- | ---- |
| **calendar** | wraps `reka-ui` | Calendar grid for date selection | `components/calendar.md` |
| **date-field** | wraps `reka-ui` | Structured date input field | `components/date-field.md` |
| **date-picker** | composed | Date picker built from popover and calendar patterns | `components/date-picker.md` |
| **date-range-picker** | composed | Range picker built around range calendar behavior | `components/date-range-picker.md` |
| **range-calendar** | wraps `reka-ui` | Calendar specialized for selecting ranges | `components/range-calendar.md` |
| **time-field** | wraps `reka-ui` | Structured time input field | `components/time-field.md` |

## Disclosure and Navigation

| Component | Kind | Description | File |
| --------- | ---- | ----------- | ---- |
| **accordion** | wraps `reka-ui` | Styled grouped disclosure sections with animation and trigger affordances | `components/accordion.md` |
| **breadcrumb** | composed | Hierarchical path navigation with optional menus and truncation | `components/breadcrumb.md` |
| **collapsible** | wraps `reka-ui` | Single collapsible region | `components/collapsible.md` |
| **pagination** | wraps/composed | Page navigation controls and layout helpers | `components/pagination.md` |
| **sidebar** | composed | Application sidebar system with mobile and collapsible behavior | `components/sidebar.md` |
| **stepper** | wraps/composed | Multi-step progress and action flow | `components/stepper.md` |
| **tabs** | wraps `reka-ui` | Layered tabbed content sections | `components/tabs.md` |

## Overlay and Menu

| Component | Kind | Description | File |
| --------- | ---- | ----------- | ---- |
| **alert-dialog** | wraps `reka-ui` | Confirmation modal for destructive or blocking actions | `components/alert-dialog.md` |
| **context-menu** | wraps `reka-ui` | Right-click or alternate action menu | `components/context-menu.md` |
| **dialog** | wraps `reka-ui` | Modal dialog surface | `components/dialog.md` |
| **drawer** | composed | Slide-in panel optimized for constrained layouts | `components/drawer.md` |
| **dropdown-menu** | wraps `reka-ui` | Triggered action menu | `components/dropdown-menu.md` |
| **hover-card** | wraps `reka-ui` | Hover or focus preview card | `components/hover-card.md` |
| **menubar** | wraps `reka-ui` | Desktop-style persistent command menu | `components/menubar.md` |
| **navigation-menu** | wraps `reka-ui` | Site or section navigation menu | `components/navigation-menu.md` |
| **popover** | wraps `reka-ui` | Anchored floating content surface | `components/popover.md` |
| **sheet** | composed | Dialog-based side sheet | `components/sheet.md` |
| **tooltip** | wraps `reka-ui` | Small informational hover/focus tooltip | `components/tooltip.md` |

## Data and Display

| Component | Kind | Description | File |
| --------- | ---- | ----------- | ---- |
| **alert** | custom | Inline status or contextual message surface | `components/alert.md` |
| **aspect-ratio** | wraps `reka-ui` | Size wrapper that preserves aspect ratio | `components/aspect-ratio.md` |
| **avatar** | wraps `reka-ui` | User image with fallback behavior | `components/avatar.md` |
| **badge** | custom | Compact label for status, type, or count | `components/badge.md` |
| **card** | custom | Structured container with header, content, and footer slots | `components/card.md` |
| **carousel** | custom/composed | Horizontal content carousel pattern | `components/carousel.md` |
| **chart** | third-party/composed | Data visualization wrapper built on Unovis | `components/chart.md` |
| **empty** | custom | Empty-state presentation primitives | `components/empty.md` |
| **heading** | custom | Heading wrapper with design-system semantics | `components/heading.md` |
| **item** | custom | Reusable item row and grouped content primitive | `components/item.md` |
| **kbd** | custom | Keyboard shortcut token | `components/kbd.md` |
| **progress** | wraps `reka-ui` | Progress indicator bar | `components/progress.md` |
| **scroll-area** | wraps `reka-ui` | Scroll container with styled scrollbar affordances | `components/scroll-area.md` |
| **separator** | wraps `reka-ui` | Visual or semantic divider | `components/separator.md` |
| **skeleton** | custom | Loading placeholder surface | `components/skeleton.md` |
| **table** | custom/composed | Tabular data presentation primitives | `components/table.md` |
| **tree** | wraps `reka-ui` | Hierarchical expandable tree view | `components/tree.md` |
| **typography** | custom | Documentation and content typography patterns | `components/typography.md` |

## Utility and Advanced

| Component | Kind | Description | File |
| --------- | ---- | ----------- | ---- |
| **command** | composed | Fast command palette and searchable action list | `components/command.md` |
| **config-provider** | wraps `reka-ui` | Global direction, locale, and behavior provider | `components/config-provider.md` |
| **focus-scope** | wraps `reka-ui` | Focus containment utility | `components/focus-scope.md` |
| **icon-placeholder** | custom | Internal icon fallback and docs placeholder helper | `components/icon-placeholder.md` |
| **presence** | wraps `reka-ui` | Presence and mount-state animation helper | `components/presence.md` |
| **primitive** | wraps `reka-ui` | Base element wrapper for advanced composition | `components/primitive.md` |
| **sonner** | third-party | Opinionated toast system replacing the deprecated toast component | `components/sonner.md` |
| **splitter** | wraps `reka-ui` | Resizable split-panel layout | `components/splitter.md` |
| **toolbar** | wraps `reka-ui` | Toolbar layout for grouped controls | `components/toolbar.md` |
| **visually-hidden** | wraps `reka-ui` | Screen-reader-only content helper | `components/visually-hidden.md` |

## Deprecated

| Component | Kind | Description | File |
| --------- | ---- | ----------- | ---- |
| **toast** | deprecated | Legacy toast component kept only for migration guidance; prefer `sonner` | `components/toast.md` |

## Notes

- Each component guide should document whether the component wraps a Reka primitive, composes multiple primitives, or is custom to shadcn-vue.
- Prefer aligning component terminology and file naming with `reka-ui/components/*.md` whenever the component maps to the same underlying primitive.
- For most components, include both a minimal usage pattern and at least one contextual usage pattern.
