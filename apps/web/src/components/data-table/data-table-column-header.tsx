import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowUpDownIcon, ChevronDownIcon, ChevronUpIcon } from "@hugeicons/core-free-icons";
import type { Column } from "@tanstack/react-table";

import { Button } from "@fsx/ui/components/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@fsx/ui/components/dropdown-menu";
import { cn } from "@fsx/ui/lib/utils";

interface DataTableColumnHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={cn(className)}>{title}</div>;
  }

  return (
    <div className={cn("flex items-center space-x-2", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger render={<Button />}>
          <span>{title}</span>
          <HugeiconsIcon
            className="ml-1 size-4 text-muted-foreground"
            icon={ArrowUpDownIcon}
            strokeWidth={2}
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
            <HugeiconsIcon className="mr-2 size-3.5 text-muted-foreground/70" icon={ChevronDownIcon} strokeWidth={2} />
            Asc
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
            <HugeiconsIcon className="mr-2 size-3.5 text-muted-foreground/70" icon={ChevronUpIcon} strokeWidth={2} />
            Desc
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
