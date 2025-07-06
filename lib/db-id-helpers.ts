import { db } from "@/db";
import type { players, playersToTournaments } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function getMaxId(
	table: typeof players | typeof playersToTournaments
): Promise<number> {
	try {
		const result = await db
			.select({ id: table.id })
			.from(table)
			.orderBy(desc(table.id))
			.limit(1);

		return result.length > 0 ? result[0].id : 0;
	} catch (error) {
		console.error(`Error fetching max ID for table ${table._.name}:`, error);
		throw new Error(`Failed to fetch max ID for table ${table._.name}: ${error}`);
	}
}

export async function getNewId(
	table: typeof players | typeof playersToTournaments
): Promise<number> {
	try {
		const maxId = await getMaxId(table);
		if (Number.isNaN(maxId)) {
			throw new Error("Invalid max ID retrieved (NaN).");
		}
		return maxId + 1;
	} catch (error) {
		console.error(`Error generating new ID for table ${table._.name}:`, error);
		throw new Error(`Failed to generate new ID for table ${table._.name}: ${error}`);
	}
}