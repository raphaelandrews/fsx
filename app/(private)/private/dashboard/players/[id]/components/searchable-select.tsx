"use client"

import { useState } from "react"
import { CheckIcon, ChevronsUpDownIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command"
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"

interface Option {
	id: number
	name: string
}

interface SearchableSelectProps {
	options: Option[]
	value: number | null
	onChange: (value: number | null) => void
	placeholder?: string
	searchPlaceholder?: string
	emptyMessage?: string
	disabled?: boolean
}

export function SearchableSelect({
	options,
	value,
	onChange,
	placeholder = "Select...",
	searchPlaceholder = "Search...",
	emptyMessage = "No results found.",
	disabled = false,
}: SearchableSelectProps) {
	const [open, setOpen] = useState(false)

	const selectedOption = options.find((option) => option.id === value)

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-full justify-between"
					disabled={disabled}
				>
					{selectedOption ? selectedOption.name : placeholder}
					<ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[--radix-popover-trigger-width] p-0">
				<Command>
					<CommandInput placeholder={searchPlaceholder} />
					<CommandList>
						<CommandEmpty>{emptyMessage}</CommandEmpty>
						<CommandGroup>
							<CommandItem
								value="none"
								onSelect={() => {
									onChange(null)
									setOpen(false)
								}}
							>
								<CheckIcon
									className={cn(
										"mr-2 h-4 w-4",
										value === null ? "opacity-100" : "opacity-0"
									)}
								/>
								<span className="text-muted-foreground">None</span>
							</CommandItem>
							{options.map((option) => (
								<CommandItem
									key={option.id}
									value={option.name}
									onSelect={() => {
										onChange(option.id)
										setOpen(false)
									}}
								>
									<CheckIcon
										className={cn(
											"mr-2 h-4 w-4",
											value === option.id ? "opacity-100" : "opacity-0"
										)}
									/>
									{option.name}
								</CommandItem>
							))}
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	)
}
