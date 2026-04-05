# Federação Sergipana de Xadrez

This project is built with [Next.js](https://nextjs.org), [Drizzle](https://orm.drizzle.team/docs/get-started) and [Supabase](https://supabase.com/).

It's built to post news, display rating tables, showcase champions, manage documents, and, most importantly, provide fast rating updates.

## Getting Started

### 1. Environment variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection string (from Supabase → Project Settings → Database) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `NEXT_PUBLIC_APP_URL` | Base URL of the app (e.g. `http://localhost:3000`) |
| `NEXT_PUBLIC_API_URL` | API base URL (e.g. `http://localhost:3000/api`) |

### 2. Install dependencies

```bash
bun install
```

### 3. Run database migrations

```bash
bun db:generate
bun db:migrate
```

> Use `bun db:push` to push schema changes directly without generating migration files (useful during development).

### 4. Seed the database

```bash
bun db:seed
```

This inserts initial data for locations, clubs, roles, titles, and players.

### 5. Start the development server

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Database scripts

| Command | Description |
|---|---|
| `bun db:generate` | Generate migration files from schema changes |
| `bun db:migrate` | Run pending migrations |
| `bun db:push` | Push schema directly to the database |
| `bun db:pull` | Pull schema from the database |
| `bun db:studio` | Open Drizzle Studio to browse data |
| `bun db:seed` | Seed the database with initial data |

# 🏝️

Built by [Andrews](https://andrews.sh/)
