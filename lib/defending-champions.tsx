import {
	CrownIcon,
	RabbitIcon,
	SwordsIcon,
	TurtleIcon,
	ZapIcon,
} from "lucide-react"

import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover"

export const formatDefendingChampions = (
	championship: string
) => {
	if (championship === "Absoluto") {
		return (
			<Popover>
				<PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
					<TurtleIcon className="size-4" />
				</PopoverTrigger>
				<PopoverContent>Atual campeão Sergipano Absoluto</PopoverContent>
			</Popover>
		)
	}

	if (championship === "Rápido") {
		return (
			<Popover>
				<PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
					<RabbitIcon className="size-4" />
				</PopoverTrigger>
				<PopoverContent>Atual campeão Sergipano Rápido</PopoverContent>
			</Popover>
		)
	}

	if (championship === "Blitz") {
		return (
			<Popover>
				<PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
					<ZapIcon className="size-4" />
				</PopoverTrigger>
				<PopoverContent>Atual campeão Sergipano Blitz</PopoverContent>
			</Popover>
		)
	}

	if (championship === "Feminino") {
		return (
			<Popover>
				<PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
					<CrownIcon className="size-4" />
				</PopoverTrigger>
				<PopoverContent>Atual campeã Sergipana Feminino</PopoverContent>
			</Popover>
		)
	}

	if (championship === "Equipes") {
		return (
			<Popover>
				<PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
					<SwordsIcon className="size-4" />
				</PopoverTrigger>
				<PopoverContent>Atual campeão Sergipano Equipes</PopoverContent>
			</Popover>
		)
	}
}
