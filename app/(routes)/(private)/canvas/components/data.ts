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

export const mockResponses = {
	success: [
		{ playerId: 1, oldRating: 1900, variation: 20, message: "Success" },
	],
	errors: [
		{
			message: "Duplicate key violation",
			stack:
				'Error: duplicate key value violates unique constraint "users_email_key"\n    at Connection.parseE (/node_modules/pg/lib/connection.js:673:13)\n    at Connection.parseMessage (/node_modules/pg/lib/connection.js:500:19)',
		},
		{
			message: "Foreign key constraint violation",
			stack:
				'Error: insert or update on table "profiles" violates foreign key constraint\n    at Query.handleError (/node_modules/pg/lib/query.js:146:12)\n    at Query.submit (/node_modules/pg/lib/query.js:190:22)',
		},
		{
			message: "Connection timeout",
			stack:
				"Error: Connection terminated due to connection timeout\n    at Connection.<anonymous> (/node_modules/pg/lib/client.js:132:73)\n    at Object.onceWrapper (events.js:421:28)",
		},
		{
			message: "Table does not exist",
			stack:
				'Error: relation "invalid_table" does not exist\n    at Parser.parseErrorMessage (/node_modules/pg-protocol/src/parser.ts:369:69)\n    at Parser.handlePacket (/node_modules/pg-protocol/src/parser.ts:188:21)',
		},
	],
}

export const getOperationIcon = (operation: string) => {
	switch (operation) {
		case "Create Record":
			return "👤"
		case "Update Record":
			return "✏️"
		case "Insert Data":
			return "📦"
		case "Delete Record":
			return "🗑️"
		case "Update Status":
			return "🔄"
		case "Bulk Insert":
			return "📊"
		case "Update Index":
			return "🔍"
		default:
			return "💾"
	}
}
