import type { Column } from "@tanstack/react-table"
import {
	ArrowDownIcon,
	ArrowUpIcon,
	ChevronsUpDownIcon,
	EyeOffIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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
				<DropdownMenuTrigger asChild>
					<Button
						className="-ms-3 h-8 hover:bg-accent/50 data-[state=open]:bg-accent"
						size="sm"
						variant="ghost"
					>
						<span>{title}</span>
						{column.getIsSorted() === "desc" ? (
							<ArrowDownIcon className="ms-2 size-4" />
						) : column.getIsSorted() === "asc" ? (
							<ArrowUpIcon className="ms-2 size-4" />
						) : (
							<ChevronsUpDownIcon className="ms-2 size-4" />
						)}
					</Button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="min-w-[120px]">
					<DropdownMenuItem
						className="cursor-pointer focus:bg-accent/50"
						onClick={() => column.toggleSorting(false)}
					>
						<ArrowUpIcon className="me-2 size-3.5 text-muted-foreground/70" />
						Asc
					</DropdownMenuItem>
					<DropdownMenuItem
						className="cursor-pointer focus:bg-accent/50"
						onClick={() => column.toggleSorting(true)}
					>
						<ArrowDownIcon className="me-2 size-3.5 text-muted-foreground/70" />
						Desc
					</DropdownMenuItem>
					<DropdownMenuSeparator />
					<DropdownMenuItem
						className="cursor-pointer focus:bg-accent/50"
						onClick={() => column.toggleVisibility(false)}
					>
						<EyeOffIcon className="me-2 size-3.5 text-muted-foreground/70" />
						Esconder
					</DropdownMenuItem>
				</DropdownMenuContent>
			</DropdownMenu>
		</div>
	)
}
