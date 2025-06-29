export interface DatabaseUpdateProps {
	operation?: string
	status?: number
	table: string
	success?: {
		playerId?: number
		updatedFields?: {
			birth?: string;
			sex?: boolean;
			clubId?: number;
			locationId?: number;
		};
		message?: string
	}
	error?: {
		message: string,
	}
}
