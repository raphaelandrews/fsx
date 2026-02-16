import { DottedSeparator } from "@/components/dotted-separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export function ChampionsSkeleton() {
  return (
    <div className="w-full gap-0">
      {/* Tabs list skeleton */}
      <div className="grid h-auto w-full grid-cols-3 gap-0 p-0 md:grid-cols-6 border-b">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center justify-center py-2.5 border-r last:border-r-0">
            <Skeleton className="h-4 w-20" />
          </div>
        ))}
      </div>

      <DottedSeparator />

      <div className="flex flex-col">
        <div className="relative p-4">
          <Table>
            <TableHeader>
              <TableRow className="border-b-0 hover:bg-transparent">
                <TableHead><Skeleton className="h-4 w-10" /></TableHead>
                <TableHead><Skeleton className="h-4 w-32" /></TableHead>
                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
                <TableHead><Skeleton className="h-4 w-24" /></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((row) => (
                <TableRow key={row} className="border-b-0 hover:bg-transparent">
                  <TableCell><Skeleton className="h-4 w-8" /></TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-6 rounded-full" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  </TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-4" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <DottedSeparator />

        <div className="flex items-center justify-end space-x-2 p-4">
          <Skeleton className="h-8 w-20" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  )
}
