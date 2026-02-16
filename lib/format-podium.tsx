import {
	CrownIcon,
	MedalIcon,
	RabbitIcon,
	SwordsIcon,
	TrainFrontIcon,
	TurtleIcon,
	ZapIcon,
} from "lucide-react"

export function FormatPodium(
	place: number | null | undefined,
	championship_id: number
) {
	if (place === 1 && championship_id === 1) {
		return <TurtleIcon className="size-4" />
	}

	if (place === 1 && championship_id === 2) {
		return <RabbitIcon className="size-4" />
	}

	if (place === 1 && championship_id === 3) {
		return <ZapIcon className="size-4" />
	}

	if (place === 1 && championship_id === 4) {
		return <CrownIcon className="size-4" />
	}

	if (place === 1 && championship_id === 5) {
		return <SwordsIcon className="size-4" />
	}

	if (place === 1 && championship_id === 6) {
		return <TrainFrontIcon className="size-4" />
	}

	if (place === 2) {
		return <MedalIcon className="size-4" />
	}
}

export function FormatPodiumTitle(place: number | null | undefined) {
	if (place === 1) {
		return "Campeão(ã)"
	}
	if (place === 2) {
		return "Vice-Campeão(ã)"
	}
}
