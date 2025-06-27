import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

import { db } from "@/db"
import { players, playersToTournaments, ratingTypeEnum } from "@/db/schema"
import { desc } from "drizzle-orm"

export async function POST(req: Request) {
	const supabase = createClient()

	const {
		data: { session },
	} = await (await supabase).auth.getSession()

	if (!session?.user?.id) {
		return new NextResponse("Unauthenticated", { status: 403 })
	}

	async function getMaxId(
		table: typeof players | typeof playersToTournaments
	): Promise<number | null> {
		try {
			const result = await db
				.select({ id: table.id })
				.from(table)
				.orderBy(desc(table.id))
				.limit(1)

			return result.length > 0 ? result[0].id : 0
		} catch (error) {
			console.error("Error fetching max ID:", error)
			return null
		}
	}

	async function getNewId(
		table: typeof players | typeof playersToTournaments
	): Promise<number | null> {
		try {
			const maxId = await getMaxId(table)
			if (maxId === null || Number.isNaN(maxId)) {
				throw new Error("Failed to retrieve max ID")
			}
			return maxId + 1
		} catch (error) {
			console.error("Error generating new ID:", error)
			return null
		}
	}

	const body = await req.json()

	const {
		name,
		birth,
		sex,
		clubId,
		locationId,
		tournamentId,
		variation,
		ratingType,
	} = body

	const missingFields = []
	if (!name) missingFields.push("name")
	if (!tournamentId) missingFields.push("tournamentId")
	if (typeof variation !== "number") missingFields.push("variation")
	if (!ratingType) missingFields.push("ratingType")

	if (missingFields.length > 0) {
		return new NextResponse(
			`Missing mandatory fields: ${missingFields.join(", ")}`,
			{ status: 400 }
		)
	}

	const validRatingTypes = ratingTypeEnum.enumValues
	if (!validRatingTypes.includes(ratingType)) {
		return new NextResponse(
			`Invalid rating type. Must be one of: ${validRatingTypes.join(", ")}`,
			{ status: 400 }
		)
	}

	const playerId = await getNewId(players)
	const playerToTournamentId = await getNewId(playersToTournaments)

	if (playerId === null || playerToTournamentId === null) {
		return new NextResponse(
			"Failed to generate required IDs for database operations.",
			{ status: 500 }
		)
	}

	const playerInsertData = {
		id: playerId,
		name,
		[ratingType]: 1900 + variation,
		active: true,
		...(birth !== undefined && { birth }),
		...(sex !== undefined && { sex }),
		...(clubId !== undefined && clubId !== 0 && { clubId }),
		...(locationId !== undefined && { locationId }),
	}

	const playerTournamentInsertData = {
		id: playerToTournamentId,
		playerId,
		tournamentId,
		ratingType,
		oldRating: 1900,
		variation,
	}

	try {
		await db.transaction(async (tx) => {
			await tx.insert(players).values(playerInsertData)
			console.log(`Jogador ${playerId} criado`)

			await tx.insert(playersToTournaments).values(playerTournamentInsertData)
			console.log(
				`Player to tournament relation ${playerToTournamentId} created for player ${playerId} and tournament ${tournamentId}`
			)
		})

		return new NextResponse(
			JSON.stringify({
				player_id: playerId,
				tournament_relation_id: playerToTournamentId,
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
				},
			}
		)
	} catch (error) {
		console.error(
			"Error during transaction (player/player-tournament creation):",
			error
		)
		return new NextResponse("Internal error", { status: 500 })
	}
}
