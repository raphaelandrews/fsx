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
	championship: string,
	size: number
) => {
	if (championship === "Absoluto") {
		return (
			<Popover>
				<PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
					<TurtleIcon height={size} width={size} />
				</PopoverTrigger>
				<PopoverContent>Atual campeão Sergipano Absoluto</PopoverContent>
			</Popover>
		)
	}

	if (championship === "Rápido") {
		return (
			<Popover>
				<PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
					<RabbitIcon height={size} width={size} />
				</PopoverTrigger>
				<PopoverContent>Atual campeão Sergipano Rápido</PopoverContent>
			</Popover>
		)
	}

	if (championship === "Blitz") {
		return (
			<Popover>
				<PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
					<ZapIcon height={size} width={size} />
				</PopoverTrigger>
				<PopoverContent>Atual campeão Sergipano Blitz</PopoverContent>
			</Popover>
		)
	}

	if (championship === "Feminino") {
		return (
			<Popover>
				<PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
					<CrownIcon height={size} width={size} />
				</PopoverTrigger>
				<PopoverContent>Atual campeã Sergipana Feminino</PopoverContent>
			</Popover>
		)
	}

	if (championship === "Equipes") {
		return (
			<Popover>
				<PopoverTrigger className="rounded-md bg-accent p-2 text-accent-foreground">
					<SwordsIcon height={size} width={size} />
				</PopoverTrigger>
				<PopoverContent>Atual campeão Sergipano Equipes</PopoverContent>
			</Popover>
		)
	}
}
