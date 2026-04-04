import type { NextRequest } from "next/server"

import { db } from "@/db"
import {
	announcements,
	championships,
	circuitPhases,
	circuitPodiums,
	circuits,
	clubs,
	cupBrackets,
	cupGames,
	cupGroups,
	cupMatches,
	cupPlayers,
	cupPlayoffs,
	cupRounds,
	cups,
	defendingChampions,
	events,
	insignias,
	linkGroups,
	links,
	locations,
	norms,
	players,
	playersToInsignias,
	playersToNorms,
	playersToRoles,
	playersToTitles,
	playersToTournaments,
	posts,
	roles,
	titles,
	tournamentPodiums,
	tournaments,
} from "@/db/schema"

// biome-ignore lint/suspicious/noExplicitAny: table map requires any
const TABLE_MAP: Record<string, any> = {
	announcements,
	championships,
	circuitPhases,
	circuitPodiums,
	circuits,
	clubs,
	cupBrackets,
	cupGames,
	cupGroups,
	cupMatches,
	cupPlayers,
	cupPlayoffs,
	cupRounds,
	cups,
	defendingChampions,
	events,
	insignias,
	linkGroups,
	links,
	locations,
	norms,
	players,
	playersToInsignias,
	playersToNorms,
	playersToRoles,
	playersToTitles,
	playersToTournaments,
	posts,
	roles,
	titles,
	tournamentPodiums,
	tournaments,
}

export async function GET(request: NextRequest) {
	const table = request.nextUrl.searchParams.get("table")

	if (!table || !TABLE_MAP[table]) {
		return Response.json({ error: "Unknown table" }, { status: 400 })
	}

	const rows = await db.select().from(TABLE_MAP[table])

	return Response.json({ table, count: rows.length, rows })
}
