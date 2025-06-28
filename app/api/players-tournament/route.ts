import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

import { db } from "@/db";
import { players, playersToTournaments, ratingTypeEnum } from "@/db/schema";
import { desc } from "drizzle-orm";

export async function POST(req: Request) {
	const supabase = createClient();

	try {
		const {
			data: { user },
		} = await (await supabase).auth.getUser();

		if (!user) {
			return new NextResponse("Unauthenticated", { status: 403 });
		}

		async function getMaxId(
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

		async function getNewId(
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

		const body = await req.json();

		const {
			name,
			birth,
			sex,
			clubId,
			locationId,
			tournamentId,
			variation,
			ratingType,
		} = body;

		const missingFields = [];
		if (!name) missingFields.push("name");
		if (!tournamentId) missingFields.push("tournamentId");
		if (typeof variation !== "number") missingFields.push("variation");
		if (!ratingType) missingFields.push("ratingType");

		if (missingFields.length > 0) {
			return new NextResponse(
				`Missing mandatory fields: ${missingFields.join(", ")}.`,
				{ status: 400 }
			);
		}

		const validRatingTypes = ratingTypeEnum.enumValues;
		if (!validRatingTypes.includes(ratingType)) {
			return new NextResponse(
				`Invalid rating type '${ratingType}'. Must be one of: ${validRatingTypes.join(", ")}.`,
				{ status: 400 }
			);
		}

		const playerId = await getNewId(players);
		const playerToTournamentId = await getNewId(playersToTournaments);

		if (playerId === null || playerToTournamentId === null) {
			return new NextResponse(
				"Failed to generate required IDs for database operations.",
				{ status: 500 }
			);
		}

		const playerInsertData = {
			id: playerId,
			name,
			[ratingType]: 1900 + variation,
			active: true,
			...(birth !== undefined && { birth }),
			...(sex !== undefined && { sex }),
			...(clubId !== undefined && { clubId: clubId === 0 ? null : clubId }),
			...(locationId !== undefined && { locationId }),
		};

		const playerTournamentInsertData = {
			id: playerToTournamentId,
			playerId,
			tournamentId,
			ratingType,
			oldRating: 1900,
			variation,
		};

		await db.transaction(async (tx) => {
			await tx.insert(players).values(playerInsertData);
			console.log(`Jogador ${playerId} criado`);

			await tx.insert(playersToTournaments).values(playerTournamentInsertData);
			console.log(
				`Player to tournament relation ${playerToTournamentId} created for player ${playerId} and tournament ${tournamentId}`
			);
		});

		return new NextResponse(
			JSON.stringify({
				player_id: playerId,
				tournament_relation_id: playerToTournamentId,
				message: `Player to tournament relation ${playerToTournamentId} created for player ${playerId} and tournament ${tournamentId}`,
				created_player_data: playerInsertData,
				created_relation_data: playerTournamentInsertData,
			}),
			{
				status: 201,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	} catch (error) {
		console.error("Error in POST /api/player-tournament-creation:", error);

		if (error instanceof SyntaxError && error.message.includes("JSON")) {
			return new NextResponse(`Invalid JSON body. Please ensure your request body is valid JSON: ${error.message}`, { status: 400 });
		}

		if (error instanceof Error) {
			if (error.message.includes("Failed to fetch max ID") || error.message.includes("Failed to generate new ID")) {
				return new NextResponse(`ID generation error: ${error.message}`, { status: 500 });
			}

			return new NextResponse(`An internal server error occurred: ${error.message}`, {
				status: 500,
			});
		}

		return new NextResponse(`An unknown internal error occurred: ${error}`, {
			status: 500,
		});
	}
}