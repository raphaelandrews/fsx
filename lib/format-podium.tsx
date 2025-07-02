import {
	CrownIcon,
	MedalIcon,
	RabbitIcon,
	SwordsIcon,
	TurtleIcon,
	ZapIcon,
} from "lucide-react"

export function FormatPodium(
	place: number | null | undefined,
	championship_id: number
) {
	if (place === 1 && championship_id === 1) {
		return <TurtleIcon height={24} width={24} />
	}

	if (place === 1 && championship_id === 2) {
		return <RabbitIcon height={24} width={24} />
	}

	if (place === 1 && championship_id === 3) {
		return <ZapIcon height={24} width={24} />
	}

	if (place === 1 && championship_id === 4) {
		return <CrownIcon height={24} width={24} />
	}

	if (place === 1 && championship_id === 5) {
		return <SwordsIcon height={24} width={24} />
	}

	if (place === 2) {
		return <MedalIcon height={24} width={24} />
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
