export interface Cup {
	id: number
	name: string
	image_url: string
	start_date: string
	end_date: string
	prize_pool: number
	rhythm: string
	cup_groups: CupGroup[]
	cup_brackets: CupBracket[]
}

export interface CupGroup {
	id: number
	name: string
	order: number
	cup_rounds: CupRound[]
	cup_players: CupPlayer[]
}

export interface CupBracket {
	bracket_type: string
	cup_playoffs: CupPlayoff[]
}

export interface CupRound {
	order: number
	cup_matches: CupMatch[]
}

export interface CupPlayer {
	id: number
	players: CupPlayerInfo
	nickname: string | null
	position: number | null
}

export interface CupMatch {
	id: number
	date: string
	order: number
	best_of: number
	cup_games: CupGame[]
	player_one_id: CupPlayerInfo
	player_two_id: CupPlayerInfo
	winner_id: CupPlayerInfo | null
}

export interface CupPlayerInfo {
	id?: number | null
	name: string
	image_url: string | null
}

export interface CupGame {
	id: number
	game_number: number
	winner_id: number | null
	link: string
}

export interface CupPlayoff {
	order: number
	phase_type: string
	cup_matches: CupMatch[]
}
