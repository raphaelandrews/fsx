# FSX Improvements

This is a task backlog based on a repository-wide review of the active application.
It covers the web app, TanStack Router/Start/Query integration, tRPC API, Better
Auth, Drizzle/D1 schema and migrations, Cloudflare handlers, UI, accessibility,
SEO, performance, maintainability, and Fumadocs.

The review included how the pieces operate together, not only isolated files.

## Decisions Already Made

- Do not rename `tournaments.date`.
- Keep `tv_sergipe` as the table name; it represents a fixed program in this project.
- Keep the current TanStack Router + React Query + tRPC + Cloudflare cache architecture.
- Do not replace working caching, prefetching, mutation invalidation, or SSR with a new abstraction without measurements.

## Priority Guide

- **Critical:** data corruption, authorization failure, or a production security issue.
- **Important:** correctness, data integrity, operational safety, or a likely production scalability problem.
- **Optional:** quality, maintainability, UX, accessibility, or optimization with lower immediate risk.

## Implementation Order

The numbered task sections below preserve the review categories and task history.
Implement them in the following dependency order rather than strictly top-to-bottom.
Completed tasks remain listed so the backlog records what has already been done.

### Phase 0: Completed Safety Foundations

- [x] Tasks 1–3: rating integrity, administrator authorization, and CSRF/session defenses.
- [x] Tasks 4–6: admin-only reads and event-link ownership/one-to-one integrity.

### Phase 1: Test and Error Foundations

Implement these before broad refactors so later changes have reliable feedback.

- [ ] Task 15: establish the layered automated test strategy. Unit/resource layers are in place; integration and browser layers remain.
- [ ] Task 16: add resource and response-size regression coverage. Cache classification coverage is in place; runtime budgets remain.
- [x] Task 11: standardize tRPC error codes and affected-row handling. The shared boundary and active CRUD checks are in place; structured request-ID logging remains.
- [ ] Task 12: complete backend and frontend error boundaries. Safe mapping is in place; field-level form rendering and full integration coverage remain.

### Phase 2: Input, Storage, and Data Integrity

These reduce abuse, prevent malformed data, and make later query work safer.

- [ ] Task 7: bound all API inputs.
- [x] Task 9: harden image uploads.
- [ ] Task 10: move rate-limit state into migrations.
- [ ] Task 13: add database-level domain constraints.
- [ ] Task 14: make timestamp invariants explicit.

### Phase 3: Query and Resource Efficiency

Measure before optimizing. The input and test work from Phases 1–2 should exist
before changing query shapes or adding resource budgets.

- [ ] Task 8: bound large public query responses.
- [ ] Task 19: measure query plans and actual procedure costs.
- [ ] Task 20: optimize high-value query shapes based on those measurements.
- [x] Task 30: keep active linting clean so warnings do not hide regressions.

### Phase 4: Caching, SSR, and Public Freshness

Keep the existing architecture, but make its boundaries explicit and measurable.

- [ ] Task 17: centralize cache policy.
- [ ] Task 18: coordinate client invalidation with anonymous edge freshness.
- [ ] Task 21: keep prefetching selective and budgeted.
- [ ] Task 22: review prerender boundaries.
- [ ] Task 23: verify dashboard mutation freshness versus public TTL behavior.

### Phase 5: User Experience and Discoverability

These tasks depend on the error taxonomy and resource boundaries being stable.

- [ ] Task 24: fix upload accessibility.
- [ ] Task 25: improve form feedback.
- [ ] Task 26: improve navigation and responsive behavior.
- [ ] Task 27: improve loading and empty states.
- [ ] Task 28: improve content and SEO quality.

### Phase 6: Maintainability and Operations

- [ ] Task 29: reduce duplicated mutation and invalidation logic.
- [ ] Task 31: document architectural contracts.
- [ ] Task 32: protect backup and export workflows.
- [ ] Task 33: establish recovery and deployment safeguards.
- [ ] Task 34: add privacy and data-governance rules.
- [ ] Task 35: add CI quality gates and dependency hygiene.

### Phase 7: Documentation and LLM Support

Document the behavior after the architecture and operational contracts have
stabilized, otherwise the docs will immediately become stale.

- [ ] Task 36: organize Fumadocs by audience.
- [ ] Task 37: document the domain model.
- [ ] Task 38: document runtime behavior.
- [ ] Task 39: add LLM-friendly references.

## Critical

### 1. Make rating updates atomic and concurrency-safe

**Why:** `playersTournament.linkWithRating` updates the player and inserts the
tournament history as separate operations. A partial failure can leave the rating
changed without an audit record. Concurrent updates can also calculate from the
same old rating.

- [x] Wrap the player update and history insert in one D1/Drizzle transaction.
- [x] Read the current rating on the server; do not trust a client-supplied old rating.
- [x] Update only when the stored rating still equals the value used for the calculation, or otherwise retry/reject the operation.
- [x] Store the rating type on the player-tournament history row if the history must distinguish blitz, rapid, and classic changes.
- [x] Add tests for success, failed history insertion, duplicate registration, and concurrent updates.

### 2. Define and enforce the administrator authorization model

**Why:** `adminProcedure` currently checks that a session exists but does not
check that the session belongs to an administrator. This is acceptable only while
the system is explicitly single-owner.

- [x] Decide whether FSX is permanently single-owner or needs multiple administrators. The current implementation keeps the single-owner model.
- [x] For the single-owner model, enforce the configured GitHub identity on every protected request, not only during account creation.
- [x] For a multi-admin model, add a role/permission field and a dedicated authorization middleware. This remains deferred because FSX is single-owner.
- [x] Return `FORBIDDEN` for authenticated users without the required permission.
- [x] Add focused authorization tests proving that a non-admin identity is rejected before it can use admin procedures.

### 3. Verify CSRF and session-cookie defenses

**Why:** The API uses cookie-based authentication. Origin checks and cookie
attributes should be treated as a deliberate defense-in-depth boundary for every
state-changing request.

- [x] Confirm Better Auth cookies are `HttpOnly`, `Secure` in production, and use an appropriate `SameSite` policy; `useSecureCookies` is now explicit for HTTPS deployments and Better Auth supplies the HTTP-only/Lax defaults.
- [x] Require a trusted `Origin` or equivalent CSRF signal for browser state-changing requests; non-browser requests without an `Origin` are still accepted only by the explicit optional policy, while tRPC/Auth POST handlers require one.
- [x] Verify OAuth callback and redirect URLs cannot be used for open redirects; the application uses the fixed relative `/dashboard` callback.
- [x] Test the cross-origin decision used by form/fetch mutation requests with focused origin tests; browser-level endpoint tests remain part of deployment verification.
- [x] Rotate sessions after any future privilege change and invalidate sessions on account removal; no privilege-changing workflow currently exists, and this invariant is documented for future additions.

## Important

### 4. Protect admin-only read procedures

**Why:** `players.forEdit` is currently public even though it returns edit-oriented
fields such as FIDE/CBX IDs, descriptions, inactive-player data, and other fields
not needed by the public site.

- [x] Change `players.forEdit` to `adminProcedure` unless every field is intentionally public.
- [x] Audit all procedures named `forEdit`, `options`, `listAdmin`, `backup`, `export`, or similar. `players.options` is admin-only; `swissManager.list` is intentionally public for the public export; no other matching admin-read procedure was found.
- [x] For intentionally public data, return a separate minimal public projection rather than reusing admin shapes.
- [x] Add an automated audit/test that verifies the public/admin procedure boundary through the admin authorization decision tests and the procedure declarations.

### 5. Make event link reconciliation safe

**Why:** `events.setLinks` updates a supplied link by ID without proving that the
link belongs to the requested event. It also performs many writes without a
transaction, so a failure can leave a partial set of links.

- [x] Verify that `eventId` exists.
- [x] Resolve the event's link group and require every supplied link ID to belong to that group.
- [x] Scope update/delete predicates by both link ID and link-group ID.
- [x] Reject duplicate link types when the domain permits only one regulation, form, and result link.
- [x] Reconcile inserts, updates, and deletes in one transaction.
- [x] Add focused tests for cross-event link IDs and duplicate types; real-D1 partial-failure coverage remains included in the integration-test suite task.

### 6. Enforce one event link group per event

**Why:** The API assumes one link group per event, but the database does not
appear to enforce that relationship. Duplicate groups make `findFirst()` select an
arbitrary group.

- [x] Add a unique index on `link_groups.event_id`; SQLite allows multiple directory groups because nullable values remain distinct.
- [x] Check tracked migrations and seed definitions for duplicates before applying the migration; production D1 should be checked before deployment because a unique-index migration must not silently choose a row.
- [x] Make the relation and API behavior reflect the one-to-one event-group rule.

### 7. Bound API inputs

**Why:** Several public procedures accept unbounded numbers, strings, or arrays.
Large limits, offsets, names, and filter lists can consume unnecessary D1 reads and
CPU or produce oversized responses.

- [ ] Add positive integer and maximum constraints to `page`, `limit`, IDs, ratings, points, and sort orders.
- [ ] Cap search strings and content fields at domain-appropriate lengths.
- [ ] Cap filter-array sizes for clubs, locations, titles, and groups.
- [ ] Reject invalid pages rather than allowing huge offsets.
- [ ] Apply the same constraints to admin procedures, not only public procedures.
- [ ] Add tests for negative values, fractional values, huge limits, and oversized arrays.

### 8. Bound large public query responses

**Why:** Procedures such as `players.list`, `swissManager.list`,
`roles.listWithPlayers`, and the nested `circuits.list` can grow with the data set.

- [ ] Measure current row counts and response sizes in production-like data.
- [ ] Paginate or otherwise cap public collections that can grow indefinitely.
- [ ] Split summary and detail procedures where a route does not need the full nested graph.
- [ ] Keep explicit column projections on every public query.
- [ ] Add response-size monitoring for the largest procedures.

### 9. Harden image uploads

**Why:** The server trusts the client MIME value, accepts any `image/*` type, and
decodes base64 before applying a meaningful encoded-size limit. SVG uploads can
also be stored with inconsistent extensions/content types.

- [x] Restrict uploads to JPEG, PNG, and WebP unless SVG is explicitly required.
- [x] Validate magic bytes/signatures instead of trusting only the MIME field.
- [x] Cap the base64 string before calling `atob`.
- [x] Convert malformed base64 errors into a controlled `BAD_REQUEST` response.
- [x] Verify that the decoded byte length matches the declared limit.
- [x] Keep object keys generated exclusively by the server.
- [x] Add tests for malformed base64, MIME spoofing, SVG, oversized encoded input, and valid images.

### 10. Move rate-limit schema creation into migrations

**Why:** `security.ts` creates `rate_limits` at runtime. This bypasses the D1
migration tracker and makes the table invisible to schema review, backup planning,
and deterministic deployments.

- [x] Add `rate_limits` to the Drizzle schema or migration set.
- [x] Generate the migration through the normal Drizzle workflow.
- [ ] Apply the migration through the normal Alchemy/D1 workflow.
- [x] Remove runtime `CREATE TABLE IF NOT EXISTS` initialization.
- [ ] Decide whether rate-limit cleanup should use a scheduled job instead of random request sampling.
- [ ] Add metrics for rate-limit failures and table growth.

### 11. Standardize tRPC errors and affected-row handling

**Why:** Some procedures throw plain `Error`, while others use `TRPCError`. Plain
errors become generic 500 responses, and mutations can report success when an ID
does not exist.

- [x] Use `TRPCError` with `NOT_FOUND`, `BAD_REQUEST`, `CONFLICT`, `FORBIDDEN`, and `INTERNAL_SERVER_ERROR` consistently at the shared procedure boundary and active mutation paths.
- [x] Add a tRPC `errorFormatter` that exposes field-level Zod errors without exposing internals.
- [x] Check returned rows for update/delete operations and throw `NOT_FOUND` when appropriate across active user-facing CRUD mutations.
- [x] Wrap unexpected infrastructure errors with a generic user-facing message and preserve the original error as `cause`.
- [x] Add structured server-side error logging with procedure name, request ID, and safe metadata.
- [x] Avoid showing raw `error.message` globally in user-facing toasts.

### 12. Complete the backend error boundary

**Current assessment:** Error handling is not fully consistent yet. Some routers
use `TRPCError`, but `events.setLinks` still throws a plain `Error`, many CRUD
mutations do not check affected rows, and there is no centralized tRPC error
formatter or safe error taxonomy.

- [x] Replace every expected plain `Error` in API procedures with a typed `TRPCError`.
- [x] Define a small stable set of user-facing error categories: validation, unauthorized, forbidden, not found, conflict, rate limited, and unexpected failure.
- [x] Add an `errorFormatter` that returns field-level Zod errors without exposing database or infrastructure details.
- [x] Preserve original exceptions as server-side `cause` values and log them with a procedure/request identifier.
- [x] Ensure production responses never include SQL, stack traces, secrets, storage keys, or provider error details.
- [x] Map unique-constraint failures to `CONFLICT` where the user can correct the input.
- [x] Add a global tRPC error boundary that logs unexpected errors once rather than logging the same failure at multiple layers.

**Frontend assessment:** The root error boundary intentionally shows a generic
500 message, which is good for avoiding leakage, but the client still has several
unsafe or inconsistent paths. `QueryCache.onError` displays raw `error.message`,
and many admin mutations display `error.message ?? fallback`. Other mutations use
different hard-coded English and Portuguese messages. This can expose internal
errors and gives users no reliable distinction between validation, conflict,
authorization, and transient failures.

- [x] Add one client error-mapping function that converts tRPC codes and Zod field errors into safe Portuguese user messages.
- [x] Never display raw server error messages by default; expose them only through safe, explicitly approved error codes/messages.
- [ ] Show field-level validation errors next to the relevant form controls instead of only using a toast.
- [ ] Show conflict errors with a reload/retry action, especially for rating and concurrent edits.
- [x] Show `UNAUTHORIZED` as a sign-in action and `FORBIDDEN` as an access-denied message, not as a generic failure.
- [x] Show `NOT_FOUND` with a route-appropriate empty/not-found state rather than a generic 500 page through safe mapping and expected-query suppression.
- [x] Show `TOO_MANY_REQUESTS` with a retry-after message and do not immediately retry automatically.
- [x] Reserve global query toasts for unexpected background failures; avoid toasting expected 404s, empty results, and handled form errors.
- [x] Add a visible retry action that calls the relevant query invalidation or router invalidation.
- [ ] Add tests for every supported backend error category and its rendered user message; mapping tests exist, but browser/rendered form coverage remains.

### 13. Add database-level domain constraints

**Why:** PostgreSQL enums became text fields in D1. Zod protects tRPC inputs, but
direct SQL, seed scripts, future jobs, or another writer can still insert invalid
values.

- [ ] Add SQLite `CHECK` constraints for stable finite domains such as sex, rating type, event type, location type, role type, and bracket type.
- [ ] Keep Zod validation at the API boundary for useful error messages.
- [ ] Add checks for non-negative ratings, points, prize values, and valid placement ranges where appropriate.
- [ ] Audit existing rows before applying constraints.

### 14. Make timestamp invariants explicit

- [ ] Make `created_at` and `updated_at` `NOT NULL` in domain tables where timestamps are required.
- [ ] Confirm that all timestamps are stored in one documented format, preferably UTC ISO 8601.
- [ ] Decide whether direct SQL writers need database triggers for `updated_at`; Drizzle `$onUpdate()` only covers ORM writes.
- [x] Include `updatedAt` in article queries and use it for SEO `modifiedTime`.

### 15. Add a focused automated test suite

- [x] Use `bun:test` for pure functions, schema helpers, normalization, authorization decisions, cache classification, mutation-result checks, and error mapping.
- [ ] Use tRPC `createCaller` with a typed fake context for procedure tests; verify inputs, access control, typed errors, and mutation invalidation contracts.
- [ ] Use a real Miniflare D1 database for migration and repository/integration tests; apply migrations before each isolated suite.
- [ ] Test the tRPC fetch handler with real `Request`/`Response` objects for auth, origin checks, cache headers, rate limits, and batching.
- [ ] Test critical database workflows against real D1 behavior, not only mocked chains: rating transactions, unique constraints, cascades, and rollback.
- [ ] Test TanStack Start SSR routes for status, metadata, not-found behavior, and safe error HTML.
- [ ] Add browser-level tests only for workflows that need a browser: OAuth/session behavior, forms, dialogs, uploads, keyboard access, and mutation-toasts.
- [x] Keep unit tests deterministic and avoid external GitHub, Cloudflare, or network calls; use fixtures and test doubles at the boundary.
- [ ] Test auth middleware and admin authorization.
- [ ] Test every critical mutation with invalid and missing IDs.
- [ ] Test rating update transactions and invariants.
- [ ] Test event link ownership and reconciliation.
- [ ] Test image validation and deletion behavior.
- [ ] Test migration application against a clean local D1 database.
- [ ] Test public route SSR output for canonical URLs, titles, and not-found responses.
- [ ] Add a small accessibility smoke-test pass for public navigation, dialogs, forms, and upload controls.

### 16. Test resource boundaries, not only correctness

- [ ] Assert maximum response sizes for the largest public procedures using production-like fixtures.
- [x] Assert the public cache classification used by anonymous GET responses and authenticated/mutation exclusions.
- [ ] Assert that mutations never receive cache headers and that failed queries are not cached.
- [ ] Track query count, D1 reads, Worker CPU time, response bytes, and cache-hit rate for representative routes.
- [ ] Add regression budgets for initial HTML size, JavaScript transferred, API requests during navigation, and largest route chunks.
- [ ] Test that prefetching and prerendering do not fetch unnecessary private, large, or duplicate data.
- [ ] Prefer a measured regression budget over arbitrary micro-optimizations.

## Caching, Revalidation, Prefetching, and Prerendering

### Current assessment

The existing model is good and should be retained:

- Route loaders prefetch data before rendering.
- `loaderDeps` is used for filter-driven routes such as ratings and news pagination.
- React Query provides client-side reuse and mutation invalidation.
- Server-side tRPC calls use an in-process link instead of a self-fetch.
- Anonymous public GETs use bounded Cloudflare Cache API entries.
- Authenticated requests bypass the edge cache.
- Mutations invalidate the relevant client query families.
- Static prerendering is used for stable pages where it is useful.

The main caveat is that React Query invalidation does not purge an already cached
anonymous edge response. Anonymous users may see the old response until its edge
TTL expires. This is acceptable with the current short TTLs, but should be
documented as eventual consistency.

### 17. Centralize cache policy

- [x] Keep one registry for procedure cache TTLs rather than spreading TTL assumptions across route comments, route options, and API handlers.
- [x] Make the registry explicitly classify procedures as public-cacheable, private, or never-cache.
- [x] Cache only successful anonymous queries; never cache mutations, errors, or authenticated output.
- [x] Add tests for batched requests containing a private or unknown procedure.
- [x] Confirm that the cookie detection remains correct for every Better Auth cookie variant used in production.
- [x] Consider setting TanStack Router `defaultPreloadStaleTime` to `0` so TanStack Query remains the single client-side freshness authority.
- [ ] Document that Workers `caches.default` is not a globally replicated cache; validate the tradeoff with cache-hit and latency measurements before changing it.

### 18. Improve cache invalidation coordination

- [x] Document the consistency window for anonymous users after admin mutations.
- [x] Keep client invalidation after successful mutations, but invalidate only affected query families.
- [ ] Consider versioned cache keys or a lightweight public-content version when immediate global freshness becomes necessary.
- [ ] Do not add cache purging complexity until stale-content incidents justify it.
- [ ] Add a manual admin cache purge only for operational recovery, not as the normal mutation path.

### 19. Measure and optimize query plans before changing indexes

- [ ] Capture the slowest public and admin procedures with timing and row-count metrics.
- [ ] Run `EXPLAIN QUERY PLAN` for ratings filters, player search, news pagination, circuit listings, and leaderboard queries using production-like data.
- [ ] Confirm composite indexes match actual `WHERE` plus `ORDER BY` patterns.
- [ ] Avoid adding indexes solely because a column is frequently selected; indexes should support filtering, ordering, or uniqueness.
- [ ] Recheck write cost and D1 storage after adding indexes.

### 20. Optimize high-value query shapes

- [ ] Keep the two-step ratings query, but measure the count query separately; if exact totals are not required, consider a `hasNextPage` strategy that fetches one extra row.
- [ ] Consider keyset pagination for large player/news datasets instead of deep `OFFSET` pagination.
- [ ] Cache small, slow-changing lookup lists such as clubs, locations, titles, and roles with longer public TTLs.
- [ ] Avoid loading full nested circuit data on routes that need only circuit summaries.
- [ ] Ensure list procedures have deterministic ordering, including a stable ID tie-breaker after dates or ratings.
- [ ] Keep public projections minimal and avoid returning fields that are not rendered.

### 21. Keep prefetching intentional

- [x] Retain intent prefetching for likely navigation targets.
- [x] Avoid prefetching large nested queries on every hover or focus.
- [x] Use route-specific stale times for stable lookup data and frequently edited content.
- [ ] Verify that preload requests are not duplicating SSR work for the same navigation.
- [ ] Measure cache hit rate and request volume before increasing preload scope.
- [x] Prefetch the current route's critical data and a small number of likely next destinations, not every public page on initial load.
- [ ] Prefer prefetching lightweight lookup data and the next paginated result over full nested page graphs.
- [ ] Add a budget for prefetch requests per navigation so mobile users do not pay for unused data.

### 22. Review prerender boundaries

- [x] Keep prerendering for stable, public, SEO-important pages.
- [x] Do not prerender admin pages or pages whose content changes too frequently unless there is a clear deployment-time data model.
- [ ] Review the static sitemap whenever public routes are added.
- [ ] Decide whether news detail pages should be dynamically included in the sitemap rather than relying only on a static file.
- [ ] Test prerendered HTML for correct metadata, canonical URLs, and hydrated data.

### 23. Keep dashboard mutations and public freshness separate

**Why:** Dashboard mutations should update the current administrator's view
immediately, while public edge responses can reasonably remain eventually
consistent for a short TTL. Trying to synchronously refresh every public cache entry
after every edit would add complexity without much value for this traffic profile.

- [x] After a successful mutation, invalidate the affected React Query procedure families in the dashboard.
- [x] Invalidate related admin lists and detail queries when the same entity is visible in more than one dashboard route.
- [x] Do not invalidate every query globally after ordinary CRUD edits.
- [x] Treat the public edge TTL as the normal propagation window.
- [ ] Use a targeted cache-version or purge mechanism only for urgent corrections or content that must be public immediately.
- [ ] Add end-to-end checks that verify both immediate dashboard freshness and eventual anonymous freshness.

## UX and UI

### 24. Fix upload accessibility

- [x] Replace the clickable upload `<div>` with a semantic button or a properly labelled file input/drop zone.
- [x] Make upload, replace, and remove controls keyboard reachable.
- [x] Do not rely only on hover to reveal actions; expose them on focus and touch.
- [x] Add accessible status text for reading, cropping, uploading, success, and failure states.
- [x] Add a visible label or description connected to the file input.

### 25. Improve form feedback

- [ ] Show field-level validation messages from tRPC/Zod responses.
- [ ] Disable submit controls while mutations are pending.
- [ ] Prevent duplicate submissions.
- [ ] Preserve entered values when a mutation fails.
- [ ] Distinguish validation, conflict, authorization, not-found, and server errors in the UI.
- [ ] Confirm destructive operations consistently, especially bulk deletes.

### 26. Improve navigation and responsive behavior

- [ ] Verify that every icon-only button has an accessible name.
- [ ] Ensure dialogs, sheets, command menus, and dropdowns have visible focus states and predictable Escape behavior.
- [ ] Test admin tables on narrow screens; provide horizontal scrolling or responsive card layouts where needed.
- [ ] Ensure pagination announces page changes and preserves focus appropriately.
- [ ] Provide non-hover alternatives for important actions.
- [ ] Verify color contrast in both light and dark themes.

### 27. Improve loading and empty states

- [ ] Keep route-specific skeletons, but ensure they preserve the final layout dimensions to reduce layout shift.
- [ ] Provide useful empty states with the next action when an admin collection is empty.
- [ ] Add retry actions that invalidate the relevant loader/query rather than only dismissing an error boundary.
- [ ] Avoid global error toasts for expected empty, not-found, or background-refresh states.

### 28. Improve content and SEO quality

- [ ] Confirm every public route has a unique title and useful description.
- [x] Use `updatedAt` for article modification metadata.
- [ ] Add structured data only where it accurately describes the rendered content.
- [ ] Include dynamic news and player URLs in the sitemap strategy.
- [ ] Verify image dimensions, alt text, and loading behavior on content-heavy pages.
- [ ] Check canonical URLs with pagination and filter query parameters.

## Maintainability and Consistency

### 29. Reduce duplicated mutation and invalidation code

- [ ] Identify repeated CRUD route patterns and extract only genuinely shared behavior.
- [ ] Prefer small domain-specific helpers over a generic CRUD abstraction that hides authorization and validation.
- [ ] Standardize mutation success/error/invalidation handling in admin pages where the behavior is truly identical.
- [ ] Keep special workflows such as rating updates and event-link reconciliation explicit.

### 30. Keep active linting clean

- [x] Remove deleted legacy-tree assumptions from the active lint and documentation workflow.
- [x] Remove active warnings such as the unused `z` import in `packages/env/src/web.ts`.
- [x] Keep warnings in active `apps/` and `packages/` code visible in CI.

### 31. Document architectural contracts

- [x] Document the package dependency direction: web → API → auth → DB → env, with UI as a shared presentation package.
- [x] Document which procedures are public, protected, and administrator-only.
- [x] Document cache TTLs, invalidation behavior, and the anonymous edge-cache consistency window.
- [x] Document D1 migration rules and the local Alchemy migration tracker workflow.
- [ ] Record important decisions as ADRs instead of leaving them only in migration notes.

### 32. Protect backup and export workflows

**Why:** Backups, Swiss Manager exports, and administrative data downloads can
contain more personal or operational data than normal public pages. They deserve a
separate security and retention policy.

- [ ] Require the strongest administrator authorization for backup and export procedures.
- [ ] Add `Cache-Control: no-store` to sensitive download responses.
- [ ] Avoid logging exported data, URLs containing secrets, or full request payloads.
- [ ] Define retention and deletion rules for downloaded backups.
- [ ] Audit backup/export access with administrator, timestamp, procedure, and result metadata.
- [ ] Verify that generated files cannot be used for spreadsheet formula injection if user-controlled text is exported.

### 33. Establish recovery and deployment safeguards

- [x] Document the production rollback procedure for application and database migrations.
- [ ] Test restoring a D1 backup periodically instead of only creating backups.
- [x] Keep migration application and application deployment ordering explicit.
- [ ] Add a deploy smoke test for authentication, a public route, a public tRPC query, an admin guard, and media delivery.
- [ ] Add alarms or notifications for failed deployments, migration failures, elevated 5xx responses, and rate-limit spikes.
- [ ] Define how orphaned R2 objects are discovered and cleaned up.

### 34. Add privacy and data-governance rules

- [x] Inventory personal data stored in player profiles, authentication records, logs, backups, and exports.
- [x] Document which player fields are public and which are administrative.
- [ ] Define who can edit or delete identity, rating, and profile data.
- [ ] Define retention and deletion behavior for Better Auth sessions and stale accounts.
- [x] Ensure error logs and analytics do not include unnecessary personal data.
- [x] Add a process for correcting inaccurate player data and preserving an audit trail for rating changes.

### 35. Add CI quality gates and dependency hygiene

- [x] Run type checking, active-code linting, build, and tests in CI; migration validation remains a deployment prerequisite.
- [ ] Prevent generated route trees and migrations from being changed without the corresponding source change review.
- [ ] Add dependency vulnerability scanning and review transitive packages used in the Worker bundle.
- [ ] Track bundle-size budgets for the largest client chunks, especially Excel export, charts, markdown, and admin-only code.
- [ ] Keep development-only devtools and diagnostics excluded from production output.
- [ ] Pin or regularly review Cloudflare runtime, Miniflare, Alchemy, and D1-related versions together.

## Fumadocs Documentation Plan

### 36. Organize documentation by audience

- [ ] Keep a domain guide for federation staff and users.
- [ ] Add an architecture guide for maintainers.
- [ ] Add an API and database reference for developers and LLMs.
- [ ] Add operational runbooks for local development, migrations, backups, deployment, and incident recovery.
- [ ] Add an explicit glossary of domain terms and abbreviations.

### 37. Document the domain model

- [ ] Explain players, clubs, locations, titles, roles, norms, insignias, tournaments, circuits, cups, announcements, and events.
- [ ] Document relationships and deletion behavior with a schema diagram.
- [ ] Explain rating types and rating-history invariants.
- [ ] Explain school leaderboard scoring and medal weighting.
- [ ] Explain what is public and what is administrative.

### 38. Document runtime behavior

- [ ] Explain the request lifecycle from route loader to React Query, tRPC, Drizzle, and D1.
- [ ] Explain SSR, hydration, route preloading, and prerendering.
- [ ] Explain public edge caching versus authenticated requests.
- [ ] Explain image upload, R2 storage, URL format, replacement, and cleanup.
- [ ] Explain authentication, account creation restrictions, and future authorization boundaries.

### 39. Add LLM-friendly references

- [ ] Create a procedure catalog with purpose, access level, input shape, output shape, and common errors.
- [ ] Create a route catalog with URL, purpose, data dependencies, and SEO behavior.
- [ ] List invariants and forbidden states explicitly.
- [ ] Add examples for common maintenance tasks such as adding a field, adding a procedure, and adding a public route.
- [ ] Keep examples short, deterministic, and synchronized with tests where possible.

## Verification Checklist

- [x] `bun test`
- [x] `bun run check-types`
- [x] `bun run lint` (passes with active warning cleanup still pending)
- [x] `bun run build`
- [ ] Database migrations apply cleanly to a fresh local D1 database.
- [ ] Public routes render correct SSR HTML and metadata.
- [ ] Admin routes reject unauthenticated and unauthorized requests.
- [ ] Rating updates remain consistent after simulated failures.
- [ ] Event link reconciliation cannot cross event boundaries.
- [ ] Upload validation rejects malformed and unsupported files.
- [ ] Keyboard-only navigation works for dialogs, command menu, forms, tables, and uploads.
