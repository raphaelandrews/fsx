# FSX Design System

The visual language of the FSX public site and admin dashboard: one action color, neutral text,
cool blue-grays for structure, green/red/yellow for status, Fustat throughout, pill-shaped
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
| `reading` | cool gray (near `#4C5267`) | light gray | Long-form text: blog posts (prose body) and announcements. Not for tables or labels. |
| `primary` / `primary-foreground` | burple / white | light burple / dark ink | Main buttons, active tabs, links, level chip, rating line |
| `primary-inverse` / `-foreground` | deep burple / light burple | deep burple / light burple | Hover of primary pills (colors swap) |
| `link` / `link-hover` | burple / azure | light burple / light azure | Inline links (`link-inline`): burple at rest, azure on hover |
| `secondary`, `muted` | `#F5F7FA` | burple-gray | Tiles, tracks, secondary buttons, hover rows |
| `muted-foreground` | neutral gray | neutral light gray | Secondary text |
| `accent` / `accent-foreground` | pale gray / `title` | dark gray / `title` | Selected and hovered menu items, soft tags |
| `border`, `input` | `#E4E9F1` | burple-gray | Dividers, table frames and rows, input borders |
| `ring`, `selection` | burple | light burple | Focus rings, text selection |
| `success` | green | light green | Gains, won variation, rises, "Ativo", in progress, coming soon, success messages |
| `destructive` | crimson | light crimson | Red text and icons: errors, deletion, losses, drops |
| `destructive-fill` | candy red | candy red | Red fills next to a label (status dots, chart losses); 3:1, not for text |
| `warning` / `warning-foreground` | gold tint / amber | dark gold / bright yellow | Warnings, "this week", neutral emphasis |
| `highlight` | amber | yellow | Title abbreviations and small accents only |
| `chart-1`…`chart-3` | burple, deep burple, candy red | burple, light burple, candy red | Charts: gains and the rating line, best result, losses. Fills keep ≥3:1 against the background. Add `chart-4`+ for new series. |
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

Green is only for success and positive change, never for actions or decoration. Charts are the
exception: they stay in the brand palette (burple gains, candy-red losses) so data reads as one
family.

**Candy vs. text colors.** Graphics (chart bars, dots) need 3:1 against their background, text
needs 4.5:1. Candy red (`chart-3`) passes 3:1 but not 4.5:1, so it is for fills only; red text uses
`destructive`. A light, candy yellow can't reach 3:1 on white at all, so yellow is used as a tint
behind dark text (`warning` / `warning-foreground`), never as a fill on white. Never use color as
the only signal; pair it with a sign, arrow, icon, or label.

### Contrast

All text pairs meet WCAG AA (4.5:1) in both themes. `highlight` is 3.7:1 on white: use it only on
bold or large text, never for body copy. When adding a token, check text/background pairs before
using it.

## Typography

| Role | Font | Where |
| --- | --- | --- |
| Main | **Fustat** (`font-sans`) | All text: headings, body, secondary text, buttons, menus, header, footer, numbers |
| Mono | **JetBrains Mono** (`font-mono`) | Code and code-like identifiers only. Numbers stay in Fustat. |

| Class | Size | Use |
| --- | --- | --- |
| `text-base` | 16px | Body, list rows, card titles, buttons, inputs, menus, popovers, tabs |
| `text-sm` | 14px | Tables (cells and headers), secondary text: excerpts, hints, dates, subheadings, tile labels, small selects, form hints and errors, pagination labels |
| `text-xs` | 12px | Micro labels only: badge chips, title emblems, medal counts, keyboard hints, graph axes, avatar initials |

- Fustat is declared in `globals.css` (not through the Fontsource import) with
  `ascent-override: 106%` / `descent-override: 36%`. Its native metrics put capitals and digits
  ~1px above center in pills, tabs, and badges; the overrides balance the space above capitals and
  below the baseline. Keep them if the font files or weights change.
- **Base weight is 500 (medium)**, set on `body`. Fustat at 400 reads too light at text sizes;
  use `font-semibold` (600) for emphasis and headings, and avoid `font-normal` for body copy.
- **Long-form text** (blog posts via `Markdown`, announcement detail): `text-reading`, 16px on
  phones and 18px from `sm` (`sm:prose-lg` for posts), `leading-relaxed`. Keep this for reading
  surfaces only; tables, rows, and UI text stay at their regular size and `foreground` color.
- Numbers that change or align in columns use `tabular-nums` (Fustat has equal-width digits).
- Headings: weight 600, `tracking-tight`, `text-balance`. Page titles `text-3xl sm:text-4xl`
  (`PageHeader`), home section titles `text-2xl sm:text-3xl`, section labels `text-base font-bold`
  (`Announcement`).
- Header and footer text is 16px, weight 600.
- Body text uses `text-pretty`; headings use `text-balance` (both set in the base layer).

## Shape

Base `--radius` is 8px, so the scale lands on 8 / 16 / 24:

| Class | Size | Use |
| --- | --- | --- |
| `rounded-full` | pill | Buttons, tabs and their track, search field, nav triggers, badges, icon circles, list highlights |
| `rounded-avatar` | 31.25% of the side | Player and member photos (`Avatar` default): 10px at 32px, 14px at 44px, 20px at 64px, 30px at 96px. Rounded, never a full circle. |
| `rounded-md` / `rounded-lg` | 6 / 8px | Hover rows, small chips, medal pills, inner rows of a card |
| `rounded-xl` | 12px | Podium medal buttons |
| `rounded-2xl` | 16px | Tiles, cards, and table frames (`StatTile`, rating and ID boxes, `RecordCard`, `Table`), large avatars |
| `rounded-4xl` | 24px | Dialogs and highlight blocks |

**Concentric corners:** an outer radius equals the inner radius plus the padding between them
(`RecordCard`: 16px card = 8px row + 8px padding).

## Spacing and layout

- 4px grid with an 8px rhythm: 8, 12, 16, 24, 32, 48.
- Public pages sit in `container max-w-5xl`; profile-like pages (player, season, club) narrow to
  `max-w-[720px]`.
- Side gutters: 12px on phones (`px-3`), 16px from `sm` (`sm:px-4`).
- Section rhythm: on detail pages, `Announcement` label (12px padding), content, then `mt-6` to
  the next section; on the home page, the centered section header (see Components).
- Space above the footer comes from `<main>` (`pb-16`), never from page wrappers; the last home
  section drops its own bottom padding (`last:pb-0`). Article pages pad only the top.
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
- Entrances, once and only on infrequent moments (utilities in `globals.css`, CSS only):
  - `animate-rise`: page titles on load (`PageHeader`: icon, title, description at 0 / 60 /
    120ms via `--rise-delay`), 500ms, 12px rise.
  - `reveal-on-scroll`: home sections fade up as they enter the viewport (scroll-driven
    animation; browsers without support just show them).
  - `animate-fill-x`: progress bars fill on load (the profile level bar).
- Tabs slide a single `primary` pill between options (Base UI `Tabs.Indicator`, 200ms). Before
  hydration the active tab paints its own pill, so the server render never shows an empty tab.
- `prefers-reduced-motion: reduce` disables all of the above (a global rule in the base layer,
  and `reveal-on-scroll` only runs under `no-preference`).
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

- The current page is marked through `aria-current="page"` (set by TanStack `Link`) in the primary
  color: top-level links become `bg-primary` pills with `text-primary-foreground` (also on focus,
  so the menu's `focus:bg-muted` can't override it); dropdown items and drawer sub-links get a
  `bg-primary/10` tint with icon and label in `text-primary` (no white icon to flash while the
  route changes); the drawer's full-width top-level links turn `text-primary`. Pass
  `activeOptions={{ exact: true }}` for `/` so Home isn't active everywhere.
- Becoming the current page switches colors instantly (`aria-[current=page]:transition-none`);
  animating it shows a burple background with dark text for a moment while the route loads.
- Dropdown items hover to `accent` (neutral), never to burple.
- The mobile drawer's open and close buttons are both `outline` pills at `icon-xl`. Links that
  open in a new tab show `ArrowUpRight01Icon`; Instagram and e-mail are `secondary` `icon-xl`
  buttons at the bottom of the drawer, like the footer, not page links.
- Dropdown items change only their background on hover; the icon and label keep their colors
  (recoloring them made the icon flash ahead of the background).

### Footer

No divider above it; spacing separates it from the page. Centered stack: logo, flag, social buttons
(`secondary`, `icon-xl`, 20px icons), nav links (16px, `text-muted-foreground`,
`hover:text-foreground`), and credits. The credit links have no underline: "Raphael" is `text-primary` and "Source code"
is `text-foreground`, both turning `link-hover` on hover, at the line's own weight (600).

### Page header (`PageHeader`)

Every page title is centered: an `icon` in a 44px `bg-muted` circle, the `h1`
(`text-3xl sm:text-4xl`, semibold, `tracking-tight`), and an optional muted description. Use the
route's icon from the nav menu (`header-navigation-data.tsx`) so the page and its menu item match.

### Inline links (`link-inline`)

For links inside running text only: FAQ answers, blog posts (`.prose a`), announcement text,
footer credits, feed metadata. Burple, semibold, with a 1px underline in the same color offset
3px; on hover the color turns azure (`link-hover`). Navigation, buttons, tabs, row links, and
table links keep their own styles; don't apply `link-inline` to them.

### Accordion

Items are separated by a line between them only; no border above the first or below the last. The question is
`font-semibold text-foreground`; the answer is `text-reading leading-relaxed`, so the two never
look alike. The chevron sits in a 32px `bg-muted` circle, darkens on hover, and rotates when open.
No underline on hover. Used for the FAQ and the Normas Técnicas titulations (abbreviation plus a
muted one-line description in the trigger).

### Section header (home)

Home sections (`components/home/section.tsx`) open with a centered header: the icon in a 44px
`bg-muted` circle, then an `h2` at `text-2xl sm:text-3xl`, semibold, `tracking-tight`, 32px above
the content. Pair it with a centered `SectionButton` at the end of the section.

### Tables (`Table`)

Every table sits in a bordered frame and reads as one surface:

- Frame: `rounded-2xl border bg-background`, scrolling horizontally inside the frame on small
  screens.
- Header row: `bg-muted/70` (neutral gray), labels `text-foreground font-semibold`, 44px tall.
  Sortable headers are buttons; they set `font-semibold text-foreground text-sm` so they match
  plain headers.
- Position column (`#`): 48px wide, header and numbers centered, numbers `text-muted-foreground`
  (gray on the cell content, never on the header).
- Rows: separated by a 1px `border` line, no zebra stripes; `hover:bg-muted/40`; the last row has
  no line.
- Text: 14px (`text-sm`) in cells and header labels, set on the table.
- Cells: `px-4 py-3`, numbers `tabular-nums`, numeric columns centered or right-aligned
  consistently within a table.
- These styles live in `packages/ui/src/components/table.tsx`; don't re-add borders, stripes, or
  header colors in individual tables.

### Tabs

A `muted` pill track (40px, 4px padding) with pill triggers; the active tab is `primary`. Long tab
lists scroll horizontally (the track centers only when it fits). Don't wrap tabs into a grid.

### Section label (`Announcement`)

Icon, a short vertical separator, then a bold `title` label. Use it to open the sections of
detail pages (profile, season, club, records); the home page uses the centered section header. Inside a section, subgroups use `Subheading` (`text-sm` muted label with an
optional count on the right).

### Home: Novidades and Comunicados

Each section has one job, so nothing appears twice:

- **Novidades** (`records.recent`) is about players: achievements, titles, and announcements that
  aren't about a title. A title award absorbs its announcement (same player, recorded within 30
  days, `pairTitleNotices`): one item, "X recebeu o título Y", with a "Ver comunicado" link.
- **Comunicados** is the official record. On the home page it skips announcements already shown
  in Novidades; `/comunicados` lists everything.

### Events (home)

`bg-muted rounded-2xl p-4` tiles in a 1/2/3-column grid. Title `font-semibold`, date with
`Calendar01Icon` in muted `text-sm`, and a countdown pill computed on the server (São Paulo date):
"Hoje", "Amanhã", "Em N dias", with `bg-warning` within a week and a neutral pill up to 14 days.
Links are `lg` pills (the form is `default`, others `outline`), each with `ArrowUpRight01Icon` and
"(abre em nova aba)" for screen readers. A link without a URL is a dashed, non-interactive pill
("Regulamento · em breve"), never a disabled button.

### Records (`/recordes`)

Jump links under the page title (`secondary` `lg` pills) to each group; groups use
`scroll-mt-24`. Each `RecordCard` shows the top 5 and a "Ver top 10" toggle (`aria-expanded`).

### Player profile

Order: header (photo, name, level, title emblems) → **Ratings** → Conquistas → Informações →
Estatísticas → Circuitos → Comunicados → IDs → Performance → Histórico de torneios. Ratings come
first because they're what most visitors look for.

- Rating and ID boxes are `StatTile`s: label, the rating at `text-xl sm:text-2xl`, and rank,
  movement, and peak as the hint. ID tiles that link out show `ArrowUpRight01Icon` and hover to
  `bg-accent`.
- Informações is a `dl` of static rows (label `text-sm` muted, value `text-base` medium), with no
  hover state, since the rows aren't interactive. Status is a static dot (`bg-success` /
  `bg-destructive`) plus the word; no pulsing animation.
- Performance switches format with pill `Tabs` (not a select); chart titles use `Subheading`, and
  empty charts show a `bg-muted rounded-2xl` message.

### Tiles (`StatTile`)

`bg-muted rounded-2xl`, centered: label (`text-foreground/70`), value (semibold, `tabular-nums`),
optional hint. Signed values color the value (`text-success` gains, `text-destructive` losses).

### Rows

List rows use `m-1` + `rounded-md p-3 hover:bg-muted/50` with a 200ms color transition. A row that
represents an item (announcement, feed entry) leads with its icon in a 32px `bg-muted` circle, then
a semibold `text-base` title and a `text-sm` muted excerpt (`line-clamp-2`).

- Rows that open a page on this site end with `ArrowRight01Icon` (muted, turning `foreground` and
  nudging 2px right on hover). `ArrowUpRight01Icon` is reserved for links that leave the site
  (CBX, FIDE, social).
- Make the whole row the link so the hit area covers it, and link to a real page rather than a
  modal, so the content is shareable and works with the back button.
- Rows that aren't interactive (members, info rows, rules) get no hover state.
- Announcements use the shared `AnnouncementRow` (home, `/comunicados`, profile).

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

### Pagination (`Pagination`, `DataTablePagination`)

Both build their page list with `buildPageItems` (`components/data-table/page-items.ts`): first,
last, the current page, its siblings, and up to two ellipses, always the same number of items so
the bar keeps its width. Near either end the spare slots go to pages (`1 2 3 4 5 … 119`), and an
ellipsis always hides at least two pages.

- From `sm` up: one sibling on each side (7 items, `1 … 59 60 61 … 119`), 32px page pills, text
  labels on previous/next, and first/last buttons.
- Phones: no page numbers; icon-only previous/next and the "Página X de Y" label.
- Long client-side lists (e.g. `/clubes`, 20 rows per page) keep the page in the URL (`page`
  search param, stripped when 1) and reset to page 1 when a filter or tab changes.

### Inputs

Pills inside search-like contexts (command menu, 40px). The header search trigger is a
`secondary` pill with a 1px `border-border` outline so it reads as a field. Form inputs follow the shadcn input with
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
| Cool blue-gray structure `#F5F7FA` / `#E2E7F1` | `muted`/`secondary` (`#F5F7FA`) and `border`/`input` (`#E4E9F1`) |
| A distinctive geometric sans for titles | Fustat for all text, including body and secondary text |
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
| 18px body text, 1.8 line height, +0.9px letter spacing | The site is tables and stats; that sizing makes them sparse and harder to scan. Body is 16px with normal spacing. |
| `#E2E7F1` page background with white bordered cards | FSX uses borderless muted tiles on white; borders are kept for tables, dividers, and inputs |
| 500ms base transitions, 1800ms reveals | Too slow for tabs, filters, and buttons used repeatedly; FSX uses 150–200ms |
| Brand-tinted card shadows on hover | Surfaces stay flat |
| Custom breakpoint list (390 … 1699px) | Tailwind breakpoints cover the same ranges |
