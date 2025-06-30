import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { players, playersToTournaments, ratingTypeEnum } from "@/db/schema";
import { getNewId } from "@/lib/db-id-helpers";
import { createClient } from "@/utils/supabase/server";

interface PlayerTournamentUpdateRequestBody {
	tournamentId: number;
	variation: number;
	ratingType: typeof ratingTypeEnum.enumValues[number];
}

type SelectedPlayerFields = {
	id: typeof players.$inferSelect.id;
	name: typeof players.$inferSelect.name;
	blitz?: typeof players.$inferSelect.blitz;
	rapid?: typeof players.$inferSelect.rapid;
	classic?: typeof players.$inferSelect.classic;
};

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const supabase = createClient();

	try {
		const {
			data: { user },
		} = await (await supabase).auth.getUser();

		if (!user) {
			return new NextResponse(JSON.stringify({ message: "Unauthenticated" }), {
				status: 403,
				headers: { "Content-Type": "application/json" },
			});
		}

		const playerId = Number.parseInt((await params).id, 10);
		if (Number.isNaN(playerId) || playerId <= 0) {
			return new NextResponse(JSON.stringify({ message: "Invalid player ID provided in URL. ID must be a positive number." }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const body: PlayerTournamentUpdateRequestBody = await request.json();
		const { tournamentId, variation, ratingType } = body;

		const missingFields = [];
		if (!tournamentId) missingFields.push("tournamentId");
		if (typeof variation !== "number") missingFields.push("variation");
		if (!ratingType) missingFields.push("ratingType");

		if (missingFields.length > 0) {
			return new NextResponse(JSON.stringify({ message: `Missing mandatory fields: ${missingFields.join(", ")}.` }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const validRatingTypes = ratingTypeEnum.enumValues;
		if (!validRatingTypes.includes(ratingType)) {
			return new NextResponse(
				`Invalid rating type '${ratingType}'. Must be one of: ${validRatingTypes.join(", ")}.`,
				{ status: 400 }
			);
		}

		const playerToTournamentId = await getNewId(playersToTournaments);

		const existingPlayer = await db
			.select({ id: players.id, name: players.name, [ratingType]: players[ratingType] })
			.from(players)
			.where(eq(players.id, playerId))
			.limit(1);

		if (!existingPlayer || existingPlayer.length === 0) { 
			return new NextResponse(JSON.stringify({ message: "Player not found." }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		const currentPlayer: SelectedPlayerFields = existingPlayer[0];

		let playerDataForResponse: SelectedPlayerFields | undefined;
		let playerTournamentDataForResponse: typeof playersToTournaments.$inferSelect | undefined;

		await db.transaction(async (tx) => {
			const currentRating = currentPlayer[ratingType];
			if (currentRating === null || currentRating === undefined) {
				throw new Error(`Current rating for type ${ratingType} is null or undefined.`);
			}
			const newRating = currentRating + variation;

			const playerUpdateData: Partial<typeof players.$inferInsert> = {
				[ratingType]: newRating,
				active: true,
			};

			const fieldsToReturn = {
				id: players.id,
				name: players.name,
				blitz: players.blitz,
				rapid: players.rapid,
				classic: players.classic,
			};

			const playerUpdateResult = await tx.update(players)
				.set(playerUpdateData)
				.where(eq(players.id, playerId))
				.returning(fieldsToReturn);

			if (playerUpdateResult.length > 0) {
				playerDataForResponse = playerUpdateResult[0] as SelectedPlayerFields;
			} else {
				throw new Error("Failed to update player record.");
			}

			const oldRatingValue = currentRating;

			const insertData = {
				id: playerToTournamentId,
				playerId: playerId,
				tournamentId: tournamentId,
				variation: variation,
				oldRating: oldRatingValue,
			};

			const result = await tx.insert(playersToTournaments)
				.values(insertData)
				.returning();

			if (result.length > 0) {
				playerTournamentDataForResponse = result[0];
			} else {
				throw new Error("Failed to create new player-tournament record.");
			}
		});

		if (!playerDataForResponse || !playerTournamentDataForResponse) {
			throw new Error("Transaction completed but response data is missing.");
		}

		return new NextResponse(
			JSON.stringify({
				dataFields: {
					player: playerDataForResponse,
					playerTournament: playerTournamentDataForResponse,
				},
				message: `Player ID ${playerId} updated. Player-tournament record created.`,
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
				},
			});

	} catch (error) {
		console.error("Error in PUT /api/players-tournament:", error); 

		if (error instanceof SyntaxError && error.message.includes("JSON")) {
			return new NextResponse(JSON.stringify({ message: `Invalid JSON body. Please ensure your request body is valid JSON: ${error.message}` }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		if (error instanceof Error) {
			return new NextResponse(JSON.stringify({ message: `An internal server error occurred: ${error.message}` }), {
				status: 500,
				headers: { "Content-Type": "application/json" },
			});
		}

		return new NextResponse(JSON.stringify({ message: `An unknown internal error occurred: ${error}` }), {
			status: 500,
			headers: { "Content-Type": "application/json" },
		});
	}
}
