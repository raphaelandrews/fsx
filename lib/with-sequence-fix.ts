import { sql } from "drizzle-orm"
import { db } from "@/db"

function isPrimaryKeyViolation(error: unknown): boolean {
	if (typeof error !== "object" || error === null) return false
	const err = error as Record<string, unknown>
	const constraintName = (err.constraint_name ?? err.constraint ?? "") as string
	return err.code === "23505" && constraintName.endsWith("_pkey")
}

async function fixSequence(tableName: string): Promise<void> {
	await db.execute(sql.raw(`
		SELECT setval(
			pg_get_serial_sequence('${tableName}', 'id'),
			COALESCE((SELECT MAX(id) FROM "${tableName}"), 0) + 1,
			false
		)
	`))
}

export async function withSequenceFix<T>(
	tableName: string,
	insertFn: () => Promise<T>
): Promise<T> {
	try {
		return await insertFn()
	} catch (error) {
		if (isPrimaryKeyViolation(error)) {
			await fixSequence(tableName)
			return await insertFn()
		}
		throw error
	}
}
