# FSX Design System

The visual language of the FSX public site and admin dashboard: one action color, neutral text,
cool blue-grays for structure, green/red/yellow for status, Fustat with Inter Tight, pill-shaped
controls, and flat surfaces. **Burple** is the brand color, and the site is data-dense (ratings
tables, stats, records), so spacious marketing-style choices are deliberately left out (see
[Deliberate exclusions](#deliberate-exclusions)).

Tokens live in `packages/ui/src/styles/globals.css`. Shared components live in
`packages/ui/src/components` (shadcn on Base UI) and `apps/web/src/components`.

## Principles

1. **Burple has a job.** Primary burple marks actions and the active state. It is not decoration:
   headings, names, and body text stay neutral, and positive change is green.
2. **Gray carries structure.** Surfaces, tiles, borders, and secondary text use the cool grays.
   Hierarchy comes from surface, spacing, and type weight before color.
3. **Flat before deep.** Separate blocks with a muted surface and spacing, not shadows or borders.
   Borders are for dividers, inputs, and state; shadows only for floating layers.
4. **Soft, consistent shapes.** Controls are pills; containers use the radius scale below, with
   nested corners concentric.
5. **Clear before clever.** Short Portuguese labels on the public site, the benefit or the number
   first, and every interactive element obvious at a glance.

## Color

Every token is defined for light and dark in the same order. Use tokens through Tailwind
(`bg-primary`, `text-title`, …); never raw hex or Tailwind palette colors (`text-emerald-600`) in
components. Decorative gradients (`avatar-gradient.tsx`) are the only exception.

### Palette

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `background` | white | burple-tinted near-black | Page |
| `foreground` | neutral near-black | neutral near-white | Body text, player names |
| `title` | neutral, darkest | neutral, lightest | Headings and section labels (applied to `h1`–`h6` in the base layer) |
| `primary` / `primary-foreground` | burple / white | light burple / dark ink | Main buttons, active tabs, links, level chip, rating line |
| `primary-inverse` / `-foreground` | deep burple / light burple | deep burple / light burple | Hover of primary pills (colors swap) |
| `link` | burple, darker for text | light burple | Inline links |
| `secondary`, `muted` | `#F5F7FA` | burple-gray | Tiles, tracks, secondary buttons, hover rows |
| `muted-foreground` | neutral gray | neutral light gray | Secondary text (also switches to Inter Tight) |
| `accent` / `accent-foreground` | pale gray / `title` | dark gray / `title` | Selected and hovered menu items, soft tags |
| `border`, `input` | `#E2E7F1` | burple-gray | Dividers, input borders |
| `ring`, `selection` | burple | light burple | Focus rings, text selection |
| `success` | green | light green | Gains, won variation, rises, "Ativo", in progress, coming soon, success messages |
| `destructive` | crimson | light crimson | Errors, deletion, losses, drops, inactive |
| `warning` / `warning-foreground` | gold tint / amber | dark gold / bright yellow | Warnings, "this week", neutral emphasis |
| `highlight` | amber | yellow | Title abbreviations and small accents only |
| `chart-1`…`chart-4` | burple, gold, crimson, green | same | Charts: rating line, best result, losses, gains. Add `chart-5`+ for new series. |
| `sidebar-*` | grays + burple | grays + burple | Reserved for a future sidebar |
| `tier-*` / `tier-*-foreground` | bronze, silver, gold, platinum tints | dark tints | `Medal` counts and title emblems only |

### Semantic mapping

| Meaning | Color | Always paired with |
| --- | --- | --- |
| Action, active, selected | `primary` | Shape or position (pill, active tab) |
| Success, positive change (gain, rise, active, upcoming soon) | `success` | `+` sign, ▲, or a label |
| Negative change, error, inactive, past | `destructive` | `−` sign, ▼, or a message |
| Warning, needs attention soon | `warning-foreground` on `warning` | Text label |
| Medal count (`Medal`) | `tier-gold` / `tier-silver` / `tier-bronze` | Icon and label |

Green is only for success and positive change, never for actions or decoration. Never use color as
the only signal; pair it with a sign, arrow, icon, or label.

### Contrast

All text pairs meet WCAG AA (4.5:1) in both themes. `highlight` is 3.7:1 on white: use it only on
bold or large text, never for body copy. When adding a token, check text/background pairs before
using it.

## Typography

| Role | Font | Where |
| --- | --- | --- |
| Main | **Fustat** (`font-sans`) | Everything by default: headings, body, buttons, menus, header, footer, numbers |
| Complementary | **Inter Tight** (`font-complement`) | Secondary text. Any element with `text-muted-foreground` gets it automatically. |
| Mono | **JetBrains Mono** (`font-mono`) | Code and code-like identifiers only. Numbers stay in Fustat. |

- Numbers that change or align in columns use `tabular-nums` (Fustat has equal-width digits).
- Headings: weight 600, `tracking-tight`, `text-balance`. Page titles `text-3xl sm:text-4xl`
  (`PageHeader`); section labels `text-base font-bold` (`Announcement`).
- Body and controls: 16px (`text-base`) for header, footer, nav, and primary buttons; `text-sm`
  in dense content (tables, cards, popovers); `text-xs` for captions and metadata.
- Header and footer text is weight 600.
- Body text uses `text-pretty`; headings use `text-balance` (both set in the base layer).
- To keep gray text in Fustat (for example in the footer), add `font-sans` next to
  `text-muted-foreground`.

## Shape

Base `--radius` is 8px, so the scale lands on 8 / 16 / 24:

| Class | Size | Use |
| --- | --- | --- |
| `rounded-full` | pill | Buttons, tabs and their track, search field, nav triggers, badges, avatars in rows, list highlights |
| `rounded-md` / `rounded-lg` | 6 / 8px | Hover rows, small chips, medal pills, inner rows of a card |
| `rounded-xl` | 12px | Podium medal buttons |
| `rounded-2xl` | 16px | Tiles and cards (`StatTile`, rating and ID boxes, `RecordCard`), large avatars |
| `rounded-4xl` | 24px | Dialogs and highlight blocks |

**Concentric corners:** an outer radius equals the inner radius plus the padding between them
(`RecordCard`: 16px card = 8px row + 8px padding).

## Spacing and layout

- 4px grid with an 8px rhythm: 8, 12, 16, 24, 32, 48.
- Public pages sit in `container max-w-5xl`; profile-like pages (player, season, club) narrow to
  `max-w-[720px]`.
- Side gutters: 12px on phones (`px-3`), 16px from `sm` (`sm:px-4`).
- Section rhythm: `Announcement` header (12px padding), content, then `mt-6` to the next section.
  Home sections use `Section` (`py-10 md:py-12`).
- Grids: one column on phones; 2–3 columns only when the content has room (`sm:grid-cols-2`,
  `lg:grid-cols-3`; stat tiles `grid-cols-2 sm:grid-cols-4`).

## Elevation

Flat by default. Separate blocks with `bg-muted`, not borders or shadows. Shadows are reserved
for floating layers (popovers, dialogs, toasts) and come from the components. Don't add shadows
to tiles or cards.

## Motion

- Hover and state changes: 150–200ms, `ease-out`, transitioning only the properties that change
  (`transition-[color,background-color]`, never `transition-all`).
- Press feedback: `active:scale-[0.96]` on buttons and clickable tiles (built into `Button`).
- No animation on high-frequency interactions (table hover, typing, graph tooltips).
- Popovers and dialogs use the shadcn enter/exit animations; don't add custom ones.

## Components

### Buttons (`Button`, `buttonVariants`)

Every button is a pill. Sizes form one scale:

| Size | Height | Use |
| --- | --- | --- |
| `xs` / `sm` | 24 / 28px | Inline actions in dense tables and admin toolbars |
| `default` | 32px | Default inside content: forms, dialogs, cards |
| `lg` | 36px | Popover CTAs, standalone actions in content |
| `xl` | 40px | Header controls (search), prominent filters |
| `pill` | 48px | Page and section CTAs ("Ver Rating", error pages) |
| `icon`, `icon-sm`, `icon-lg`, `icon-xl` | 32, 28, 36, 40px | Icon-only buttons; match the height of the text buttons beside them |

Variants:

- **`default`**: burple with semibold text; on hover the colors swap to `primary-inverse`. One
  per view for the main action.
- **`outline`** / **`secondary`**: secondary actions (`secondary` sits on gray, `outline` on white).
- **`ghost`**: toolbar and row actions. **`destructive`**: delete and remove.
- **`link`**: inline text actions.

Section CTAs use `SectionButton`: `size="pill"`, `ArrowRight01Icon` at the end, full width on
phones, `sm:w-fit`. For links styled as buttons use
`className={buttonVariants({ size, variant })}` on the `<a>` or `<Link>`.

### Header

All controls are 40px tall: nav triggers (`h-10`, pill hover), search (`size="xl"`), icon buttons
(`size="icon-xl"`, 20px icons). Text is 16px, weight 600.

### Tabs

A `muted` pill track (40px, 4px padding) with pill triggers; the active tab is `primary`. Long tab
lists scroll horizontally (the track centers only when it fits). Don't wrap tabs into a grid.

### Section header (`Announcement`)

Icon, a short vertical separator, then a bold `title` label. Use it to open every section of a
public page. Inside a section, subgroups use `Subheading` (`text-xs` muted label with an optional
count on the right).

### Tiles (`StatTile`)

`bg-muted rounded-2xl`, centered: label (`text-foreground/70`), value (semibold, `tabular-nums`),
optional hint. Signed values color the value (`text-success` gains, `text-destructive` losses).

### Rows

List rows use `m-1` + `rounded-md p-3 hover:bg-muted/50` with a 200ms color transition. Rows that
navigate show `ArrowUpRight01Icon` in muted color, turning `foreground` on hover. When the whole
row is a link, make the row the link so the hit area covers it.

### Cards (`RecordCard`)

`bg-muted rounded-2xl p-2` with a `px-2` title; rows inside are `rounded-lg` links with
`hover:bg-background`. Places 1–3 use `Medal`.

### Badges, medals, achievements

- `Badge` is a pill (`default`, `secondary`, `outline`, `destructive`, `ghost`, `link`).
- `Medal` (gold/silver/bronze tint + icon + optional `×n` count) for podium places.
- `AchievementBadge`: neutral 44px circle (`bg-muted`, icon in `foreground`); locked badges are dashed
  outlines with a lock. Tiers are not colored: `BadgesByTier` groups badges into labeled rows
  (Platina, Ouro, Prata, Bronze, Próximas), and the popover names the tier.
- Podium and current-champion buttons (profile), champion icons (ratings table), and feed icons
  ("Novidades") are neutral too: `bg-muted`, icon in `foreground`, a 1px `border` inset that turns
  `muted-foreground` on hover. The icon carries the meaning (championship icon for a win, medal
  icon for 2nd and 3rd), and the popover or label names it.

### Inputs

Pills inside search-like contexts (command menu, 40px). Form inputs follow the shadcn input with
`border-input`; labels are always visible; errors use `destructive` next to the field.

### Icons

- Hugeicons only (`@hugeicons/core-free-icons`), one library per surface.
- 16px beside text (`size-4`), 20px in 40px+ controls (`size-5`).
- Stroke 1.75–2; icons use `currentColor` and get their state from text color.
- Decorative icons get `aria-hidden`; icon-only buttons get `aria-label`.

## Accessibility checklist

- Hit areas of at least 44×44px on touch and 40px on desktop (extend small targets with padding).
- Visible focus: `focus-visible:outline-2 focus-visible:outline-ring` (or the component's ring).
- Color never the only signal (see Semantic mapping).
- Every `Intl` date format passes an explicit `timeZone` (see AGENTS.md).
- Images get the global 1px outline from the base layer; avatars handle their own.

## Language

Public UI is Portuguese, short and direct ("Ver recordes", "Procurar jogadores…"). The admin
dashboard (`/dashboard`, `/rating-update`) is English.

## Directives at a glance

| Directive | How it is applied |
| --- | --- |
| One action color for CTAs | Burple `primary` for actions; headings and names in neutral `title`/`foreground` |
| Cool blue-gray structure `#F5F7FA` / `#E2E7F1` | `muted`/`secondary` and `border`/`input` |
| Fustat for titles, Inter Tight for supporting text | Fustat for everything, Inter Tight for secondary text |
| Headline weight 600, tight tracking | Headings `font-semibold tracking-tight`, header and footer 600 |
| Pills (999px) for buttons, 16px cards, 24px highlight blocks | `rounded-full` controls, `rounded-2xl` tiles, `rounded-4xl` dialogs |
| Primary button: brand fill, 600 weight, pill, 48px with trailing icon | `Button` `default` + `size="pill"`, `SectionButton` |
| Flat hierarchy, shadow only for floating layers | Muted surfaces, no shadows on tiles or cards |
| 40px desktop / 44px touch targets | Header controls 40px, badges and medal buttons 44px |
| Visible focus outline in the brand color | `ring` is burple |
| Error and alert colors that don't compete with the brand | Crimson `destructive`, gold `warning` |

## Deliberate exclusions

| Not adopted | Why |
| --- | --- |
| Green or teal as brand colors; a second blue accent | Burple is the FSX brand, and one action color keeps actions obvious. Green appears only as the `success` status color. |
| 18px body text, 1.8 line height, +0.9px letter spacing | The site is tables and stats; that sizing makes them sparse and harder to scan. Body stays 14–16px. |
| `#E2E7F1` page background with white bordered cards | FSX uses borderless muted tiles on white; the grays are used inside that structure instead |
| 500ms base transitions, 1800ms reveals | Too slow for tabs, filters, and buttons used repeatedly; FSX uses 150–200ms |
| Brand-tinted card shadows on hover | Surfaces stay flat |
| Custom breakpoint list (390 … 1699px) | Tailwind breakpoints cover the same ranges |
