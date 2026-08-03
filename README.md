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
| Client State       | [TanStack Store](https://tanstack.com/store)      |
| Charts             | [TanStack Charts](https://tanstack.com/charts)    |
| Virtualization     | [TanStack Virtual](https://tanstack.com/virtual)  |
| Markdown           | [TanStack Markdown](https://tanstack.com/markdown) |
| Hotkeys            | [TanStack Hotkeys](https://tanstack.com/hotkeys)  |
| Timing             | [TanStack Pacer](https://tanstack.com/pacer)      |
| Highlight          | [TanStack Highlight](https://tanstack.com/highlight) |
| Devtools           | [TanStack Devtools](https://tanstack.com/devtools) |
| Linting            | [Oxlint](https://oxc.rs) + [Oxfmt](https://oxc.rs) |
| Package            | [bun](https://bun.sh) (monorepo workspaces)       |
| Deploy             | [Cloudflare Pages](https://pages.cloudflare.com) via [Alchemy](https://alchemy.run) |
| Docs               | [Fumadocs](https://fumadocs.dev) (Astro)          |

## Features

- Public pages: homepage, news, ratings, player profiles, champions, circuits, members
- Admin dashboard: CRUD for players, posts, events, clubs, locations, links, announcements
- Rating update tool with tournament linking
- Swiss Manager Excel export
- Markdown blog posts with syntax highlighting and image upload
- Command palette (CMD+K) with type-safe keyboard shortcuts
- Virtualized scrolling for large player lists and rating tables
- D3-native rating charts with light/dark mode
- Dark mode support
- Animated UI components
- Responsive design
- GitHub OAuth + email/password authentication

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
- A Cloudflare account with D1 and Pages

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
| `DATABASE_URL`         | Local D1 URL (optional, for tooling)    |

### 3. Generate database migration

```bash
bun run db:generate
```

### 4. Start development

```bash
bun run dev
```

Open [http://localhost:3001](http://localhost:3001).

## Available Scripts

| Command              | Description                                  |
| -------------------- | -------------------------------------------- |
| `bun run dev`        | Start all applications in development mode   |
| `bun run build`      | Build all applications                       |
| `bun run deploy`     | Deploy to Cloudflare via Alchemy             |
| `bun run destroy`    | Destroy Cloudflare infrastructure            |
| `bun run dev:web`    | Start only the web application               |
| `bun run db:generate`| Generate Drizzle migration from schema changes |
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

Docs content lives in `apps/fumadocs/content/docs/`.

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

This project deploys to **Cloudflare Pages** via **Alchemy**, which provisions:
- Cloudflare Pages (frontend hosting)
- Cloudflare D1 (SQLite database)
- Cloudflare Workers (optional API workers — not used in this project)

```bash
bun run deploy
```

To tear down all infrastructure:

```bash
bun run destroy
```

## Migration Status

This project is being rewritten from Next.js + Supabase + PostgreSQL.
See [REWRITING.md](./REWRITING.md) for the full migration plan and progress tracking.
