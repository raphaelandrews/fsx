"use server"

import { sql } from "drizzle-orm"
import { db } from "@/db"

export type SequenceResult = {
	table: string
	maxId: number
	nextVal: number
}

export async function resetSequencesAction(): Promise<{
	success: boolean
	results?: SequenceResult[]
	error?: string
}> {
	try {
		type SeqRow = { table_name: string; sequence_name: string }

		const rows = await db.execute<SeqRow>(sql`
			SELECT
				c.table_name,
				pg_get_serial_sequence(c.table_name, c.column_name) AS sequence_name
			FROM information_schema.columns c
			WHERE c.column_default LIKE 'nextval%'
				AND c.table_schema = 'public'
				AND pg_get_serial_sequence(c.table_name, c.column_name) IS NOT NULL
			ORDER BY c.table_name
		`)

		const results: SequenceResult[] = []

		for (const { table_name, sequence_name } of rows) {
			const result = await db.execute<{ next_val: string }>(
				sql.raw(`
					SELECT setval(
						'${sequence_name}',
						COALESCE((SELECT MAX(id) FROM "${table_name}"), 0) + 1,
						false
					) AS next_val
				`)
			)

			const nextVal = Number(result[0]?.next_val ?? 1)
			results.push({
				table: table_name,
				maxId: nextVal - 1,
				nextVal,
			})
		}

		return { success: true, results }
	} catch (error) {
		console.error("Error resetting sequences:", error)
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		}
	}
}
