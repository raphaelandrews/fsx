import type { ReactNode } from "react"

import { TableCell, TableRow } from "@fsx/ui/components/table"
import { cn } from "@fsx/ui/lib/utils"

export function EmptyTableRow({
  colSpan,
  children,
  className,
}: {
  colSpan: number
  children: ReactNode
  className?: string
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
  )
}
