# Contributing

Run the repository gates before opening a change:

```sh
bun test
bun run check-types
bun run lint
bun run build
```

Database schema changes must include the generated Drizzle migration. Do not
apply migrations directly to the local Miniflare SQLite file; use the Alchemy
migration tracker. Generated route trees and migrations require source-review
context in the same change.

Keep public API projections small, use typed tRPC errors, and invalidate only
the affected query families after dashboard mutations. Do not add a new cache,
CRUD abstraction, or index without a measured reason.
