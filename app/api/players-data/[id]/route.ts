import { NextResponse } from "next/server";
import type { PgColumn } from 'drizzle-orm/pg-core';
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { players } from "@/db/schema";
import { parseBirthDate } from "@/lib/parse-birth-date";
import { createClient } from "@/utils/supabase/server";

interface PlayerUpdateRequestBody {
	birth?: string | number | null;
	sex?: boolean;
	clubId?: number | null;
	locationId?: number;
}

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

		const body: PlayerUpdateRequestBody = await request.json();

		const updateData: Partial<typeof players.$inferInsert> = {};

		const fieldsToReturn: Record<string, PgColumn> = {};

		if (body.birth !== undefined) {
			let parsedBirth: Date | null | undefined;
			try {
				parsedBirth = parseBirthDate(body.birth);
			} catch (error) {
				if (error instanceof Error) {
					return new NextResponse(JSON.stringify({ message: error.message }), {
						status: 400,
						headers: { "Content-Type": "application/json" },
					});
				}
				throw error;
			}
			if (parsedBirth !== null) {
				updateData.birth = parsedBirth;
			}
			if (players.birth) fieldsToReturn.birth = players.birth;
		}
		if (body.sex !== undefined) {
			updateData.sex = body.sex;
			if (players.sex) fieldsToReturn.sex = players.sex;
		}
		if (body.clubId !== undefined) {
			updateData.clubId = body.clubId === 0 ? null : body.clubId;
			if (players.clubId) fieldsToReturn.clubId = players.clubId;
		}
		if (body.locationId !== undefined) {
			if (currentLocationId === null) {
				updateData.locationId = body.locationId;
				if (players.locationId) fieldsToReturn.locationId = players.locationId;
			}
		}

		if (Object.keys(updateData).length === 0) {
			return new NextResponse(JSON.stringify({ message: "No valid fields provided for update or fields are already set. At least one field (birth, sex, clubId, locationId) must be present and eligible for update." }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		const result = await db
			.update(players)
			.set(updateData)
			.where(eq(players.id, playerId))
			.returning(fieldsToReturn);

		if (result.length === 0) {
			return new NextResponse(JSON.stringify({ message: "Player not found with the provided ID or no changes were required." }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		return new NextResponse(
			JSON.stringify({
				dataFields: {
					id: playerId,
					name: currentName,
					...result[0],
				},
				message: `Player ${currentName} - ID ${playerId} Updated. Fields: ${Object.keys(updateData).join(", ")}`,
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
				},
			}
		);
	} catch (error) {
		console.error("Error in PUT /api/players/[id]:", error);

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
