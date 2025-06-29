export interface PlayerDataFields {
	id: number;
	name: string;
	birth: string | null;
	sex: boolean | null;
	clubId: number | null;
	locationId: number | null;
}

export interface PlayerAPIResponse {
	dataFields: PlayerDataFields;
	message: string;
}

export interface DatabaseUpdateProps {
	_uuid?: string;
	operation?: string
	status?: number
	table: string
	success?: {
		dataFields?: PlayerDataFields; 
		message?: string
	}
	error?: {
		message: string,
		stack?: string,
	}
}
