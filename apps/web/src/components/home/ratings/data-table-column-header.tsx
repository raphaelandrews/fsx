import type { Column } from "@tanstack/react-table"
import { HugeiconsIcon } from "@hugeicons/react"
import {
	ArrowDown01Icon,
	ArrowUp01Icon,
	ArrowUpDownIcon,
	ViewOffIcon,
} from "@hugeicons/core-free-icons"

import { cn } from "@fsx/ui/lib/utils"

import { Button } from "@fsx/ui/components/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@fsx/ui/components/dropdown-menu"

interface DataTableColumnHeaderProps<TData, TValue>
	extends React.HTMLAttributes<HTMLDivElement> {
	column: Column<TData, TValue>
	title: string
}

export function DataTableColumnHeader<TData, TValue>({
	column,
	title,
	className,
}: DataTableColumnHeaderProps<TData, TValue>) {
	if (!column.getCanSort()) {
		return <div className={cn(className)}>{title}</div>
	}

	return (
		<div className={cn("flex items-center gap-2", className)}>
			<DropdownMenu>
				<DropdownMenuTrigger
					render={
						<Button
							className="-ms-3 h-8 hover:bg-accent/50 data-[state=open]:bg-accent"
							size="sm"
							variant="ghost"
						/>
					}
				>
					<span>{title}</span>
					{column.getIsSorted() === "desc" ? (
						<HugeiconsIcon icon={ArrowDown01Icon} className="ms-2 size-4" />
					) : column.getIsSorted() === "asc" ? (
						<HugeiconsIcon icon={ArrowUp01Icon} className="ms-2 size-4" />
					) : (
						<HugeiconsIcon icon={ArrowUpDownIcon} className="ms-2 size-4" />
					)}
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="min-w-[120px]">
					<DropdownMenuItem
						className="cursor-pointer focus:bg-accent/50"
						onClick={() => column.toggleSorting(false)}
					>
						<HugeiconsIcon icon={ArrowUp01Icon} className="me-2 size-3.5 text-muted-foreground/70" />
						Asc
					</DropdownMenuItem>
					<DropdownMenuItem
						className="cursor-pointer focus:bg-accent/50"
						onClick={() => column.toggleSorting(true)}
					>
						<HugeiconsIcon icon={ArrowDown01Icon} className="me-2 size-3.5 text-muted-foreground/70" />
						Desc
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						className="cursor-pointer focus:bg-accent/50"
						onClick={() => column.toggleVisibility(false)}
					>
						<HugeiconsIcon icon={ViewOffIcon} className="me-2 size-3.5 text-muted-foreground/70" />
						Esconder
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}
