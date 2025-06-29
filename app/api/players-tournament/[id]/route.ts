import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

import { db } from "@/db";
import { players, playersToTournaments, ratingTypeEnum } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import type { PgColumn } from 'drizzle-orm/pg-core';

interface PlayerUpdateRequestBody {
	birth?: Date;
	sex?: boolean;
	clubId?: number | null;
	locationId?: number;
	tournamentId: number;
	variation: number;
	ratingType: "blitz" | "rapid" | "classic";
	active?: boolean;
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
	const supabase = createClient();

	try {
		const {
			data: { user },
		} = await (await supabase).auth.getUser();

		if (!user) {
			return new NextResponse("Unauthenticated", { status: 403 });
		}

		const playerId = Number.parseInt((await params).id, 10);
		if (Number.isNaN(playerId) || playerId <= 0) {
			return new NextResponse(JSON.stringify({ message: "Invalid player ID provided in URL. ID must be a positive number." }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
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

		const body: PlayerUpdateRequestBody = await request.json();

		const {
			birth,
			sex,
			clubId,
			locationId,
			tournamentId,
			variation,
			ratingType,
			active,
		} = body;

		const missingFields = [];
		if (!tournamentId) missingFields.push("tournamentId");
		if (typeof variation !== "number") missingFields.push("variation");
		if (!ratingType) missingFields.push("ratingType");

		if (missingFields.length > 0) {
			return new NextResponse(
				`Missing mandatory fields in request body: ${missingFields.join(", ")}.`,
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

		const transactionResult = await db.transaction(async (tx) => {
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
				.limit(1);

			if (playerDetails.length === 0) {
				throw new Error("Player not found.");
			}

			const currentPlayer = playerDetails[0];
			const oldRating = currentPlayer[ratingType];

			if (oldRating === undefined || oldRating === null) {
				throw new Error(`Rating type '${ratingType}' not found for player.`);
			}

			const playerToTournamentId = await getNewId(playersToTournaments);

			const playerUpdateData: Partial<typeof players.$inferInsert> = {
				[ratingType]: oldRating + variation,
			};

			const playerFieldsToReturn: Record<string, PgColumn> = {
				id: players.id,
				[ratingType]: players[ratingType],
			};

			if (active !== undefined) {
				playerUpdateData.active = active;
				if (players.active) playerFieldsToReturn.active = players.active;
			}
			if (sex !== undefined) {
				playerUpdateData.sex = sex;
				if (players.sex) playerFieldsToReturn.sex = players.sex;
			}
			if (clubId !== undefined) {
				playerUpdateData.clubId = clubId === 0 ? null : clubId;
				if (players.clubId) playerFieldsToReturn.clubId = players.clubId;
			}
			if (locationId !== undefined && currentPlayer.locationId === null) {
				playerUpdateData.locationId = locationId;
				if (players.locationId) playerFieldsToReturn.locationId = players.locationId;
			}
			if (birth !== undefined && currentPlayer.birth === null) {
				playerUpdateData.birth = birth;
				if (players.birth) playerFieldsToReturn.birth = players.birth;
			}

			const updatedPlayerResult = await tx
				.update(players)
				.set(playerUpdateData)
				.where(eq(players.id, playerId))
				.returning(playerFieldsToReturn);

			if (updatedPlayerResult.length === 0) {
				throw new Error(`No rows updated for player ${playerId}. This might be due to conditional updates or player not found (though player was checked).`);
			}

			const playerTournamentInsertData = {
				id: playerToTournamentId,
				playerId,
				tournamentId,
				ratingType,
				oldRating,
				variation,
			};

			await tx.insert(playersToTournaments).values(playerTournamentInsertData);

			console.log(`Jogador ${playerId} atualizado e relação com torneio ${tournamentId} criada/atualizada.`);

			return {
				playerId,
				playerToTournamentId,
				updatedPlayerData: updatedPlayerResult.length > 0 ? updatedPlayerResult[0] : null,
				insertedRelationData: playerTournamentInsertData,
			};
		});

		return new NextResponse(
			JSON.stringify({
				player_id: transactionResult.playerId,
				tournament_relation_id: transactionResult.playerToTournamentId,
				message: `Jogador ${playerId} atualizado e relação com torneio ${tournamentId} criada/atualizada.`,
				updated_player_data: transactionResult.updatedPlayerData,
				created_relation_data: transactionResult.insertedRelationData,
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	} catch (error) {
		console.error("Error in PUT /api/player-tournament-update:", error);

		if (error instanceof SyntaxError && error.message.includes("JSON")) {
			return new NextResponse(`Invalid JSON body. Please ensure your request body is valid JSON: ${error.message}`, { status: 400 });
		}

		if (error instanceof Error) {
			if (error.message.includes("Player not found")) {
				return new NextResponse(error.message, { status: 404 });
			}
			if (error.message.includes("Rating type") && error.message.includes("not found for player")) {
				return new NextResponse(error.message, { status: 404 });
			}
			if (error.message.includes("No rows updated for player")) {
				return new NextResponse(error.message, { status: 404 });
			}
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