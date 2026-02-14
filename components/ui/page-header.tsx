import { type LucideIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import { Announcement } from "@/components/announcement"
import { DottedSeparator } from "@/components/dotted-separator"
import { DottedX } from "@/components/dotted-x"

interface PageHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
	icon?: LucideIcon
	label?: string
}

function PageHeader({
	className,
	children,
	icon,
	label,
	...props
}: PageHeaderProps) {
	if (icon && label) {
		return (
			<section className={cn(className)} {...props}>
				<DottedX className="p-0">
					<Announcement icon={icon} label={label} />
					{children}
				</DottedX>
				<DottedSeparator />
			</section>
		)
	}

	return (
		<section
			className={cn(
				"mx-auto flex flex-col items-start gap-2 px-4 py-8 md:py-12 md:pb-8 lg:py-12 lg:pb-10",
				className
			)}
			{...props}
		>
			{children}
		</section>
	)
}

function PageHeaderHeading({
	className,
	...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h1
			className={cn(
				"font-bold text-3xl leading-tight tracking-tighter md:text-4xl lg:leading-[1.1]",
				className
			)}
			{...props}
		/>
	)
}

function PageHeaderDescription({
	className,
	...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
	return (
		<p
			className={cn(
				"balance max-w-2xl font-light text-foreground text-lg",
				className
			)}
			{...props}
		/>
	)
}

function PageActions({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"flex w-full items-center justify-start gap-2 py-2",
				className
			)}
			{...props}
		/>
	)
}

export { PageActions, PageHeader, PageHeaderDescription, PageHeaderHeading }
