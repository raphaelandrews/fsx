import { cn } from "@fsx/ui/lib/utils";

interface PageHeaderProps {
  /** The page title. Rendered as a centered `<h1>`. */
  title: string;
  /** Optional supporting copy shown under the title. */
  description?: string;
  /** Extra classes merged onto the wrapper (use sparingly). */
  className?: string;
}

/**
 * PageHeader — standard top-of-page identity block for "title + content"
 * public routes (Notícias, Comunicados, Ratings, Membros, Circuitos, Bullet).
 *
 * The detail route (`/noticias/$slug`) intentionally uses a different layout
 * and does NOT use this component.
 *
 * ## Page rhythm
 *
 *   ┌────────────────────────────┐
 *   │   <Header />               │  h-22 md:h-28, sticky top-0 z-50
 *   ├────────────────────────────┤
 *   │   pt-8  / pt-12  / pt-16   │  ← top breathing room (this component)
 *   │   <h1>Title</h1>           │
 *   │   pb-6  / pb-8             │  ← header → content gap (this component)
 *   ├────────────────────────────┤
 *   │   content (grid / table /  │
 *   │   list / cards / filters)  │
 *   ├────────────────────────────┤
 *   │   <Footer />               │  ← content → footer gap is handled by the
 *   └────────────────────────────┘    `<main className="min-h-screen">` flow
 *
 * The component owns the top padding so consumers don't have to remember it.
 * It does NOT add an `mb-*` after the title — the bottom padding IS the gap to
 * content, and the parent stays in control of subsequent spacing.
 *
 * ## Spacing decisions
 *
 * - `pt-8  sm:pt-12  lg:pt-16` — 32 / 48 / 64px of breathing room below the
 *   sticky header. The header is ~88px on mobile and ~112px on desktop, so the
 *   64px ceiling on `lg` keeps the title visible above the fold on common
 *   laptop heights (≈768px) without competing with the header.
 *
 * - `pb-6  sm:pb-8` — 24 / 32px between the title block and content. Intentionally
 *   smaller than the top padding so the title feels grouped with its own
 *   block, then distinctly separated from the content beneath.
 *
 * - No explicit bottom padding on the page — `<main className="min-h-screen">`
 *   guarantees the footer sits at the bottom of the viewport, so content has
 *   whatever vertical space it needs before the footer.
 *
 * ## Typography
 *
 * - size: `text-3xl` mobile → `sm:text-4xl` tablet+. The scale-up at `sm` (not
 *   `md`) is deliberate: listing pages benefit from a presentational title
 *   earlier than editorial detail pages do.
 * - weight: `font-semibold` (matches the project's display convention; bolder
 *   than body, lighter than the old `font-bold` listings).
 * - tracking: `tracking-tight` for display polish on the larger sizes.
 * - color: inherits `text-foreground` from the `body` rule in `globals.css`.
 * - wrap: `text-balance` for clean centered line breaks.
 */
export function PageHeader({ title, description, className }: PageHeaderProps) {
  return (
    <div className={cn("pt-8 pb-6 sm:pt-12 sm:pb-8 text-center", className)}>
      <h1 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h1>
      {description ? (
        <p className="mx-auto mt-3 max-w-2xl text-base text-pretty text-muted-foreground">
          {description}
        </p>
      ) : null}
    </div>
  );
}
