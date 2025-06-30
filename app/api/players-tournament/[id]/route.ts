import { NextResponse } from "next/server";
import type { PgColumn } from 'drizzle-orm/pg-core';
import { eq, desc, and } from "drizzle-orm";

import { db } from "@/db";
import { players, playersToTournaments } from "@/db/schema";
import { parseBirthDate } from "@/lib/parse-birth-date";
import { createClient } from "@/utils/supabase/server";

interface PlayerUpdateRequestBody {
	sex?: boolean;
	clubId?: number | null;
	birth?: string | number | null;
	locationId?: number;
	tournamentId: number;
	variation: number;
	ratingType: "blitz" | "rapid" | "classic";
}

type SelectedPlayerFields = {
	id: typeof players.$inferSelect.id;
	name: typeof players.$inferSelect.name;
	blitz: typeof players.$inferSelect.blitz;
	rapid: typeof players.$inferSelect.rapid;
	classic: typeof players.$inferSelect.classic;
	birth: typeof players.$inferSelect.birth;
	sex: typeof players.$inferSelect.sex;
	clubId: typeof players.$inferSelect.clubId;
	locationId: typeof players.$inferSelect.locationId;
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

		const existingPlayer = await db.select({
			id: players.id,
			name: players.name,
			blitz: players.blitz,
			rapid: players.rapid,
			classic: players.classic,
			birth: players.birth,
			sex: players.sex,
			clubId: players.clubId,
			locationId: players.locationId,
		}).from(players).where(eq(players.id, playerId)).limit(1);

		if (existingPlayer.length === 0) {
			return new NextResponse(JSON.stringify({ message: "Player not found." }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		const currentPlayer: SelectedPlayerFields = existingPlayer[0];

		const body: PlayerUpdateRequestBody = await request.json();

		const { tournamentId, variation, ratingType, birth, sex, clubId, locationId } = body;

		if (tournamentId === undefined || variation === undefined || ratingType === undefined) {
			return new NextResponse(JSON.stringify({ message: "Missing mandatory fields for player-tournament update: tournamentId, variation, ratingType." }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		type PlayerResponseFields = Omit<SelectedPlayerFields, 'blitz' | 'rapid' | 'classic'>;
		let updatedPlayer: PlayerResponseFields | undefined;

		const playerUpdateData: Partial<typeof players.$inferInsert> = {};
		const fieldsToReturn: Record<string, PgColumn> = {
			id: players.id,
			name: players.name,
		};

		if (birth !== undefined) {
			if (currentPlayer.birth === null) {
				let parsedBirth: Date | null | undefined;
				if (birth !== null && birth !== "" && String(birth).toLowerCase() !== "undefined") {
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
				playerUpdateData.birth = parsedBirth;
				if (players.birth) fieldsToReturn.birth = players.birth;
			}
		}

		if (sex !== undefined) {
			playerUpdateData.sex = sex;
			if (players.sex) fieldsToReturn.sex = players.sex;
		}

		if (clubId !== undefined) {
			playerUpdateData.clubId = clubId === 0 ? null : clubId;
			if (players.clubId) fieldsToReturn.clubId = players.clubId;
		}

		if (locationId !== undefined) {
			if (currentPlayer.locationId === null) {
				playerUpdateData.locationId = locationId;
				if (players.locationId) fieldsToReturn.locationId = players.locationId;
			}
		}

		if (Object.keys(playerUpdateData).length > 0) {
			const result = await db.update(players)
				.set(playerUpdateData)
				.where(eq(players.id, playerId))
				.returning(fieldsToReturn); 

			if (result.length > 0) {
				updatedPlayer = result[0] as unknown as PlayerResponseFields;
			} else {
				throw new Error("Failed to update player record.");
			}
		} else {
			updatedPlayer = {
				id: currentPlayer.id,
				name: currentPlayer.name,
				birth: currentPlayer.birth,
				sex: currentPlayer.sex,
				clubId: currentPlayer.clubId,
				locationId: currentPlayer.locationId,
			};
		}

		let updatedPlayerTournament: typeof playersToTournaments.$inferSelect;
		let playerTournamentOperation: "created" | "updated";

		const existingPlayerTournament = await db
			.select()
			.from(playersToTournaments)
			.where(
				and(
					eq(playersToTournaments.playerId, playerId),
					eq(playersToTournaments.tournamentId, tournamentId),
					eq(playersToTournaments.ratingType, ratingType)
				)
			)
			.limit(1);

		if (existingPlayerTournament.length > 0) {
			const currentPtt = existingPlayerTournament[0];
			if (variation !== currentPtt.variation) {
				const result = await db.update(playersToTournaments)
					.set({ variation: variation })
					.where(eq(playersToTournaments.id, currentPtt.id))
					.returning();

				if (result.length > 0) {
					updatedPlayerTournament = result[0];
					playerTournamentOperation = "updated";
				} else {
					throw new Error("Failed to update player-tournament record.");
				}
			} else {
				updatedPlayerTournament = currentPtt;
				playerTournamentOperation = "updated";
			}
		} else {
			const newPttId = await getNewId(playersToTournaments);

			let currentRating: number | null = null;
			if (ratingType === "blitz") {
				currentRating = currentPlayer.blitz;
			} else if (ratingType === "rapid") {
				currentRating = currentPlayer.rapid;
			} else if (ratingType === "classic") {
				currentRating = currentPlayer.classic;
			}

			const oldRatingValue = currentRating !== null && currentRating !== undefined ? currentRating : 0;

			const insertData = {
				id: newPttId,
				playerId: playerId,
				tournamentId: tournamentId,
				variation: variation,
				ratingType: ratingType,
				oldRating: oldRatingValue,
			};

			const result = await db.insert(playersToTournaments)
				.values(insertData)
				.returning();

			if (result.length > 0) {
				updatedPlayerTournament = result[0];
				playerTournamentOperation = "created";
			} else {
				throw new Error("Failed to create new player-tournament record.");
			}
		}

		return new NextResponse(
			JSON.stringify({
				dataFields: {
					player: updatedPlayer, 
					playerTournament: updatedPlayerTournament,
				},
				message: `Player ID ${playerId} updated. Player-tournament record ${playerTournamentOperation}.`,
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
			if (error.message.includes("Failed to fetch max ID") || error.message.includes("Invalid max ID retrieved (NaN).") || error.message.includes("Failed to generate new ID")) {
				return new NextResponse(JSON.stringify({ message: `Failed to generate ID: ${error.message}` }), {
					status: 500,
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