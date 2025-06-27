import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

import { db } from "@/db"
import { players, playersToTournaments, ratingTypeEnum } from "@/db/schema"
import { eq, desc } from "drizzle-orm"

interface PlayerUpdateRequestBody {
	birth?: Date
	sex?: boolean
	clubId?: number | null
	locationId?: number
	tournamentId: number
	variation: number
	ratingType: "blitz" | "rapid" | "classic"
	active: boolean
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const supabase = createClient()

	const {
		data: { session },
	} = await (await supabase).auth.getSession()

	if (!session?.user?.id) {
		return new NextResponse("Unauthenticated", { status: 403 })
	}

	const playerId = Number.parseInt((await params).id, 10)
	if (Number.isNaN(playerId) || playerId <= 0) {
		return new NextResponse("Invalid player ID provided in URL.", {
			status: 400,
		})
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
				return null
			}
			return maxId + 1
		} catch (error) {
			console.error("Error generating new ID:", error)
			return null
		}
	}

	const body: PlayerUpdateRequestBody = await request.json()

	const {
		birth,
		sex,
		clubId,
		locationId,
		tournamentId,
		variation,
		ratingType,
		active,
	} = body

	const missingFields = []
	if (!tournamentId) missingFields.push("tournamentId")
	if (typeof variation !== "number") missingFields.push("variation")
	if (!ratingType) missingFields.push("ratingType")

	if (missingFields.length > 0) {
		return new NextResponse(
			`Missing mandatory fields: ${missingFields.join(", ")}`,
			{ status: 400 }
		)
	}

	if (!ratingTypeEnum.enumValues.includes(ratingType)) {
		return new NextResponse(
			`Invalid rating type. Must be one of: ${ratingTypeEnum.enumValues.join(", ")}`,
			{ status: 400 }
		)
	}

	try {
		const result = await db.transaction(async (tx) => {
			const playerDetails = await tx
				.select({
					blitz: players.blitz,
					rapid: players.rapid,
					classic: players.classic,
					locationId: players.locationId,
					birth: players.birth,
				})
				.from(players)
				.where(eq(players.id, playerId))
				.limit(1)

			if (playerDetails.length === 0) {
				tx.rollback()
				return new NextResponse("Player not found.", { status: 404 })
			}

			const currentPlayer = playerDetails[0]
			const oldRating = currentPlayer[ratingType]

			if (oldRating === undefined || oldRating === null) {
				tx.rollback()
				return new NextResponse(
					`Rating type '${ratingType}' not found for player.`,
					{ status: 404 }
				)
			}

			const playerToTournamentId = await getNewId(playersToTournaments)
			if (playerToTournamentId === null) {
				tx.rollback()
				return new NextResponse(
					"Failed to generate player-tournament relation ID.",
					{ status: 500 }
				)
			}

			const playerUpdateData: Partial<typeof players.$inferInsert> = {
				[ratingType]: oldRating + variation,
				...(active !== undefined && { active }),
				...(sex !== undefined && { sex }),
				...(clubId !== undefined && { clubId: clubId === 0 ? null : clubId }),
				...(locationId !== undefined &&
					currentPlayer.locationId === null && { locationId }),
				...(birth !== undefined && currentPlayer.birth === null && { birth }),
			}

			await tx
				.update(players)
				.set(playerUpdateData)
				.where(eq(players.id, playerId))

			const playerTournamentInsertData = {
				id: playerToTournamentId,
				playerId,
				tournamentId,
				ratingType,
				oldRating,
				variation,
			}

			await tx.insert(playersToTournaments).values(playerTournamentInsertData)

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
		})

		if (result instanceof NextResponse) {
			return result
		}

		return new NextResponse("Unexpected transaction result.", { status: 500 })
	} catch (error) {
		console.error("Error during player update transaction:", error)
		return new NextResponse("Internal server error during player update.", {
			status: 500,
		})
	}
}
