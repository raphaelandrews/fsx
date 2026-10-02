# Federação Sergipana de Xadrez

Website for the Sergipe State Chess Federation — news, ratings, player profiles,
tournament results, and administrative tools. Active since 1989.

Built with [Better-T-Stack](https://github.com/AmanVarshney01/create-better-t-stack).

## Tech Stack

| Category           | Technology                                        |
| ------------------ | ------------------------------------------------- |
| Framework          | [TanStack Start](https://tanstack.com/start)      |
| Router             | [TanStack Router](https://tanstack.com/router)    |
| API                | [tRPC](https://trpc.io)                           |
| Auth               | [Better Auth](https://www.better-auth.com)        |
| Database           | SQLite via [Cloudflare D1](https://developers.cloudflare.com/d1/) |
| ORM                | [Drizzle ORM](https://orm.drizzle.team)           |
| UI                 | [shadcn/react](https://ui.shadcn.com) (base-lyra) |
| Styling            | [TailwindCSS v4](https://tailwindcss.com)         |
| Forms              | [TanStack Form](https://tanstack.com/form)        |
| Data Fetching      | [TanStack React Query](https://tanstack.com/query) |
| Client State       | React useState (Zustand removed)                  |
| Charts             | [TanStack Charts](https://tanstack.com/charts)     |
| Virtualization     | [TanStack Virtual](https://tanstack.com/virtual)  |
| Markdown           | [TanStack Markdown](https://tanstack.com/markdown) |
| Hotkeys            | [TanStack Hotkeys](https://tanstack.com/hotkeys)  |
| Devtools           | [TanStack Devtools](https://tanstack.com/devtools) (unified: Query + Router + Form) |
| Icons              | [Hugeicons](https://hugeicons.com)               |
| Linting            | [Oxlint](https://oxc.rs) + [Oxfmt](https://oxc.rs) |
| Package            | [bun](https://bun.sh) (monorepo workspaces)       |
| Deploy             | [Cloudflare Pages](https://pages.cloudflare.com) via [Alchemy](https://alchemy.run) |
| Docs               | [Fumadocs](https://fumadocs.dev) (Astro)          |

## Features

- Public pages: homepage, news, ratings, player profiles, champions, circuits, members, about, norms, links, announcements
- Admin dashboard: CRUD for players, posts, events, tournaments, championships, clubs, locations, links, circuits, titles, roles, norms, insignias, announcements, tournament podiums, school results
- "Jogos Escolares TV Sergipe" school-tournament leaderboards (`/escolas`): school rankings by points and by medals (Olympic gold→silver→bronze) across 6 age groups × sex × individual/team, with click-to-drilldown
- Rating update tool with Excel import and live player rating computation
- Swiss Manager CSV export for public and admin
- Markdown blog posts with MDX editor
- Command palette (CMD+K) with type-safe keyboard shortcuts
- D3-native rating charts with light/dark mode
- Animated UI components (counting numbers, sliding numbers, motion grids)
- Dark mode support
- Responsive design
- GitHub OAuth authentication
- Static prerendering for instant page loads
- Edge caching via Cloudflare CDN with stale-while-revalidate

## Project Structure

```
fsx/
├── apps/
│   ├── web/              # Main application (TanStack Start + React)
│   │   └── src/
│   │       ├── routes/       # File-based routes (TanStack Router)
│   │       ├── components/   # App-specific components
│   │       ├── lib/          # Client utilities (auth client, etc.)
│   │       ├── middleware/   # Route middleware (auth guard)
│   │       └── utils/        # tRPC client setup
│   └── fumadocs/         # Documentation site (Astro + Fumadocs)
│       └── content/docs/ # MDX documentation pages
├── packages/
│   ├── api/              # tRPC API — routers and procedures
│   ├── auth/             # Better Auth configuration
│   ├── db/               # Drizzle ORM schema and migrations
│   ├── env/              # Environment variable validation
│   ├── infra/            # Cloudflare infrastructure (Alchemy)
│   ├── ui/               # Shared shadcn/react components and styles
│   └── config/           # Shared TypeScript configs
├── source-project/       # Legacy Next.js project (migration source)
├── REWRITING.md          # Migration plan and best practices
└── README.md
```

## Getting Started

### Prerequisites

- [bun](https://bun.sh) >= 1.3
- A Cloudflare account with Workers, D1, and R2

### 1. Install dependencies

```bash
bun install
```

### 2. Environment variables

Copy from the example and fill in your credentials:

```bash
cp apps/web/.env.example apps/web/.env
```

| Variable               | Description                             |
| ---------------------- | --------------------------------------- |
| `BETTER_AUTH_SECRET`   | Auth secret (generate with `openssl rand -hex 32`) |
| `BETTER_AUTH_URL`      | Auth base URL (e.g. `http://localhost:3001`) |
| `CORS_ORIGIN`          | Allowed CORS origin (same as auth URL)  |
| `GITHUB_CLIENT_ID`     | GitHub OAuth app client ID              |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth app client secret          |
| `GITHUB_USER_ID`       | Numeric GitHub account ID of the owner; only this account can sign in or administer (recommended) |
| `GITHUB_USERNAME`      | Legacy fallback when `GITHUB_USER_ID` is empty: pre-lock signups to this login (empty = first-signup-wins) |
| `DISABLE_SIGNUP`       | Hard-disable new signups; set `true` after your account exists (optional) |
| `CLOUDFLARE_ACCOUNT_ID`| Cloudflare account ID (Alchemy deploys, Wrangler backups) |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token (Alchemy deploys, Wrangler backups) |
| `CLOUDFLARE_ZONE_ID`   | Zone ID of `fsx.org.br` (optional; dashboard cache purge) |
| `CLOUDFLARE_CACHE_PURGE_TOKEN` | Token with Zone → Cache Purge (optional; dashboard cache purge) |
| `VITE_CLOUDFLARE_ANALYTICS_TOKEN` | Cloudflare Web Analytics site token, read at build time (optional; empty disables the beacon) |
| `ALCHEMY_PASSWORD`     | In `packages/infra/.env`; encrypts secrets in Alchemy state (keep stable) |

### 3. Generate database migration

```bash
bun run db:generate
```

### 4. Seed the database

For local development with sample data:

```bash
bun run db:seed
```

> **Note:** stop `alchemy dev` before running `db:seed` (`pkill -f alchemy.run.ts`) —
> a running dev server keeps a stale in-memory D1 connection and won't see the seeded data.

### 5. Start development

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001).

## Caching Strategy

Public tRPC GETs are cached per Cloudflare data center for 30–300 seconds
(`packages/api/src/cache-policy.ts`); authenticated requests bypass it, and
browsers receive `no-store` because React Query is the client cache. Pages are
server-rendered per request, except `/sobre` and `/normas-tecnicas`, which are
prerendered. Details: `apps/fumadocs/content/docs/architecture/rendering-and-caching.mdx`.

## Available Scripts

| Command              | Description                                  |
| -------------------- | -------------------------------------------- |
| `bun run dev`        | Start all applications in development mode   |
| `bun run build`      | Build all applications                       |
| `bun run deploy`     | Deploy to Cloudflare via Alchemy             |
| `bun run destroy`    | Destroy Cloudflare infrastructure            |
| `bun run dev:web`    | Start only the web application               |
| `bun run db:generate`| Generate Drizzle migration from schema changes |
| `bun run db:seed`    | Seed the local DB with sample data            |
| `bun run check-types`| TypeScript type checking across all packages |
| `bun run check`      | Lint + format check                          |
| `bun run lint`       | Lint check only                              |
| `bun run format`     | Format all files                             |
| `bun run hooks:setup`| Install native Git hooks                     |

### Fumadocs (documentation)

```bash
bun run --filter fumadocs dev
```

Opens the documentation site at [http://localhost:4000](http://localhost:4000).

Docs content lives in `apps/fumadocs/content/docs/`, in English, grouped by
audience: `guide/`, `architecture/`, `reference/`, `operations/`, and `decisions/`.

## Adding UI Components

Install shared shadcn/react components:

```bash
npx shadcn@latest add dialog popover sheet table -c packages/ui
```

Import in any app:

```tsx
import { Button } from "@fsx/ui/components/button";
```

For app-specific components (not shared), use the web app config:

```bash
npx shadcn@latest add some-block -c apps/web
```

## Deployment

This project deploys to **Cloudflare Workers** via **Alchemy**, which provisions
the web Worker, the D1 database, the R2 image bucket, the read rate limiter, and
the rate-limit cleanup cron Worker:

```bash
bun run deploy
```

The deploy runs a smoke test afterwards. Rollback and recovery steps are in
`apps/fumadocs/content/docs/operations/incident-response.mdx`.

To tear down all infrastructure:

```bash
bun run destroy
```

## Migration Status

This project was migrated from Next.js + Supabase + PostgreSQL. The old codebase
is preserved at `source-project/` for reference.
See [REWRITING.md](./REWRITING.md) for architecture decisions and best practices.
