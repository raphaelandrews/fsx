import { desc, sql } from "drizzle-orm"
import { cacheLife, cacheTag } from "next/cache"

import { db } from "@/db"
import { players } from "@/db/schema"

const ACCENT_MAP = "áàâãäéèêëíìîïóòôõöúùûüýÿçñ"
const ASCII_MAP = "aaaaaeeeeiiiiooooouuuuyyçn"

function normalizeText(text: string): string {
	return text
		.normalize("NFD")
		.replace(/[\u0300-\u036f]/g, "")
		.toLowerCase()
		.trim()
}

export async function getSearchPlayers(query: string) {
	"use cache"
	cacheTag("players", "search-players")
	cacheLife("weeks")

	const normalizedQuery = normalizeText(query)
	const words = normalizedQuery.split(/\s+/).filter(Boolean)

	if (words.length === 0) {
		return db
			.select({
				id: players.id,
				name: players.name,
			})
			.from(players)
			.orderBy(desc(players.rapid))
			.limit(10)
			.execute()
	}

	const wordConditions = words.map(
		(word) =>
			sql`LOWER(translate(${players.name}, ${ACCENT_MAP}, ${ASCII_MAP})) ILIKE ${`%${word}%`}`
	)

	const whereClause = sql.join(wordConditions, sql` AND `)

	const relevanceScore = sql<number>`
		CASE
			WHEN LOWER(translate(${players.name}, ${ACCENT_MAP}, ${ASCII_MAP})) = ${normalizedQuery} THEN 4
			WHEN LOWER(translate(${players.name}, ${ACCENT_MAP}, ${ASCII_MAP})) ILIKE ${`${words[0]}%`} THEN 3
			WHEN LOWER(translate(${players.name}, ${ACCENT_MAP}, ${ASCII_MAP})) ~ ${`(^|\\s)${words[0]}`} THEN 2
			ELSE 1
		END
	`

	return db
		.select({
			id: players.id,
			name: players.name,
		})
		.from(players)
		.where(whereClause)
		.orderBy(
			desc(relevanceScore),
			desc(players.rapid),
			sql`LENGTH(${players.name})`
		)
		.limit(10)
		.execute()
}
