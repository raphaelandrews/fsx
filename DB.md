# Database Migration Guide: PostgreSQL (Supabase) → SQLite (D1)

## Automatic Type Mappings

These conversions are handled by the ORM (Drizzle) and require no manual data transformation:

| PostgreSQL                     | SQLite/D1                           |
|-------------------------------|-------------------------------------|
| `serial`                      | `integer` + `AUTOINCREMENT`         |
| `varchar(n)`                  | `text`                              |
| `smallint`                    | `integer`                           |
| `boolean`                     | `integer` (mode: `"boolean"`)        |
| `timestamp` / `timestamp tz`  | `text` (ISO 8601)                   |
| `date`                        | `text`                              |
| `text`                        | `text` (unchanged)                  |
| `pgEnum("name", [...])`      | `text` (Zod validates at app layer)  |

---

## Field Name Standardization (Renames)

The target schema standardizes column names. Apply these renames during migration:

| Table              | Old column (PG)   | New column (SQLite/D1) | Notes                                     |
|--------------------|-------------------|------------------------|-------------------------------------------|
| `roles`            | `role`            | `name`                 | entity-name column                        |
| `roles`            | `short_role`      | `short_name`           | abbreviation                              |
| `titles`           | `title`           | `name`                 | entity-name column                        |
| `titles`           | `short_title`     | `short_name`           | abbreviation                              |
| `insignias`        | `insignia`        | `name`                 | entity-name column                        |
| `norms`            | `norm`            | `name`                 | entity-name column                        |
| `posts`            | `image`           | `image_url`            | standardize URL fields                    |
| `players`          | `birth`           | `birth_date`           | match `start_date` / `end_date`           |
| `cups`             | `rhythm`          | `rating_type`          | match `tournaments.rating_type`           |
| `circuit_podiums`  | `place`           | `place`                | type change: `text` → `integer`           |
| `clubs`            | `logo`            | `logo_url`             | standardize URL fields                    |
| `locations`        | `flag`            | `flag_url`             | standardize URL fields                    |
| `links`            | `order`           | `sort_order`           | avoid SQL reserved word, more descriptive |
| `cup_groups`       | `order`           | `sort_order`           | same as above                             |
| `cup_rounds`       | `order`           | `sort_order`           | same as above                             |
| `cup_playoffs`     | `order`           | `sort_order`           | same as above                             |
| `cup_matches`      | `order`           | `sort_order`           | same as above                             |
| `circuit_phases`   | `order`           | `sort_order`           | same as above                             |
| `announcements`    | `number`          | `number`               | type change: `text` → `integer`           |

### Naming conventions applied

- Entity display-name columns are always `name`; abbreviated forms use `short_name`.
- Image/URL columns use the `*_url` suffix (`image_url`, `logo_url`, `flag_url`).
- Date columns use the `*_date` suffix (`birth_date`, `start_date`, `end_date`).
- Ordering columns are `sort_order` (never the reserved word `order`).
- Boolean columns intentionally have **no** `is` prefix (`active`, `verified`, `published`).
- `posts.title` is kept as `title` (content entity, idiomatic for articles).
- `auth.*` tables keep Better Auth's own column names (library-owned schema).
- Every domain table's `updated_at` auto-updates on writes (`$onUpdate`), in addition to the `CURRENT_TIMESTAMP` default.

---

## Data Transformations Required

### 1. `players.sex` — Boolean to Text

**Old**: `boolean` (`false` = male, `true` = female)  
**New**: `text` (`"male"` | `"female"`)

```sql
-- Migration transform:
UPDATE players SET sex = 'male'   WHERE sex = false;
UPDATE players SET sex = 'female' WHERE sex = true;
```

Export/import: map `false` → `"male"`, `true` → `"female"`.

---

### 2. `posts.id` — Text UUID to Integer Autoincrement

**Old**: `text` (UUID, e.g. `"a1b2c3d4-..."`)  
**New**: `integer` + `AUTOINCREMENT`

The posts table must be imported without explicit IDs; SQLite will assign new autoincrement IDs.  
**Warning**: any tables/foreign keys referencing `posts.id` (there are none — posts has no child tables) are unaffected.

If preserving UUIDs is critical for external links (e.g. shared URLs that use `/noticias/{slug}`), slugs remain unique so URLs still work. Only internal DB references change.

---

### 3. `announcements.content` — Unique Constraint Removed

**Old**: `content` had `.unique()` constraint.  
**New**: `content` is plain `text`, no unique constraint. The `year_number` composite unique index on `(year, number)` is the actual uniqueness rule.

No data changes needed — the constraint is simply dropped.

---

### 4. `cupPlayers.nickname` — Unique Constraint Removed

**Old**: `nickname` had `.unique()` (nicknames globally unique across all cups).  
**New**: `nickname` is plain `text`, no unique constraint. Two players in different cup groups can share the same nickname.

No data changes needed. If duplicate nicknames existed in the old DB (they shouldn't because of the constraint), no action required.

---

## New Columns (All Tables)

Every table has new `createdAt` and `updatedAt` columns:

```
createdAt  TEXT  DEFAULT CURRENT_TIMESTAMP
updatedAt  TEXT  DEFAULT CURRENT_TIMESTAMP
```

**Previously only `players` and `posts` had these.**  
All other tables gained them, **including all junction tables** (`players_to_titles`, `players_to_roles`, `players_to_norms`, `players_to_insignias`, `players_to_tournaments`, `defending_champions`).

Migration script should backfill:
```sql
UPDATE {table} SET created_at = '2024-01-01T00:00:00Z', updated_at = '2024-01-01T00:00:00Z';
```

Or use the current timestamp as a reasonable default for existing rows.

---

## Cascade Delete Rules Added

Foreign keys now cascade on delete for these relationships:

| Parent deleted → | Children deleted                 |
|-----------------|----------------------------------|
| `players`       | `players_to_roles`, `players_to_titles`, `players_to_tournaments`, `players_to_norms`, `players_to_insignias`, `circuit_podiums`, `defending_champions`, `tournament_podiums`, `cup_players` |
| `insignias`     | `players_to_insignias`           |
| `norms`         | `players_to_norms`               |
| `roles`         | `players_to_roles`               |
| `titles`        | `players_to_titles`              |
| `tournaments`   | `players_to_tournaments`, `tournament_podiums` |
| `championships` | `defending_champions`            |
| `circuits`      | `circuit_phases`                 |
| `circuit_phases`| `circuit_podiums`                |
| `link_groups`   | `links`                          |
| `cups`          | `cup_brackets`, `cup_groups`     |
| `cup_brackets`  | `cup_playoffs`                   |
| `cup_groups`    | `cup_players`, `cup_rounds`      |
| `cup_rounds`    | `cup_matches`                    |
| `cup_playoffs`  | `cup_matches`                    |
| `cup_matches`   | `cup_games`                      |

**No data changes needed** — these only affect future deletes.

---

## Unique Constraints Added

| Table    | Column(s)                          |
|----------|------------------------------------|
| `players`| `cbx_id` (new), `fide_id` (new)    |

**Before import**: check for duplicate `cbx_id` or `fide_id` values in the old data. Remove duplicates or set them to NULL for non-official players.

---

## New Performance Indexes

| Index Name                              | Table              | Columns                       |
|-----------------------------------------|--------------------|-------------------------------|
| `players_active_idx`                    | `players`          | `active`                      |
| `players_sex_idx`                       | `players`          | `sex`                         |
| `players_club_idx`                      | `players`          | `club_id`                     |
| `players_location_idx`                  | `players`          | `location_id`                  |
| `events_start_date_idx`                 | `events`           | `start_date`                  |
| `circuit_phases_circuit_sort_order_idx` | `circuit_phases`   | `circuit_id`, `sort_order`      |
| `cup_games_match_game_idx`             | `cup_games`        | `cup_match_id`, `game_number`  |
| `tournament_podiums_tournament_place_idx`| `tournament_podiums` | `tournament_id`, `place`    |

---

## Enum Values → Text Columns

PostgreSQL enums are now plain `text` columns with Zod validation at the application layer. The allowed values remain unchanged:

| Old Enum              | Valid Values (new: app-enforced)                                               |
|-----------------------|---------------------------------------------------------------------------------|
| `rating_type`         | `"blitz"`, `"rapid"`, `"classic"`                                              |
| `event_type`          | `"open"`, `"closed"`, `"school"`                                               |
| `event_time_control`  | `"standard"`, `"rapid"`, `"blitz"`, `"bullet"`                                 |
| `location_type`       | `"city"`, `"state"`, `"country"`                                               |
| `circuit_type`        | `"default"`, `"categories"`, `"school"`                                        |
| `circuit_category`    | `"Sub 8 Masculino"`, `"Sub 10 Masculino"`, `"Sub 12 Masculino"`, `"Sub 14 Masculino"`, `"Sub 16 Masculino"`, `"Sub 18 Masculino"`, `"Sub 8 Feminino"`, `"Sub 10 Feminino"`, `"Sub 12 Feminino"`, `"Sub 14 Feminino"`, `"Sub 16 Feminino"`, `"Sub 18 Feminino"`, `"Futuro"`, `"Juvenil"`, `"Master"` |
| `circuit_place`       | `1` through `25` — now an **`integer`** (was `text`)                           |
| `bracket_type`        | `"UB"`, `"LB"`, `"GF"`                                                         |
| `phase_type`          | `"Oitavas Chave Superior"`, `"Quartas Chave Superior"`, `"Semis Chave Superior"`, `"Final Chave Superior"`, `"Grande Final"`, `"Chave Inferior Round 1"`, `"Chave Inferior Round 2"`, `"Chave Inferior Round 3"`, `"Chave Inferior Round 4"`, `"Quartas Chave Inferior"`, `"Semis Chave Inferior"`, `"Final Chave Inferior"` |
| `role_type`           | `"management"`, `"referee"`, `"teacher"`                                        |
| `title_type`          | `"internal"`, `"external"`                                                     |

`cups.rating_type` (formerly `cups.rhythm`) uses the same `rating_type` values as `tournaments.rating_type`.

---

## Import Order

Tables must be imported in this order due to foreign key dependencies:

```
1. locations
2. clubs
3. championships
4. players          (→ clubs, locations)
5. roles
6. titles
7. norms
8. insignias
9. link_groups
10. links            (→ link_groups)
11. events
12. tournaments      (→ championships)
13. circuits
14. posts
15. announcements

--- Junction tables (order matters for FKs) ---
16. players_to_roles        (→ players, roles)
17. players_to_titles       (→ players, titles)
18. players_to_norms        (→ players, norms)
19. players_to_insignias    (→ players, insignias)
20. players_to_tournaments  (→ players, tournaments)
21. tournament_podiums      (→ players, tournaments)
22. defending_champions     (→ players, championships)
23. circuit_phases          (→ circuits, clubs, tournaments)
24. circuit_podiums         (→ players, circuit_phases)
25. cups                    (→ championships)
26. cup_brackets            (→ cups)
27. cup_groups              (→ cups)
28. cup_players             (→ players, cup_groups)
29. cup_rounds              (→ cup_groups)
30. cup_playoffs            (→ cup_brackets)
31. cup_matches             (→ players, cup_rounds, cup_playoffs)
32. cup_games               (→ players, cup_matches)
```

---

## Drizzle Migration Generation

After the schema is defined, generate the initial migration:

```bash
bun run db:generate
```

This produces SQL migration files under `packages/db/drizzle/`. Run them against the D1 database (via `wrangler` or Alchemy) before starting the app.
