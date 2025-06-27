import type * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
	"inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md border px-2 py-0.5 font-medium text-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
	{
		variants: {
			variant: {
				default:
					"border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
				secondary:
					"border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
				destructive:
					"border-transparent bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90",
				outline:
					"text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
				strawberry:
					"border-transparent bg-[#FFEBEE] text-[#D32F2F] dark:bg-[#4D0217] dark:text-[#FF6982] [a&]:hover:opacity-90 dark:[a&]:hover:opacity-90",
				bulbasaur:
					"border-transparent bg-[#E8F5E9] text-[#388E3C] dark:bg-[#022C22] dark:text-[#1BC994] [a&]:hover:opacity-90 dark:[a&]:hover:opacity-90",
				honey:
					"border-transparent bg-[#FFF3E0] text-[#F57C00] dark:bg-[#3F1507] dark:text-[#F69012] [a&]:hover:opacity-90 dark:[a&]:hover:opacity-90",
				sea: "border-transparent bg-[#E0F7FA] text-[#00796B] dark:bg-[#0C2E30] dark:text-[#67D4DA] [a&]:hover:opacity-90 dark:[a&]:hover:opacity-90",
				dark: "border-transparent bg-[#F5F5F5] text-[#424242] dark:bg-[#222222] dark:text-[#E4E4E4] [a&]:hover:opacity-90 dark:[a&]:hover:opacity-90",
				gold: "border-transparent bg-[#FFF8E1] text-[#FF8F00] dark:bg-[#634C17] dark:text-[#FFD268] [a&]:hover:opacity-90 dark:[a&]:hover:opacity-90",
			},
		},
		defaultVariants: {
			variant: "default",
		},
	}
)

function Badge({
	className,
	variant,
	asChild = false,
	...props
}: React.ComponentProps<"span"> &
	VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
	const Comp = asChild ? Slot : "span"

	return (
		<Comp
			className={cn(badgeVariants({ variant }), className)}
			data-slot="badge"
			{...props}
		/>
	)
}

export { Badge, badgeVariants }
