# Rewriting Plan: Next.js → Better-T-Stack

A complete migration of the **Federação Sergipana de Xadrez** website from
Next.js + Supabase + PostgreSQL to Better-T-Stack (TanStack Start + tRPC +
Better Auth + D1/SQLite).

---

## Architecture Comparison

| Category       | Old Stack                         | New Stack                                        |
| -------------- | --------------------------------- | ------------------------------------------------ |
| Framework      | Next.js 16 (App Router, RSC)      | TanStack Start (SSR, TanStack Router)            |
| Auth           | Supabase Auth (GitHub OAuth)      | Better Auth (GitHub OAuth + email/password)      |
| Database       | PostgreSQL (Supabase)             | SQLite (Cloudflare D1)                           |
| ORM            | Drizzle ORM (postgres-js)         | Drizzle ORM (libsql/D1)                          |
| API            | REST routes + Server Actions      | tRPC                                             |
| Forms          | react-hook-form                   | TanStack Form                                    |
| Charts         | Recharts                          | TanStack Charts (D3-native, typed grammar)        |
| State (client) | Zustand                           | React useState (Zustand removed)                  |
| Timing         | Custom `useDebounce` hook         | Kept (Pacer debounces fns, hook debounces values) |
| Hotkeys        | Raw `cmdk` key handling           | TanStack Hotkeys (Mod+K, cross-platform)         |
| Devtools       | None (isolated React Query devtools)  | TanStack Devtools (unified panel: Query + Router + Form) |
| Storage        | Supabase Storage                  | Cloudflare R2                                    |
| Linting        | Biome                             | Oxlint + Oxfmt                                   |
| State (server) | React Query + Server Actions      | React Query (tRPC integrated)                    |
| Deploy         | Vercel                            | Cloudflare Pages (via Alchemy)                   |
| Package Manager| bun (single package)              | bun (monorepo workspaces)                        |
| Docs           | None                              | Fumadocs (Astro)                                 |

---

## Feature Inventory

### Public Pages (15 features)

1.  **Homepage** — Hero, events, recent posts, top players (classic/rapid/blitz), announcements, FAQ
2.  **Ratings** — Filterable data table by rating type
3.  **Player Profile** — Player card, rating charts (TanStack Charts), titles, tournament history, roles, defending status
4.  **News Listing** — Paginated blog posts with images
5.  **News Article** — MDX-rendered content with slug-based routing
6.  **Announcements** — Official communications, paginated by year
7.  **Champions** — Championship winners by tournament, podium display
8.  **Circuits** — Circuit standings with phases, podiums, club info, categories
9.  **Members** — Filterable player directory (sex, title, club, age group, location)
10. **Titled Players** — Players with chess titles
11. **About** — Federation history and information
12. **Technical Norms** — Rules, regulations, guidelines
13. **Links** — URL directory (link groups with external links)
14. **Login** — GitHub OAuth + email/password sign-in
15. **Command Menu** — CMD+K search and navigation

### Private/Admin Pages (12 features)

16. **Dashboard** — Admin hub
17. **Player Management** — CRUD players, assign titles/roles/insignias/norms
18. **Tournament Player Registration** — Create player + link to tournament with rating change
19. **Rating Update** — Update player rating via tournament results in a transaction
20. **Post Management** — CRUD blog posts with MDX editor (`@uiw/react-md-editor`)
21. **Announcement Management** — CRUD official announcements
22. **Event Management** — CRUD events
23. **Club Management** — CRUD clubs with logo images
24. **Location Management** — CRUD locations
25. **Link Management** — CRUD link groups and links
26. **Swiss Manager Export** — Export player data as Excel (xlsx)
27. **Cache Management** — Invalidate cached data
28. **Database Backup** — Download table data

### Infrastructure Features

29. **Image Upload** — Player and post images with cropping (react-image-crop)
30. **Image Storage** — R2 object storage (was Supabase Storage)
31. **SEO Metadata** — Per-page title, description, OG images
32. **Dark Mode** — next-themes (light/dark/system)
33. **Animations** — Counting numbers, sliding numbers, rotating elements, motion grids
34. **Responsive Design** — Mobile-first TailwindCSS layout
35. **Data Tables** — TanStack Table with sorting, filtering, pagination
36. **Toasts** — sonner for notifications
37. **Loading States** — Skeleton components
38. **Seed Data** — Script for initial database population
39. **Documentation** — Fumadocs site for FSX technical norms and guides

---

## Migration Phases

### Phase 1: Database Schema (packages/db)

**Goal**: Port all 31 PostgreSQL tables + 10 enums to SQLite/D1.

#### 1.1 Type Mappings

| PostgreSQL           | SQLite (libsql)                   |
| -------------------- | --------------------------------- |
| `pgTable("x", ...)`  | `sqliteTable("x", ...)`           |
| `serial("id")`       | `integer("id").primaryKey({ autoIncrement: true })` |
| `varchar(80)`        | `text()`                          |
| `smallint("x")`      | `integer("x")`                    |
| `timestamp("x")`     | `text("x")`                       |
| `boolean("x")`       | `integer("x", { mode: "boolean" })` |
| `pgEnum("type", [])` | `text("type")` → validated with Zod in app layer |
| `uniqueIndex("x")`   | Same API, compatible              |
| `relations(...)`     | Same API, compatible              |
| `references()`       | `references(() => table.id)`      |

#### 1.2 Enum Handling

PostgreSQL enums become text columns. Validation moves to Zod schemas which already exist in
the old codebase via `drizzle-zod`. **This is an improvement**: validation now works on both
client and server, not just at the database level.

PostgreSQL enums (10 total):
- `rating_type` → blitz, rapid, classic
- `event_type` → open, closed, school
- `event_time_control` → standard, rapid, blitz, bullet
- `location_type` → city, state, country
- `circuit_type` → default, categories, school
- `title_type` → internal, external
- `role_type` → management, referee, teacher
- `bracket_type` → UB, LB, GF
- `phase_type` → 12 playoff phase names
- `circuit_category` → 15 age/gender categories
- `circuit_place` → 1-25

#### 1.3 Unique Indexes

SQLite supports unique indexes natively. No changes needed for `uniqueIndex()` calls.

#### 1.4 Serial Sequences

- Old: `serial("id").primaryKey()` + `reset-sequences.ts` script
- New: `integer("id").primaryKey({ autoIncrement: true })` — D1 handles this automatically
- **Remove** `reset-sequences.ts` and `fix-sequences.ts` — not needed

#### 1.5 Schema File Structure (unchanged)

```
packages/db/src/schema/
├── index.ts                # barrel export
├── announcements.ts
├── championships.ts
├── circuits.ts
├── circuitPhases.ts
├── circuitPodiums.ts
├── clubs.ts
├── cups.ts
├── cupBrackets.ts
├── cupGames.ts
├── cupGroups.ts
├── cupMatches.ts
├── cupPlayers.ts
├── cupPlayoffs.ts
├── cupRounds.ts
├── defendingChampions.ts
├── events.ts
├── insignia.ts
├── linkGroups.ts
├── links.ts
├── locations.ts
├── norms.ts
├── players.ts
├── playersToInsignias.ts
├── playersToNorms.ts
├── playersToRoles.ts
├── playersToTitles.ts
├── playersToTournaments.ts
├── posts.ts
├── roles.ts
├── titles.ts
├── tournamentPodiums.ts
└── tournaments.ts
```

#### 1.6 Generate Initial Migration

```bash
bun run db:generate
```

---

### Phase 2: Authentication (packages/auth)

**Goal**: Replace Supabase Auth with Better Auth, supporting GitHub OAuth + email/password.

#### 2.1 Better Auth Configuration

Already scaffolded in `packages/auth/src/index.ts`. Extend with:

```typescript
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { tanstackStartCookies } from "better-auth/tanstack-start";

export function createAuth() {
  return betterAuth({
    database: drizzleAdapter(createDb(), {
      provider: "sqlite",
      schema: schema,
    }),
    trustedOrigins: [env.CORS_ORIGIN],
    emailAndPassword: { enabled: true },
    socialProviders: {
      github: {
        clientId: env.GITHUB_CLIENT_ID!,
        clientSecret: env.GITHUB_CLIENT_SECRET!,
      },
    },
    secret: env.BETTER_AUTH_SECRET,
    baseURL: env.BETTER_AUTH_URL,
    plugins: [tanstackStartCookies()],
  });
}
```

#### 2.2 Environment Variables

Add to `apps/web/.env`:
```
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
```

Add validation in `packages/env/src/server.ts`.

#### 2.3 Auth Pattern Migration

| Old (Supabase) | New (Better Auth) |
|---|---|
| `createClient().auth.getUser()` | `createAuth().api.getSession({ headers })` |
| `supabase.auth.signInWithOAuth({ provider: "github" })` | `authClient.signIn.social({ provider: "github" })` |
| `await (await supabase()).auth.getUser()` in API routes | `ctx.session` in tRPC procedures (via `protectedProcedure`) |
| `utils/supabase/server.ts` | `packages/auth/src/index.ts` (single source of truth) |
| `utils/supabase/client.ts` | `apps/web/src/lib/auth-client.ts` (already scaffolded) |
| `utils/supabase/middleware.ts` + `proxy.ts` | `apps/web/src/middleware/auth.ts` (already scaffolded) |
| Supabase `exchangeCodeForSession` callback | Built into Better Auth handler at `/api/auth/$` |

#### 2.4 Auth Guard

Old: `app/(private)/private/layout.tsx` calls `getUser()`, redirects to `/login`.

New: `apps/web/src/routes/_auth/route.tsx` — already scaffolded with session check. Adapt to
check session and redirect unauthenticated users.

#### 2.5 Login Page

Old: `app/login/page.tsx` — checks if already logged in, shows GitHub button.

New: `apps/web/src/routes/login.tsx` — already scaffolded with SignUp and SignIn forms.
Add GitHub OAuth button alongside email/password forms using `authClient.signIn.social`.

#### 2.6 Remove Supabase Dependencies

- Delete `utils/supabase/` directory
- Delete `proxy.ts`
- Remove `@supabase/ssr`, `@supabase/supabase-js` from dependencies
- Remove `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` env vars

---

### Phase 3: tRPC API (packages/api)

**Goal**: Convert all REST API routes and Server Actions into tRPC procedures.

#### 3.1 Router Organization

```
packages/api/src/routers/
├── index.ts             # appRouter — merges all sub-routers
├── announcements.ts     # announcements.list, .byPage, .fresh, .create, .update, .delete
├── champions.ts         # champions.list (complex 7-table join)
├── circuits.ts          # circuits.list (deep nested: phases, podiums, players)
├── clubs.ts             # clubs.list, .create, .update, .delete
├── events.ts            # events.list, .create, .update, .delete
├── links.ts             # links.groups.list, .groups.create, .links.create, .links.update
├── locations.ts         # locations.list, .create, .update, .delete
├── players.ts           # players.list, .byId, .search, .create, .update, .forEdit
├── players-tournament.ts # players.linkTournament, .updateRating (transactional)
├── posts.ts             # posts.list, .bySlug, .byPage, .create, .update, .delete
├── roles.ts             # roles.listWithPlayers (players grouped by role)
├── swiss-manager.ts     # swissManager.export
├── titled-players.ts    # titledPlayers.list
├── top-players.ts       # topPlayers.get (3 rating types, top 10 each)
├── cache.ts             # cache.revalidateTag (admin-only, Cloudflare-compatible)
└── seed.ts              # seed.run (admin-only, for development)
```

#### 3.2 Procedure Mapping

| Old Endpoint | New tRPC Procedure | Type |
|---|---|---|
| `GET /api/players?filters` | `players.list(input: PlayerFiltersSchema)` | `publicProcedure` |
| `GET /api/players/:id` | `players.byId(input: z.object({ id: z.number() }))` | `publicProcedure` |
| `GET /api/search-players?q=` | `players.search(input: z.object({ query: z.string() }))` | `publicProcedure` |
| `GET /api/circuits` | `circuits.list()` | `publicProcedure` |
| `POST /api/players-data` | `players.create(input: CreatePlayerSchema)` | `protectedProcedure` |
| `PUT /api/players-data/:id` | `players.update(input: UpdatePlayerSchema)` | `protectedProcedure` |
| `POST /api/players-tournament` | `playersTournament.link(input: LinkPlayerSchema)` | `protectedProcedure` |
| `PUT /api/players-tournament/:id` | `playersTournament.updateRating(input: UpdateRatingSchema)` | `protectedProcedure` |

#### 3.3 Server Actions → tRPC Mutations

| Old Server Action | New tRPC Procedure |
|---|---|
| `reset-sequences.ts` | Not needed (D1 uses autoincrement) |
| `revalidate-images.ts` | `imageCache.revalidate()` — R2-based, simpler |
| `revalidate-players.ts` | `cache.revalidatePlayers()` |
| `revalidate-tag.ts` | `cache.revalidateTag(input)` |

#### 3.4 tRPC Context Enhancement

The `createContext` function already extracts the session. Enhance to include the database:

```typescript
export async function createContext({ req }: { req: Request }) {
  const db = createDb();
  const auth = createAuth();
  const session = await auth.api.getSession({ headers: req.headers });
  return { db, session };
}
```

#### 3.5 Client Integration

Already scaffolded in `apps/web/src/utils/trpc.ts` with `createTRPCContext<AppRouter>()`.
The `TRPCProvider` is injected in `apps/web/src/router.tsx`.

---

### Phase 4: UI Components (packages/ui + apps/web)

**Goal**: Migrate from shadcn/ui new-york (Radix) to shadcn/react base-lyra (Base UI), and
port all custom components.

#### 4.1 Already Available in @fsx/ui

Button, Card, Checkbox, DropdownMenu, Input, Label, Skeleton, Sonner, Textarea, Tooltip,
Attachment, Bubble, Empty, InputGroup, Marker, Message, MessageScroller.

#### 4.2 Need to Install via shadcn

```bash
npx shadcn@latest add accordion alert-dialog avatar badge calendar chart command
context-menu dialog drawer form menubar navigation-menu pagination popover
scroll-area select separator sheet table tabs -c packages/ui
```

#### 4.3 Custom Component Migration

Move from `source-project/components/` to `apps/web/src/components/`, adapting imports:

| Old Path | New Path | Notes |
|---|---|---|
| `components/header/` | `apps/web/src/components/header/` | Import from `@fsx/ui/components/*` instead of `@/components/ui/*` |
| `components/home/` | `apps/web/src/components/home/` | Same structure, different imports |
| `components/player/` | `apps/web/src/components/player/` | Player charts use TanStack Charts |
| `components/animate-ui/` | `apps/web/src/components/animate-ui/` | Uses `motion` (framer-motion successor) |
| `components/modals/` | `apps/web/src/components/modals/` | Dialog-based modals |
| `components/sheets/player/` | `apps/web/src/components/sheets/player/` | Sheet component from shadcn |
| `components/providers.tsx` | `apps/web/src/components/providers.tsx` | Adapt: no PersistQueryClient, use tRPC provider instead |
| `components/footer.tsx` | `apps/web/src/components/footer.tsx` | No changes |
| `components/logo.tsx` | `apps/web/src/components/logo.tsx` | No changes |
| `components/login-form.tsx` | `apps/web/src/components/login-form.tsx` | Rewrite: supabase auth → Better Auth client |
| `components/mdx.tsx` | `apps/web/src/components/mdx.tsx` | Rewrite: next-mdx-remote → @tanstack/react-markdown |
| `components/post-card.tsx` | `apps/web/src/components/post-card.tsx` | Port as-is |
| `components/command-menu.tsx` | `apps/web/src/components/command-menu.tsx` | Port as-is |
| `components/mode-switcher.tsx` | `apps/web/src/components/mode-switcher.tsx` | Port as-is |
| `components/image-cropper.tsx` | `apps/web/src/components/image-cropper.tsx` | Port, update storage upload to R2 |

#### 4.4 Dependencies to Add

```
# In apps/web/package.json

# Icons
@hugeicons/react                 # Rendering component (HugeiconsIcon)
@hugeicons/core-free-icons       # 28K+ stroke-based icon data

# TanStack ecosystem (framework-aligned)
@tanstack/react-table           # Data tables (sorting, filtering, pagination)
@tanstack/react-form            # Already present — use for all forms
@tanstack/react-charts          # Player rating charts (D3-native, typed grammar)
@tanstack/react-store           # Client-side state (replaces Zustand)
@tanstack/react-virtual         # Virtualized lists (players, ratings, members)
@tanstack/react-markdown        # Blog post MDX rendering (SSR + client)
@tanstack/react-hotkeys         # Type-safe keyboard shortcuts (CMD+K, admin, etc.)
@tanstack/pacer                 # Debounce, throttle, rate-limit, batch (replaces custom hooks)
@tanstack/react-devtools        # Unified devtools panel (Query, Router, Form, Hotkeys)

# Third-party
date-fns                         # Date formatting
motion                           # Already present in root catalog (animations)
xlsx                             # Swiss Manager Excel export
react-image-crop                 # Image cropping for player/post uploads
@uiw/react-md-editor             # Admin MDX post editor (WYSIWYG)
react-slugify                    # URL slug generation
```

**Removed** (replaced):
- `lucide-react` → `@hugeicons/react` + `@hugeicons/core-free-icons` (28K+ icons, stroke-based, better bundle via tree-shaking)

**Removed** (replaced by TanStack ecosystem):
- `recharts` → `@tanstack/react-charts`
- `zustand` → `@tanstack/react-store`
- `react-hook-form` → `@tanstack/react-form` (already present)
- Custom `useDebounce` hook → `@tanstack/pacer`
- `mdx-bundler` / `@mdx-js/mdx` approach → `@tanstack/react-markdown`
- Raw keyboard event handling → `@tanstack/react-hotkeys`

#### 4.5 Theme Migration

The old `app/globals.css` uses oklch color tokens. The new `packages/ui/src/styles/globals.css`
has a different token system (base-lyra). **Port the old color palette** into the new theme
structure to maintain visual identity.

Old custom colors to preserve:
`brand`, `noir`, `raspberry`, `strawberry`, `sun`, `honey`, `sea`, `bulbasaur`, `ice`,
`blueberry`, `jam`, `mulberry`, `mint`, `peach`, `lavender`, `slate`, `emerald`, `indigo`

These map to TailwindCSS v4 `@theme` definitions in the new globals.css.

---

### Phase 5: Routes & Pages (apps/web)

**Goal**: Convert all Next.js pages to TanStack Start routes.

#### 5.1 Route Mapping

```
Old (Next.js)                              New (TanStack Router)
──────────────────────────────────────────────────────────────────
app/layout.tsx                             routes/__root.tsx
app/(app)/layout.tsx                       __root.tsx (inline analytics wrapper — or remove)
app/(app)/(default)/layout.tsx             routes/_public/route.tsx
  Header, Footer, dotted borders
app/(app)/(default)/page.tsx               routes/_public/index.tsx
app/(app)/(default)/bullet/                routes/_public/bullet.tsx
app/(app)/(default)/campeos/               routes/_public/champions.tsx
app/(app)/(default)/circuitos/             routes/_public/circuits.tsx
app/(app)/(default)/comunicados/           routes/_public/announcements.tsx
app/(app)/(default)/membros/               routes/_public/members.tsx
app/(app)/(default)/normas-tecnicas/       routes/_public/norms.tsx
app/(app)/(default)/noticias/              routes/_public/news.tsx
app/(app)/(default)/ratings/               routes/_public/ratings.tsx
app/(app)/(default)/sobre/                 routes/_public/about.tsx
app/(app)/(default)/titulados/             routes/_public/titled.tsx
app/(app)/(params)/layout.tsx              routes/_params/route.tsx
app/(app)/(params)/jogadores/[id]/         routes/_params/players.$id.tsx
app/(app)/(params)/noticias/[slug]/        routes/_params/news.$slug.tsx
app/(app)/links/                           routes/links.tsx

app/login/                                 routes/login.tsx (already scaffolded — enhance)

app/(private)/private/layout.tsx           routes/_auth/route.tsx (already scaffolded)
app/(private)/private/dashboard/           routes/_auth/dashboard/
app/(private)/private/dashboard/page.tsx   routes/_auth/dashboard/index.tsx
  Announcements, Posts, Events, Clubs,
  Locations, Links, Players, Backup,
  Cache, User, SwissManager sub-pages

app/(private)/private/rating-update/       routes/_auth/rating-update.tsx
app/swiss-manager/                         routes/swiss-manager.tsx (public-facing version)
```

#### 5.2 Key Pattern Differences

**Loaders replace RSC**. Old code fetches data inside async React components. New code uses
route `loader` functions or `useSuspenseQuery` with tRPC.

```typescript
// Old (Next.js RSC)
export default async function PlayersPage() {
  const players = await getPlayers();
  return <PlayersTable data={players} />;
}

// New (TanStack Start — loader pattern)
export const Route = createFileRoute("/_public/members")({
  loader: ({ context }) => context.trpc.players.list.ensureQueryData({}),
  component: MembersPage,
});

function MembersPage() {
  const [players] = useSuspenseQuery(useTRPC().players.list.queryOptions({}));
  return <PlayersTable data={players} />;
}
```

**No server components**. All components render on client and server (SSR). Use `createServerFn`
for server-only logic. tRPC procedures automatically handle the server/client boundary.

**Metadata via `head()`**. TanStack Start uses route-level `head()` functions instead of
Next.js `export const metadata`.

```typescript
// Old
export const metadata: Metadata = { title: "Jogadores - FSX" };

// New
export const Route = createFileRoute("/_public/members")({
  head: () => ({
    title: "Jogadores - FSX",
    meta: [
      { name: "description", content: "Lista de jogadores da FSX" },
      { property: "og:title", content: "Jogadores - FSX" },
    ],
  }),
  loader: ...,
  component: MembersPage,
});
```

**Layout groups** use `.route.tsx` files with `<Outlet />` (similar to Next.js, different syntax).

#### 5.3 OG Image Generation

Old approach: `opengraph-image.tsx` at each route generates PNGs at build time via Satori.

New approach (choose one):
- **Simple**: Use static OG images. Set `meta: [{ property: "og:image", content: "/og/members.png" }]` in each route's `head()`.
- **Dynamic**: Create a standalone Cloudflare Worker endpoint that renders OG images with Satori. Route `.tsx` pages become API endpoints.

Start with static images. Add dynamic generation later if needed.

#### 5.4 View Transitions

Old Next.js config: `experimental: { viewTransition: true }`. This is a **React API**
(`import { ViewTransition, addTransitionType } from "react"`), not Next.js-specific.
It uses the browser's native View Transition API. TanStack Start supports it.

**Constraint**: React's `<ViewTransition>` is currently **Canary-only** (React 19.x stable
does not include it). The new project uses React 19.2.8 (stable). To use `<ViewTransition>`,
upgrade React to the Canary channel:

```json
// package.json catalog
"react": "19.2.0-canary-...",
"react-dom": "19.2.0-canary-..."
```

If you choose not to upgrade, the `motion`-based animate-ui components (counting-number,
sliding-number, rotating, motion-grid) already provide polished animations. `<ViewTransition>`
can be added later as an enhancement for page-level transitions and shared element animations.

---

### Phase 6: Gaps & Integrations

#### 6.1 Image Storage: Supabase Storage → Cloudflare R2

| Old | New |
|---|---|
| `lib/supabase-storage-players.ts` | `lib/r2-storage.ts` |
| `lib/supabase-storage-posts.ts` | Merged into `lib/r2-storage.ts` |
| `supabase.storage.from("player-images")` | R2 presigned upload URLs |
| `supabase.storage.from("post-images")` | Same R2 bucket, different prefix |
| Supabase URL in `.env` | R2 account ID, access key, bucket name in `.env` |

R2 provides an S3-compatible API. Use `@aws-sdk/client-s3` or Cloudflare's own R2 SDK.

**Implementation approach**:
1. Create an R2 bucket via Cloudflare dashboard or `alchemy`
2. Add R2 binding in `alchemy.run.ts`
3. Create a tRPC procedure for generating presigned upload URLs
4. Client uploads directly to R2 via presigned URL
5. Store the R2 public URL in the database (player `imageUrl`, post `image`)

#### 6.2 Markdown Rendering (Blog Posts)

Old: `next-mdx-remote` (Next.js RSC-only). New: **TanStack Markdown**
(`@tanstack/react-markdown`). Small (6.7KB gzip), synchronous (works in SSR and client),
produces a deterministic serializable AST. Safe by default (raw HTML escaped, `javascript:`
URLs removed.

```tsx
import { parseMarkdown } from "@tanstack/markdown";
import { renderReact } from "@tanstack/react-markdown";

// Parse once, render many
const ast = parseMarkdown(post.content, { allowHtml: false });
const html = renderReact(ast);
```

Blog posts are created in the admin dashboard via a WYSIWYG MDX editor
(`@uiw/react-md-editor`). Content is stored as raw markdown in D1, parsed at render time.
Since TanStack Markdown has no async initialization, it works identically on server
(TanStack Start SSR) and client (admin preview).

#### 6.3 Cache Invalidation

Old: Next.js `"use cache"` with `cacheTag()` and `revalidateTag()`. These don't exist in
Cloudflare Workers/Pages.

New approaches:
- **Cloudflare Cache API** — `caches.default` caches tRPC GET responses at the edge (5min TTL, 1hr stale-while-revalidate). POST mutations bypass cache automatically. React Query client-side cache with 5min staleTime prevents redundant re-fetches. SSR prefetch via `ensureQueryData()` in route loaders with `<Link preload="intent">`.

#### 6.4 Query Cache Persistence

Old: `@tanstack/react-query-persist-client` with IndexedDB storage (15-day maxAge).

New: Remove persistence. tRPC's built-in SSR prefetching + Cloudflare edge caching makes
client-side persistence unnecessary. **Removes `idb-keyval` dependency**.

#### 6.5 Analytics

Old: `@vercel/analytics` and `@vercel/speed-insights`.

New: Remove both. Cloudflare Web Analytics is free and integrated into the Cloudflare
dashboard. Or skip analytics entirely for now.

#### 6.6 Seed Script

Port `scripts/seed.ts` to a tRPC mutation or a standalone script in `packages/db/src/seed.ts`.
The seed inserts locations (5), clubs (4), roles (6), titles (5), and players (5).

#### 6.7 Swiss Manager Excel Export

Old: `xlsx` library in a server action. New: tRPC procedure returning a Blob/file download.

Workers have a 30s CPU limit (paid plan). The export generates Excel from a few thousand
players — this is sub-second. **Not a concern**. If volume grows, use Cloudflare Queues for
async generation.

#### 6.8 CMD+K Command Menu

Preserves the existing `cmdk`-based command menu. Port `command-menu.tsx` as-is.
Integrate with TanStack Router's `useNavigate()` instead of `useRouter()` from Next.js.

---

## Execution Order

Execute in this sequence to maintain a working application at each step:

```
[x]  1.  packages/db/src/schema/     — Port all 31 tables to SQLite
[x]  2.  packages/db/src/index.ts    — Verify D1 connection works
[ ]  3.  db:generate                 — Create initial migration (needs D1 provisioned)
[x]  4.  packages/auth/src/index.ts  — Add GitHub OAuth
         apps/web/.env                — Add GitHub env vars
         packages/env/src/server.ts   — Add env validation
[ ]  5.  Verify auth flow (email + GitHub) (needs D1 + dev server running)
[x]  6.  packages/api/src/context.ts — Enhance context with `db`
[x]  7.  packages/api/src/routers/   — Port tRPC procedures
         Start with: announcements, clubs, locations, roles, titles (simple CRUD)
         Then: players, posts, circuits, champions (complex queries)
         Then: players-tournament (transactional mutations)
[x]  8.  packages/ui/src/components/ — Install missing shadcn components
         packages/ui/src/styles/globals.css — Port color tokens
[x]  9.  apps/web/src/routes/        — Port public pages first
         __root.tsx (layout + theme)
         _public/ (homepage, ratings, news, etc.)
         _params/ (player profile, news article)
         login.tsx
[x] 10.  apps/web/src/components/   — Port custom components
         Start: providers, header, footer, logo
         Then: home/* (hero, events, posts, announcements, FAQ, ratings)
         Then: player/* (charts, profile, badge)
         Then: animate-ui/* (counting, sliding, etc.)
         Then: modals, sheets, command-menu
[x] 11.  apps/web/src/routes/_auth/  — Port private/admin pages
         dashboard/* (all CRUD pages) — 28 route files created
         rating-update — ported (Excel upload + tRPC mutations)
         swiss-manager — route exists, page needs content
[x] 12.  Image storage               — Set up R2 stub, create upload procedures
         lib/r2-storage.ts (stub ready for Cloudflare R2 setup)
[ ]       Update image-cropper.tsx — ported but needs R2 integration
[x] 13.  Seed script                  — Port to packages/db/src/seed.ts
[x] 14.  apps/fumadocs/              — Populate docs with actual FSX content
[x] 15.  Polish                      — SEO metadata, loading states, error handling
[ ] 16.  Deploy                      — Test on Cloudflare Pages via Alchemy
```

---

## Best Practices for the New Stack

### TanStack Start

- **Use `createServerFn` for server-only logic**, not for data fetching. Data fetching belongs
  in tRPC procedures or route loaders.
- **Prefetch in loaders**, not in components. Route loaders with `ensureQueryData` prevent
  waterfall requests.
- **Layout routes (`_public/route.tsx`, `_auth/route.tsx`)** wrap child routes. Use for
  shared layouts, auth guards, and context providers.
- **`head()` at the route level**, not in the root layout. Each route declares its own metadata.
- **Use `@tanstack/react-router-ssr-query`** for SSR data dehydration.
- **Route file conventions**:
  - `routes/_layout/route.tsx` — layout route (export `Route` with `<Outlet />`)
  - `routes/_layout/page.tsx` — index route
  - `routes/_layout/$id.tsx` — dynamic parameter route
  - `routes/api/$.ts` — catch-all API route
- **No React Server Components**. All rendering is client + SSR. Don't use `"use server"`
  directives — use `createServerFn` with `.handler()` instead.

### tRPC

- **Co-locate Zod schemas with procedures**. Each router file exports its own input schemas.
  Reuse schemas from `packages/db/src/schema/*.ts` (drizzle-zod) for database-level validation.
- **Use `protectedProcedure`** for all admin mutations. The context already extracts the session.
- **Use `publicProcedure`** for all read-only public data.
- **Use sub-routers** (`t.router({ ... })`) and merge in `routers/index.ts`:
  ```typescript
  export const appRouter = router({
    players: playersRouter,
    posts: postsRouter,
    // ...
  });
  ```
- **Client usage**:
  ```typescript
  import { useTRPC, useTRPCClient } from "@/utils/trpc";

  // Query (read)
  const [players] = useSuspenseQuery(useTRPC().players.list.queryOptions({}));

  // Mutation (write)
  const utils = useTRPC();
  const createPlayer = useMutation(utils.players.create.mutationOptions());
  ```
- **Response schemas are unnecessary**. tRPC infers types from procedure return types. Drop the
  old `{ success, data, error }` wrappers — throw `TRPCError` for errors instead.

### Better Auth

- **Single `createAuth()` factory** in `packages/auth/src/index.ts`. Import from one place.
- **Session on the server**: `createAuth().api.getSession({ headers: request.headers })`
- **Session on the client**: `authClient.useSession()` hook or `authClient.getSession()`
- **Social OAuth flow**: `authClient.signIn.social({ provider: "github", callbackURL: "/" })`
  Better Auth handles the callback — no custom route needed. The scaffolded `/api/auth/$` route
  already delegates to `auth.handler(request)`.
- **Auth guard in routes**: Use `_auth/route.tsx` layout route that calls
  `createAuth().api.getSession()` and redirects if no session. Already scaffolded.
- **Pass session through tRPC context**. The `createContext` function already does this.
- **Avoid accessing auth in components**. Prefer tRPC context for server-side auth, and
  `authClient.useSession()` for client-side UI decisions (show/hide login button).

### D1 + Drizzle

- **Text for all strings**. SQLite has no `varchar(n)` limit. Use `text()` everywhere.
- **Booleans**: `integer("x", { mode: "boolean" })` in Drizzle maps to 0/1 in D1.
- **Autoincrement**: `integer("id").primaryKey({ autoIncrement: true })` handles primary keys.
- **No enums in the database**. Zod schemas provide enum validation in the app layer.
  Use `.default()` in Zod for sensible defaults.
- **Timestamps as text**. Store ISO 8601 strings. Use `date-fns` for formatting.
- **Relations work the same way**. Drizzle's `relations()` API is dialect-agnostic.
- **Run migrations**: `bun run db:generate` creates SQL migration files. Alchemy applies them
  automatically during `bun run dev` and `bun run deploy`.
- **Query inside tRPC procedures**, not in separate query files. The old `db/queries/` pattern
  with `"use cache"` doesn't apply. Keep data access co-located with the procedure that uses it.
  For shared queries, extract to `packages/db/src/queries/` as plain functions (no caching directive).

### shadcn/react (base-lyra + Base UI)

- **Import from `@fsx/ui/components/*`** in all apps.
- **Base UI primitives** replace Radix primitives. API is similar but not identical.
  Components like `<Dialog.Root>` become `<Dialog>` (Base UI component API, not Radix namespace).
- **Use `cn()` from `@fsx/ui/lib/utils`** for class merging.
- **Install new components** via `npx shadcn@latest add <name> -c packages/ui`.
- **Customize the theme** in `packages/ui/src/styles/globals.css` using CSS variables.
- **All icons import from two packages: `@hugeicons/react` (rendering) and
  `@hugeicons/core-free-icons` (icon data).** Set `iconLibrary: "hugeicons"` in
  `components.json` (both `packages/ui/` and `apps/web/`). Usage pattern:
  ```tsx
  import { CheckIcon } from "@hugeicons/core-free-icons";
  import { HugeiconsIcon } from "@hugeicons/react";
  <HugeiconsIcon icon={CheckIcon} className="size-4" />
  ```
  When adding shadcn components that use `lucide-react`, swap to this pattern
  with the equivalent Hugeicons icon names.
- **Don't mix old shadcn/ui imports** (`@/components/ui/*`) with new ones. All UI imports go
  through `@fsx/ui/`.

### Monorepo Conventions

- **Shared code in `packages/`**, app code in `apps/`.
- **No circular dependencies between packages**. The dependency graph must be a DAG:
  `web` → `api` → `auth` → `db` → `env` → (external)
  `web` → `ui` → (external)
  `web` → `env` → (external)
- **Environment variables**: Define in `apps/web/.env`, validate in `packages/env/src/server.ts`
  (server-side) and `packages/env/src/web.ts` (client-safe).
- **Types**: Share via `@fsx/*` workspace imports. No need for a separate `@fsx/types` package
  — types live in their domain packages.
- **Scripts**: Root `package.json` orchestrates via `vp run`. Package-level scripts are scoped
  to their domain.

---

## Feature Improvements

### Things to do better in the new stack

1.  **Type-safe API calls** — tRPC eliminates manual typing of response data. Every API call
    is fully typed from procedure input → output with no code generation step.

2.  **Zod enums over PostgreSQL enums** — Enum validation at the app layer means:
    - Enums work on client and server without database round-trips
    - Enum values can be changed without migrations
    - Error messages are localized by Zod, not raw PostgreSQL errors

3.  **Single auth provider** — Better Auth replaces Supabase Auth + custom middleware. All auth
    logic lives in `packages/auth/src/index.ts`. No more scattered `supabase.auth.*` calls.

4.  **Simpler caching** — Drop Next.js's complex `"use cache"` + `cacheTag` + `cacheLife`
    system. D1 is fast enough for direct queries on this traffic level. Add caching only
    if needed, and use Cloudflare's native primitives when you do.

5.  **Monorepo structure** — Code is organized by domain (db, auth, api, ui) instead of by
    framework convention (app/, components/, lib/, utils/). Easier to reason about as the
    project grows.

6.  **TanStack Form over react-hook-form** — TanStack Form provides typed form state, Zod
    integration, and works with the same TanStack ecosystem as Router and Query. Better DX,
    fewer dependencies.

7.  **TanStack Charts over Recharts** — D3-native, typed grammar (no guessing series models),
    responsive out of the box, automatic light/dark mode from CSS variables. Replaced player
    charts with `defineChart()` + D3 scales composition.

8.  **TanStack Store over Zustand** — Removed Zustand entirely. React useState suffices — no client state store needed.

9.  **TanStack Pacer** — Kept custom `useDebounce` hook. Pacer debounces functions, the custom hook debounces values — different patterns, hook is simpler for this use case.

10. **TanStack Hotkeys** — Type-safe keyboard shortcut management with full autocomplete
    for modifier keys (`Control+A`, `Mod+Shift+G`). Cross-platform (`Mod` → Cmd on Mac,
    Ctrl on Windows). Automatic input element filtering, conflict detection, sequence
    recording, platform-aware display formatting. Dedicated devtools panel.

11. **TanStack Virtual** — Headless virtualization for long lists. Player directories,
    ratings tables, member lists — any list with 100+ items gets smooth 60fps scrolling.
    Zero style lock-in, works with TanStack Table.

12. **TanStack Markdown over next-mdx-remote** — Small (6.7KB gzip), synchronous parser
    + React renderer. Works identically on server (TanStack Start SSR) and client (admin
    preview). No async initialization, no runtime deps. Safe by default (raw HTML escaped).

13. **TanStack Devtools** — Unified devtools panel replacing isolated
    `@tanstack/react-query-devtools`. Single floating panel with tabbed views
    for Query, Router, Form, Hotkeys, and custom plugins. Picture-in-picture mode,
    source inspector (go-to-source on click), console piping. Framework-agnostic
    shell built on Solid.js.

15. **No `next/image` lock-in** — Use standard `<img>` with srcsets or Cloudflare Images.
    Portable to any platform.

16. **Removed Vercel lock-in** — No `@vercel/analytics`, `@vercel/speed-insights`, or
    Vercel-specific Next.js features. Deploy to any Cloudflare-compatible platform.

### Things to remove (no longer needed)

- **Supabase client/server/middleware** — Replaced by Better Auth
- **`@vercel/analytics` and `@vercel/speed-insights`** — Remove
- **`@supabase/ssr` and `@supabase/supabase-js`** — Remove
- **`idb-keyval`** — Query client persistence removed
- **`@tanstack/react-query-persist-client`** — Persistence removed
- **`babel-plugin-react-compiler`** — Not needed (Next.js-specific React Compiler integration)
- **`postgres` (postgres-js)** — Replaced by `@libsql/client`
- **`react-hook-form`** and `@hookform/resolvers` — Replaced by TanStack Form
- **`recharts`** — Replaced by TanStack Charts
- **`zustand`** — Removed (React useState suffices)
- **`next-mdx-remote`** — Replaced by TanStack Markdown
- **Custom `useDebounce` hook** — Not replaced; kept as a simple value-debounce utility. TanStack Pacer debounces functions, not values, making them incompatible patterns.
- **Raw `cmdk` key handling** — Replaced by TanStack Hotkeys
- **`@tanstack/react-query-devtools`** — Replaced by unified TanStack Devtools panel
- **`lucide-react`** — Replaced by `@hugeicons/react`
- **`@radix-ui/*` packages** — Replaced by `@base-ui/react` (via shadcn/react)
- **`proxy.ts`** — Replaced by `apps/web/src/middleware/auth.ts`
- **`biome.json`** — Replaced by `oxlint` + `oxfmt`
- **`components.json`** at root — Replaced by config in `packages/ui/` and `apps/web/`
- **`next.config.ts`** — Not applicable
- **`postcss.config.mjs`** at root — Now in `packages/ui/`
- **`utils/supabase/`** — Entire directory removed
- **`app/actions/`** — Entire directory removed (replaced by tRPC mutations)
- **`app/api/``** — Entire directory removed (replaced by tRPC)
- **`db/queries/`** — Queries moved into tRPC procedures or `packages/db/src/queries/`

### Things to preserve (unchanged logic)

- All database table structures (adapted to SQLite types)
- All Zod validation schemas (from drizzle-zod and API routes)
- All query logic (moved into tRPC procedures)
- All UI component logic and styling
- All business logic for rating calculations, tournament management, etc.
- All Excel export logic (Swiss Manager format)
- All animation components (motion-based)
- All responsive design patterns
- Public assets (favicons, logos, fonts, images)
- Seed data values

---

## References

- [TanStack Start Docs](https://tanstack.com/start/latest)
- [tRPC Docs](https://trpc.io/docs)
- [Better Auth Docs](https://www.better-auth.com/docs)
- [Drizzle ORM SQLite Docs](https://orm.drizzle.team/docs/get-started/sqlite-new)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [Cloudflare R2 Docs](https://developers.cloudflare.com/r2/)
- [shadcn/react Docs](https://ui.shadcn.com/docs)
- [Fumadocs Docs](https://fumadocs.dev/docs)
- [Better-T-Stack Docs](https://www.better-t-stack.dev)
- [Vite+ Docs](https://viteplus.dev)
- [Alchemy Docs](https://alchemy.run)

---

## Porting Audit — Complete

### What's Done

| Category | Status |
|----------|--------|
| DB Schema (31 tables) | Ported |
| Queries (22 → 20 routers) | Ported |
| Components (60+ files) | Ported |
| Routes (15 public + 28 admin) | Ported |
| Auth (Supabase → Better Auth) | Migrated |
| Charts (Recharts → TanStack Charts) | Rewritten |
| Hotkeys (cmdk → @tanstack/react-hotkeys) | Swapped |
| Virtualization (@tanstack/react-virtual) | Implemented |
| Devtools (unified shell + 3 plugins) | Active |
| Icons (Lucide → Hugeicons) | Swapped |
| Markdown (next-mdx-remote → TanStack) | Ported |
| Theme (18 colors, light/dark) | Ported |
| Fumadocs (3 MDX pages) | Populated |
| Hooks (3 files) | Ported |
| Public Assets (13 files) | Copied |
| Seed Script | Ported |

### Architecture Decisions

| Item | Decision |
|------|----------|
| Zustand → TanStack Store | Not needed (removed Zustand, React useState) |
| useDebounce → TanStack Pacer | Kept custom hook (Pacer debounces fns, hook debounces values) |
| TanStack Highlight | Removed (only for code blocks — not used) |
| View Transitions | Implemented via native CSS `::view-transition-old/new` (Chrome/Edge, no React Canary needed) |
| Analytics | Cloudflare Web Analytics beacon added (token placeholder) |
