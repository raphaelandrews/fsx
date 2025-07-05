import type * as React from "react"
import { CheckIcon, CirclePlusIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

interface DataTableFacetedFilterProps {
	title: string
	options: {
		label: string
		value: string
		icon?: React.ComponentType<{ className?: string }>
	}[]
	value: string[]
	onChange: (value: string[]) => void
}

export function DataTableFacetedFilter({
	title,
	options,
	value,
	onChange,
}: DataTableFacetedFilterProps) {
	const selectedValues = new Set(value)

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button className="h-8 border-dashed" size="sm" variant="outline">
					<CirclePlusIcon className="mr-2 h-4 w-4" />
					{title}
					{selectedValues?.size > 0 && (
						<>
							<Separator className="mx-2 h-4" orientation="vertical" />
							<Badge
								className="rounded-sm px-1 font-normal lg:hidden"
								variant="secondary"
							>
								{selectedValues.size}
							</Badge>
							<div className="hidden space-x-1 lg:flex">
								{selectedValues.size > 2 ? (
									<Badge
										className="rounded-sm px-1 font-normal"
										variant="secondary"
									>
										{selectedValues.size} selected
									</Badge>
								) : (
									options
										.filter((option) => selectedValues.has(option.value))
										.map((option) => (
											<Badge
												className="rounded-sm px-1 font-normal"
												key={option.value}
												variant="secondary"
											>
												{option.label}
											</Badge>
										))
								)}
							</div>
						</>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent align="start" className="w-[200px] p-0">
				<Command>
					<CommandInput placeholder={title} />
					<CommandList>
						<CommandEmpty>No results found.</CommandEmpty>
						<CommandGroup>
							{options.map((option) => {
								const isSelected = selectedValues.has(option.value)

								return (
									<CommandItem
										key={option.value}
										onSelect={() => {
											if (title === "Categoria") {
												onChange([option.value])
											} else {
												const newSelected = new Set(selectedValues)
												if (isSelected) {
													newSelected.delete(option.value)
												} else {
													newSelected.add(option.value)
												}
												onChange(Array.from(newSelected))
											}
										}}
									>
										<div
											className={cn(
												"mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
												isSelected
													? "bg-primary text-primary-foreground"
													: "opacity-50 [&_svg]:invisible"
											)}
										>
											<CheckIcon className={cn("h-4 w-4")} />
										</div>
										{option.icon && (
											<option.icon className="mr-2 h-4 w-4 text-muted-foreground" />
										)}
										<span>{option.label}</span>
									</CommandItem>
								)
							})}
						</CommandGroup>
						{selectedValues.size > 0 && (
							<>
								<CommandSeparator />
								<CommandGroup>
									<CommandItem
										className="justify-center text-center"
										onSelect={() => onChange([])}
									>
										Limpar filtros
									</CommandItem>
								</CommandGroup>
							</>
						)}
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
