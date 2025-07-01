import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { players, playersToTournaments, tournaments, ratingTypeEnum } from "@/db/schema";
import { getNewId } from "@/lib/db-id-helpers";
import { parseBirthDate } from "@/lib/parse-birth-date";
import { createClient } from "@/utils/supabase/server";

interface PlayerTournamentCreateRequestBody {
	name: string;
	sex?: boolean;
	clubId?: number | null;
	birth?: string | number | null;
	locationId?: number;
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
	active: typeof players.$inferSelect.active;
	birth: typeof players.$inferSelect.birth;
	sex: typeof players.$inferSelect.sex;
	clubId: typeof players.$inferSelect.clubId;
	locationId: typeof players.$inferSelect.locationId;
};

export async function POST(req: Request) {
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

		const body: PlayerTournamentCreateRequestBody = await req.json();

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
				JSON.stringify({ message: `Missing mandatory fields: ${missingFields.join(", ")}.` }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				}
			);
		}

		if (!Number.isInteger(variation)) {
			return new NextResponse(
				JSON.stringify({ message: "Variation must be an integer." }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				}
			);
		}

		if (variation < -100 || variation > 100) {
			return new NextResponse(
				JSON.stringify({
					message: "Variation must be between -100 and 100 points."
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				}
			);
		}

		const validRatingTypes = ratingTypeEnum.enumValues;
		if (!validRatingTypes.includes(ratingType)) {
			return new NextResponse(
				JSON.stringify({ message: `Invalid rating type '${ratingType}'. Must be one of: ${validRatingTypes.join(", ")}.` }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				}
			);
		}

		if (tournamentId <= 0 || !Number.isInteger(tournamentId)) {
			return new NextResponse(
				JSON.stringify({ message: "Tournament ID must be a positive integer." }),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				}
			);
		}

		const tournament = await db
			.select({ ratingType: tournaments.ratingType })
			.from(tournaments)
			.where(eq(tournaments.id, tournamentId))
			.limit(1);

		if (!tournament || tournament.length === 0) {
			return new NextResponse(
				JSON.stringify({ message: "Tournament not found." }),
				{
					status: 404,
					headers: { "Content-Type": "application/json" },
				}
			);
		}

		if (tournament[0].ratingType !== ratingType) {
			return new NextResponse(
				JSON.stringify({
					message: `Rating type mismatch. Tournament uses '${tournament[0].ratingType}' rating, but creation attempted with '${ratingType}'.`
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				}
			);
		}

		const playerId = await getNewId(players);
		const playerToTournamentId = await getNewId(playersToTournaments);
		const oldRating = 1900;

		let parsedBirth: Date | null = null;

		if (birth !== null && birth !== undefined && birth !== "" && String(birth).toLowerCase() !== "undefined") {
			try {
				parsedBirth = parseBirthDate(birth);
			} catch (error) {
				if (error instanceof Error) {
					return new NextResponse(JSON.stringify({ message: error.message }), {
						status: 400,
						headers: { "Content-Type": "application/json" },
					});
				}
				throw error;
			}
		}

		const playerInsertData = {
			id: playerId,
			name,
			[ratingType]: oldRating + variation,
			active: true,
			...(parsedBirth !== null && { birth: parsedBirth }),
			...(sex !== undefined && { sex }),
			...(clubId !== undefined && { clubId: clubId === 0 ? null : clubId }),
			...(locationId !== undefined && { locationId }),
		};

		const playerTournamentInsertData = {
			id: playerToTournamentId,
			playerId,
			tournamentId,
			oldRating: oldRating,
			variation,
		};

		let playerDataForResponse: SelectedPlayerFields | undefined;
		let playerTournamentDataForResponse: typeof playersToTournaments.$inferSelect | undefined;

		const fieldsToReturn = {
			id: players.id,
			name: players.name,
			[ratingType]: players[ratingType],
			active: players.active,
			birth: players.birth,
			sex: players.sex,
			clubId: players.clubId,
			locationId: players.locationId,
		};

		await db.transaction(async (tx) => {
			const playerResult = await tx.insert(players).values(playerInsertData).returning(fieldsToReturn);

			if (playerResult.length > 0) {
				playerDataForResponse = playerResult[0] as SelectedPlayerFields;
			} else {
				throw new Error("Failed to create player record.");
			}

			const playerToTournamentResult = await tx.insert(playersToTournaments).values(playerTournamentInsertData).returning();

			if (playerToTournamentResult.length > 0) {
				playerTournamentDataForResponse = playerToTournamentResult[0];
			} else {
				throw new Error("Failed to create player-tournament record.");
			}
		});

		if (!playerDataForResponse || !playerTournamentDataForResponse) {
			throw new Error("Transaction completed but response data is missing.");
		}
		console.log(`player: ${playerDataForResponse}`, `playerTournament: ${playerTournamentDataForResponse}`)
		return new NextResponse(
			JSON.stringify({
				dataFields: {
					player: playerDataForResponse,
					playerTournament: playerTournamentDataForResponse,
				},
				message: `Player created and tournament relation ${playerToTournamentId} created for player ${playerId} and tournament ${tournamentId}.`,
			}),
			{
				status: 201,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	} catch (error) {
		console.error("Error in POST /api/players-tournament:", error);

		if (error instanceof SyntaxError && error.message.includes("JSON")) {
			return new NextResponse(JSON.stringify({ message: `Invalid JSON body. Please ensure your request body is valid JSON: ${error.message}` }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		if (error instanceof Error) {
			if (error.message.includes("Failed to fetch max ID") || error.message.includes("Failed to generate new ID")) {
				return new NextResponse(JSON.stringify({ message: `ID generation error: ${error.message}` }), {
					status: 500,
					headers: { "Content-Type": "application/json" },
				});
			}

			if (error.message.includes("Invalid birth date format")) {
				return new NextResponse(JSON.stringify({ message: `Bad Request: ${error.message}` }), {
					status: 400,
					headers: { "Content-Type": "application/json" },
				});
			}

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