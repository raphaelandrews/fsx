export type PlayerDataFields = {
	id: number;
	name: string;
	birth: string | null;
	sex: boolean | null;
	clubId: number | null;
	locationId: number | null;
};

export type SuccessDataFields = PlayerDataFields | {
	player?: PlayerDataFields;
	playerTournament?: PlayerTournamentDataFields;
};

export type PlayerTournamentDataFields = {
	tournamentId: number;
	variation: number;
	oldRating: number;
};

export interface PlayerAPIResponse {
	message: string;
	dataFields: PlayerDataFields | { player: PlayerDataFields; playerTournament: PlayerTournamentDataFields };
}

export type RatingUpdateProps = {
	_uuid: string;
	operation: string;
	status: number;
	error?: { message: string };
	success?: { message: string; dataFields: SuccessDataFields };
};

export type ExcelDataRow = [
	string | number | undefined | null,
	string | undefined | null,
	string | undefined | null,
	boolean | string | undefined | null,
	number | undefined | null,
	number | undefined | null,
	number | undefined | null,
	number | undefined | null,
	string | undefined | null
];

export type ExcelContent = [string[], ...ExcelDataRow[]];
