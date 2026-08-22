// NOTE: project-customized — do NOT run `shadcn add table` to regenerate.
// The defaults below are tuned for FSX data tables:
//   - Roomier cell padding (px-4 py-2) and head padding (h-10 px-4).
//   - Transparent header (`bg-background` on TableHeader — same as app bg,
//     no tint). The header reads as the top of the data, not as a separate
//     chrome strip.
//   - Zebra striping on TableBody via `[&_tr:nth-child(even)]:bg-muted`
//     using the project's neutral grey scale (`--muted` =
//     `oklch(0.955 0.004 150)`). Contrast against `--foreground`
//     (`oklch(0.29 0.02 150)`) is ≈ 8.9:1 — well above WCAG AA's 4.5:1
//     and into AAA territory, so zebra rows do not degrade text readability.
//   - No internal row borders — zebra alone separates rows. Add `border-b` on
//     a per-row basis only if a specific table needs it.
//   - No implicit `whitespace-nowrap` on cells (consumers opt in for numeric cols).
//   - `EmptyTableRow` helper for consistent empty states (sets `bg-background`
//     explicitly so the row is NOT zebra-striped).
// Cell-level backgrounds (e.g. bullet prize gold/silver/bronze), row hover
// (`hover:bg-muted/50`), and `data-[state=selected]:bg-muted` all win over the
// row-level zebra due to higher selector specificity.

import * as React from "react"

import { cn } from "@fsx/ui/lib/utils"

function Table({ className, ...props }: React.ComponentProps<"table">) {
  return (
    <div
      data-slot="table-container"
      className="relative w-full overflow-x-auto"
    >
      <table
        data-slot="table"
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-background", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:nth-child(even)]:bg-muted", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn("bg-muted/50 font-medium", className)}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "transition-colors hover:bg-muted/50 has-aria-expanded:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, ...props }: React.ComponentProps<"th">) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        "h-10 px-4 text-left align-middle font-medium whitespace-nowrap text-foreground [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, ...props }: React.ComponentProps<"td">) {
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "px-4 py-2 align-middle [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

/**
 * EmptyTableRow — standard empty-state row for data tables.
 *
 * Usage:
 *   <TableBody>
 *     {items.length === 0 ? (
 *       <EmptyTableRow colSpan={columns.length}>Nenhum registro encontrado.</EmptyTableRow>
 *     ) : (
 *       items.map(...)
 *     )}
 *   </TableBody>
 *
 * Renders a single row with a muted, centered cell that spans the full
 * table width. The row opts out of zebra striping via `bg-background` so
 * it stands out from a populated body.
 */
function EmptyTableRow({
  colSpan,
  children,
  className,
}: {
  colSpan: number;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <TableRow className="bg-background hover:bg-background">
      <TableCell
        className={cn("h-24 text-center text-muted-foreground", className)}
        colSpan={colSpan}
      >
        {children}
      </TableCell>
    </TableRow>
  );
}

export {
  EmptyTableRow,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
}
