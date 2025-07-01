export interface PlayerDataFields {
	id: number;
	name: string;
	birth: string | null;
	sex: boolean | null;
	clubId: number | null;
	locationId: number | null;
}

export interface PlayerTournamentDataFields {
	id: number;
	playerId: number;
	tournamentId: number;
	variation: number;
	oldRating: number;
}

export interface PlayerAPIResponse {
	message: string;
	dataFields: PlayerDataFields | { player: PlayerDataFields; playerTournament: PlayerTournamentDataFields };
}

export interface DatabaseUpdateProps {
	_uuid?: string;
	operation: string;
	table: string;
	status?: number;
	success?: {
		dataFields: PlayerDataFields | { player: PlayerDataFields; playerTournament: PlayerTournamentDataFields };
		message: string;
	};
	error?: {
		message: string;
		stack?: string;
	};
}