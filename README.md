# Federação Sergipana de Xadrez

Website of the Sergipe State Chess Federation: news, ratings, player profiles,
tournament results, and an admin dashboard. Production: [fsx.org.br](https://www.fsx.org.br).

**Stack:** TanStack Start, tRPC, Better Auth (GitHub OAuth), Drizzle on
Cloudflare D1, R2 for images, deployed to Cloudflare Workers with
[Alchemy](https://alchemy.run). Docs: Fumadocs on Astro. Package manager: bun.

## Run locally

Requirements: [bun](https://bun.sh) 1.3+ and a GitHub OAuth app (callback
`http://localhost:3001/api/auth/callback/github`).

```bash
bun install
bun run hooks:setup   # Git hooks (lint and format staged files)
```

Environment files (all variables are explained in `apps/web/.env.example`):

| File | Holds |
| ---- | ----- |
| `apps/web/.env.common` | Shared secrets: `BETTER_AUTH_SECRET`, `GITHUB_USER_ID` (the only account that can sign in) |
| `apps/web/.env` | Dev URLs (`BETTER_AUTH_URL` and `CORS_ORIGIN` = `http://localhost:3001`) and the dev GitHub OAuth app (`GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`) |
| `apps/web/.env.prod` | Production only (deploys): production URLs and the production GitHub OAuth app. Not needed locally. |
| `packages/infra/.env` | `ALCHEMY_PASSWORD` (any stable string) |

Generate `BETTER_AUTH_SECRET` with `openssl rand -hex 32`, and find your `GITHUB_USER_ID` at
`https://api.github.com/users/<login>` (`id`). Everything else in `.env.example`
(Cloudflare, Turnstile, analytics, image transformations) is optional locally.

```bash
bun run dev       # web on http://localhost:3001, docs on http://localhost:4000
```

The first `bun run dev` creates the local D1 database and applies the migrations.
Stop it (a running server keeps a stale D1 connection), seed, and start it again:

```bash
bun run db:seed   # sample data (or `bun run db:seed:remote` for a copy of the real data)
bun run dev
```

Then sign in at `http://localhost:3001/login` with the GitHub account whose ID is
`GITHUB_USER_ID`. If the local database gets into a bad state, see `AGENTS.md` →
"Local Dev D1 gotchas".

## Public API

Other websites can read players' data as JSON, with no key and CORS enabled:

| Endpoint | Returns |
| -------- | ------- |
| `GET /api/v1/players` | Every active player: `id`, `name`, `classic`, `rapid`, `blitz` |
| `GET /api/v1/players/{id}` | One player, plus `birthYear`, `club`, and `titles` |
| `GET /api/v1/openapi.json` | The OpenAPI 3.1 description |

Responses are cached for 5 minutes. Reference with a "Send" playground:
**Docs → Reference → API Reference**; contract and limits: **Reference → Public API**.

## Common commands

| Command | Does |
| ------- | ---- |
| `bun run dev` | Start web and docs with a local D1 |
| `bun test` | Unit and D1 integration tests |
| `bun run check-types` / `bun run lint` | Type check / lint |
| `bun run build && bun run test:e2e` | Production build and Playwright tests |
| `bun run db:generate` | Create a migration after editing `packages/db/src/schema` |
| `bun run deploy` | Deploy web, docs, D1, and R2 to Cloudflare (needs `apps/web/.env.prod`) |

## Repository

```
apps/web         Website and admin dashboard (TanStack Start)
apps/fumadocs    Documentation site (Astro + Fumadocs), deployed to DOCS_DOMAIN
packages/api     tRPC routers, public API, OpenAPI document
packages/db      Drizzle schema, migrations, seed
packages/infra   Cloudflare resources (Alchemy)
```

## Documentation

The docs (`apps/fumadocs/content/docs`, in English) cover architecture,
procedures, routes, the database, operations (deploy, backups, incident
response), and decisions. Contributor rules are in `AGENTS.md`.
