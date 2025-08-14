import { NextResponse } from "next/server";
import type { PgColumn } from "drizzle-orm/pg-core";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { players, playersToTournaments, tournaments, ratingTypeEnum } from "@/db/schema";
import { getNewId } from "@/lib/db-id-helpers";
import { createClient } from "@/utils/supabase/server";
import { parseBirthDate } from "@/lib/parse-birth-date";

interface PlayerTournamentUpdateRequestBody {
	tournamentId: number;
	variation: number;
	ratingType: typeof ratingTypeEnum.enumValues[number];
	birth?: string | number | null;
	sex?: boolean;
	clubId?: number | null;
	locationId?: number;
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

		const player = await db.select({
			birth: players.birth,
			locationId: players.locationId,
			name: players.name,
			id: players.id,
		}).from(players).where(eq(players.id, playerId)).limit(1);

		if (player.length === 0) {
			return new NextResponse(JSON.stringify({ message: "Player not found." }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		const currentLocationId = player[0].locationId;
		const currentName = player[0].name;

		const body: PlayerTournamentUpdateRequestBody = await request.json();

		const { tournamentId, variation, ratingType, birth, sex, clubId, locationId } = body;

		const missingFields = [];
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
					message: `Rating type mismatch. Tournament uses '${tournament[0].ratingType}' rating, but update attempted with '${ratingType}'.`
				}),
				{
					status: 400,
					headers: { "Content-Type": "application/json" },
				}
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
		let updateData: Partial<typeof players.$inferInsert> = {};

		const fieldsToReturn: Record<string, PgColumn> = {
			id: players.id,
			name: players.name,
			[ratingType]: players[ratingType],
		};

		await db.transaction(async (tx) => {
			const currentRating = currentPlayer[ratingType];
			if (currentRating === null || currentRating === undefined) {
				throw new Error(`Current rating for type ${ratingType} is null or undefined.`);
			}
			const newRating = currentRating + variation;

			updateData = {
				[ratingType]: newRating,
				active: true,
			};

			if (birth !== undefined) {
				let parsedBirth: Date | null | undefined;
				try {
					parsedBirth = parseBirthDate(birth);
				} catch (error) {
					if (error instanceof Error) {
						throw error;
					}
					throw error;
				}
				if (parsedBirth !== null) {
					updateData.birth = parsedBirth;
				}
				if (players.birth) fieldsToReturn.birth = players.birth;
			}
			if (sex !== undefined) {
				updateData.sex = sex;
				if (players.sex) fieldsToReturn.sex = players.sex;
			}
			if (clubId !== undefined) {
				updateData.clubId = clubId === 0 ? null : clubId;
				if (players.clubId) fieldsToReturn.clubId = players.clubId;
			}
			if (locationId !== undefined) {
				if (currentLocationId === null) {
					updateData.locationId = locationId;
					if (players.locationId) fieldsToReturn.locationId = players.locationId;
				}
			}

			const playerUpdateResult = await tx.update(players)
				.set(updateData)
				.where(eq(players.id, playerId))
				.returning(fieldsToReturn);

			if (playerUpdateResult.length > 0) {
				playerDataForResponse = playerUpdateResult[0] as unknown as SelectedPlayerFields;
			} else {
				throw new Error("Failed to update player record.");
			}

			const oldRatingValue = currentPlayer[ratingType];
			if (typeof oldRatingValue !== 'number') {
				throw new Error(`Invalid old rating value for type ${ratingType}`);
			}

			const insertData = {
				id: playerToTournamentId,
				playerId: playerId,
				tournamentId: tournamentId,
				variation: variation,
				oldRating: oldRatingValue,
			} as const;

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

		const updatedFields = Object.keys(updateData).filter(key => key !== ratingType && key !== 'active');
		const fieldsList = [...updatedFields, 'rating', 'tournament'].filter(Boolean);

		return new NextResponse(
			JSON.stringify({
				dataFields: {
					player: playerDataForResponse,
					playerTournament: playerTournamentDataForResponse,
				},
				message: `Player ${currentName} - ID ${playerId} Updated. Fields: ${fieldsList.join(", ")}`,
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);

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
