import type React from "react"
import { CheckIcon, CirclePlusIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Separator } from "@/components/ui/separator"

interface CategoryFilter {
	categories: { value: string; label: string }[]
	selectedCategories: string[]
	onCategoryChange: (categories: string[]) => void
}

const CategoryFilter: React.FC<CategoryFilter> = ({
	categories,
	selectedCategories,
	onCategoryChange,
}) => {
	const toggleCategory = (category: string) => {
		const currentCategories = new Set(selectedCategories)
		if (currentCategories.has(category)) {
			currentCategories.delete(category)
		} else {
			currentCategories.add(category)
		}
		onCategoryChange(Array.from(currentCategories))
	}

	return (
		<div className="mt-3 flex items-center space-x-2">
			<Popover>
				<PopoverTrigger asChild>
					<Button className="h-8 border-dashed" size="sm" variant="outline">
						<CirclePlusIcon className="mr-2 h-4 w-4" />
						Categoria
						{selectedCategories.length > 0 && (
							<>
								<Separator className="mx-2 h-4" orientation="vertical" />
								<Badge
									className="rounded-sm px-1 font-normal lg:hidden"
									variant="secondary"
								>
									{selectedCategories.length}
								</Badge>
								<div className="hidden space-x-1 lg:flex">
									{selectedCategories.length > 2 ? (
										<Badge
											className="rounded-sm px-1 font-normal"
											variant="secondary"
										>
											{selectedCategories.length} selecionadas
										</Badge>
									) : (
										categories
											.filter((category) =>
												selectedCategories.includes(category.value)
											)
											.map((category) => (
												<Badge
													className="rounded-sm px-1 font-normal"
													key={category.value}
													variant="secondary"
												>
													{category.label}
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
						<CommandInput placeholder="Categoria" />
						<CommandList>
							<CommandEmpty>Sem resultados.</CommandEmpty>
							<CommandGroup>
								{categories.map((category) => {
									const isSelected = selectedCategories.includes(category.value)
									return (
										<CommandItem
											key={category.value}
											onSelect={() => toggleCategory(category.value)}
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
											<span>{category.label}</span>
										</CommandItem>
									)
								})}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			{selectedCategories.length > 0 && (
				<Button
					className="h-8 px-2 lg:px-3"
					onClick={() => onCategoryChange([])}
					variant="ghost"
				>
					Limpar
					<XIcon className="ml-2 h-4 w-4" />
				</Button>
			)}
		</div>
	)
}

export default CategoryFilter
