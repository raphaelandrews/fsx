export type Circuit = {
	name: string
	type: string
	circuitPhase: CircuitPhase[]
}

export type CircuitPhase = {
	id: number
	order: number
	tournament: {
		name: string
	}
	circuitPodiums: CircuitPodium[]
}

export type CircuitPodium = {
	category: string
	place: string
	points: number
	player: CircuitPlayer
	clubId?: number
}

export type CircuitPlayer = {
	id: number
	name: string
	nickname?: string | null
	imageUrl?: string | null
	playersToTitles?:
		| {
				title: {
					shortTitle: string
					type: string
				}
		  }[]
		| null
	total?: number
	category?: string
	// biome-ignore lint/suspicious/noExplicitAny: Any
	[key: string]: any
}

export type CircuitClub = {
	clubId?: number
	clubName: string
	clubLogo: string
	total: number
	pointsByPhase: Record<string, number>
	// biome-ignore lint/suspicious/noExplicitAny: Any
	[key: string]: any
}
