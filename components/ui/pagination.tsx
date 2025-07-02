import type * as React from "react"
import {
	ChevronLeftIcon,
	ChevronRightIcon,
	ChevronsLeftIcon,
	ChevronsRightIcon,
	MoreHorizontalIcon,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { type Button, buttonVariants } from "@/components/ui/button"

function Pagination({ className, ...props }: React.ComponentProps<"nav">) {
	return (
		<nav
			aria-label="pagination"
			className={cn("mx-auto flex w-full justify-center", className)}
			data-slot="pagination"
			{...props}
		/>
	)
}

function PaginationContent({
	className,
	...props
}: React.ComponentProps<"ul">) {
	return (
		<ul
			className={cn("flex flex-row items-center gap-1", className)}
			data-slot="pagination-content"
			{...props}
		/>
	)
}

function PaginationItem({
	className,
	disabled,
	...props
}: React.ComponentProps<"li"> & { disabled?: boolean }) {
	return (
		<li
			className={cn(
				"hover:cursor-pointer",
				disabled && "opacity-40 hover:cursor-default",
				className
			)}
			data-slot="pagination-item"
			{...props}
		/>
	)
}

type PaginationLinkProps = {
	isActive?: boolean
	disabled?: boolean
} & Pick<React.ComponentProps<typeof Button>, "size"> &
	React.ComponentProps<"a">

function PaginationLink({
	className,
	isActive,
	disabled,
	size = "icon",
	...props
}: PaginationLinkProps) {
	return (
		<a
			aria-current={isActive ? "page" : undefined}
			aria-disabled={disabled}
			className={cn(
				buttonVariants({
					variant: isActive ? "outline" : "ghost",
					size,
				}),
				"hover:cursor-pointer",
				disabled && "opacity-40 hover:cursor-default",
				className
			)}
			data-active={isActive}
			data-slot="pagination-link"
			{...props}
		/>
	)
}

function PaginationPrevious({
	className,
	disabled,
	...props
}: React.ComponentProps<typeof PaginationLink>) {
	return (
		<PaginationLink
			aria-label="Go to previous page"
			className={cn("size-7 p-1.25", className)}
			disabled={disabled}
			size="default"
			{...props}
		>
			<ChevronLeftIcon size={16} />
			<span className="sr-only">Previous</span>
		</PaginationLink>
	)
}

function PaginationNext({
	className,
	disabled,
	...props
}: React.ComponentProps<typeof PaginationLink>) {
	return (
		<PaginationLink
			aria-label="Go to next page"
			className={cn("size-7 p-1.25", className)}
			disabled={disabled}
			size="default"
			{...props}
		>
			<span className="sr-only">Next</span>
			<ChevronRightIcon size={16} />
		</PaginationLink>
	)
}

function PaginationFirst({
	className,
	disabled,
	...props
}: React.ComponentProps<typeof PaginationLink>) {
	return (
		<PaginationLink
			aria-label="Go to first page"
			className={cn("size-7 p-1.25", className)}
			disabled={disabled}
			size="default"
			{...props}
		>
			<ChevronsLeftIcon size={16} />
			<span className="sr-only">First</span>
		</PaginationLink>
	)
}

function PaginationLast({
	className,
	disabled,
	...props
}: React.ComponentProps<typeof PaginationLink>) {
	return (
		<PaginationLink
			aria-label="Go to last page"
			className={cn("size-7 p-1.25", className)}
			disabled={disabled}
			size="default"
			{...props}
		>
			<ChevronsRightIcon size={16} />
			<span className="sr-only">Last</span>
		</PaginationLink>
	)
}

function PaginationEllipsis({
	className,
	...props
}: React.ComponentProps<"span">) {
	return (
		<span
			aria-hidden
			className={cn("flex size-9 items-center justify-center", className)}
			data-slot="pagination-ellipsis"
			{...props}
		>
			<MoreHorizontalIcon className="size-4" />
			<span className="sr-only">More pages</span>
		</span>
	)
}

export {
	Pagination,
	PaginationContent,
	PaginationLink,
	PaginationItem,
	PaginationFirst,
	PaginationPrevious,
	PaginationNext,
	PaginationLast,
	PaginationEllipsis,
}
