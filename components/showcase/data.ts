export interface DatabaseUpdateProps {
	id: string
	operation: string
	table: string
	status: "pending" | "success" | "error"
	// biome-ignore lint/suspicious/noExplicitAny: No
	response?: any
	error?: {
		message: string
		stack: string
	}
	duration?: number
	description: string
}

export const mockUpdates: Omit<
	DatabaseUpdateProps,
	"status" | "response" | "error" | "duration"
>[] = [
	{
		id: "1",
		operation: "Create Record",
		table: "users",
		description: "New user registration from signup form",
	},
	{
		id: "2",
		operation: "Update Record",
		table: "profiles",
		description: "User profile information updated",
	},
	{
		id: "3",
		operation: "Insert Data",
		table: "orders",
		description: "New order placed by customer",
	},
	{
		id: "4",
		operation: "Delete Record",
		table: "sessions",
		description: "Expired session cleanup",
	},
	{
		id: "5",
		operation: "Update Status",
		table: "products",
		description: "Product inventory status change",
	},
	{
		id: "6",
		operation: "Bulk Insert",
		table: "analytics",
		description: "Batch analytics data processing",
	},
	{
		id: "7",
		operation: "Update Index",
		table: "search",
		description: "Search index optimization",
	},
]

export const mockResponses = {
	success: [
		{ affected_rows: 1, id: "usr_123", created_at: "2024-01-15T10:30:00Z" },
		{ affected_rows: 2, updated_fields: ["name", "email"] },
		{ inserted_id: "ord_456", total: 299.99 },
		{ deleted_count: 3 },
		{ updated_rows: 1, price: 149.99 },
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
