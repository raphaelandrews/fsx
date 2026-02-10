"use server"

import { desc, sql, eq, or } from "drizzle-orm"
import { db } from "@/db"
import { players } from "@/db/schema"

function normalizeText(text: string): string {
	return text
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
}

export async function searchPlayers(query: string) {
	const trimmedQuery = query.trim()

	if (!trimmedQuery) {
		return []
	}

	const numericQuery = Number(trimmedQuery)
	const isNumeric = !Number.isNaN(numericQuery) && trimmedQuery.length > 0

	const normalizedQuery = normalizeText(trimmedQuery)

	const results = await db
		.select({
			id: players.id,
			name: players.name,
			imageUrl: players.imageUrl,
		})
		.from(players)
		.where(
			isNumeric
				? or(
						eq(players.id, numericQuery),
						sql`LOWER(${players.name}) ILIKE ${`%${trimmedQuery}%`}`,
						sql`LOWER(translate(${players.name}, 'áàâãäéèêëíìîïóòôõöúùûüýÿ', 'aaaaaeeeeiiiiooooouuuuyy')) ILIKE ${`%${normalizedQuery}%`}`
					)
				: or(
						sql`LOWER(${players.name}) ILIKE ${`%${trimmedQuery}%`}`,
						sql`LOWER(translate(${players.name}, 'áàâãäéèêëíìîïóòôõöúùûüýÿ', 'aaaaaeeeeiiiiooooouuuuyy')) ILIKE ${`%${normalizedQuery}%`}`
					)
		)
		.orderBy(desc(players.rapid))
		.limit(20)

	return results
}
