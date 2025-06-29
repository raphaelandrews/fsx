import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

import { db } from "@/db";
import { players } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { PgColumn } from 'drizzle-orm/pg-core';


interface PlayerUpdateRequestBody {
	sex?: boolean;
	clubId?: number | null;
	birth?: string | number | null;
	locationId?: number;
	active?: boolean;
	name?: string;
}

export async function PUT(
	request: Request,
	{ params }: { params: { id: string } }
) {
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

		const body: PlayerUpdateRequestBody = await request.json();

		const updateData: Partial<typeof players.$inferInsert> = {};

		const fieldsToReturn: Record<string, PgColumn> = {};

		if (body.birth !== undefined) {
			let dateValue: Date | null = null;

			if (typeof body.birth === 'string' && body.birth) {
				const parsed = new Date(body.birth);
				if (!Number.isNaN(parsed.getTime())) {
					dateValue = parsed;
				}
			} else if (typeof body.birth === 'number') {
				const excelEpoch = new Date(Date.UTC(1899, 11, 30));
				const msPerDay = 24 * 60 * 60 * 1000;
				const parsed = new Date(excelEpoch.getTime() + (body.birth * msPerDay));
				if (!Number.isNaN(parsed.getTime())) {
					dateValue = parsed;
				}
			} else if (body.birth === null) {
				dateValue = null;
			}
			updateData.birth = dateValue;
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
			updateData.locationId = body.locationId;
			if (players.locationId) fieldsToReturn.locationId = players.locationId;
		}
		if (body.active !== undefined) {
			updateData.active = body.active;
			if (players.active) fieldsToReturn.active = players.active;
		}
		if (body.name !== undefined) {
			updateData.name = body.name;
			if (players.name) fieldsToReturn.name = players.name;
		}

		if (Object.keys(updateData).length === 0) {
			return new NextResponse(JSON.stringify({ message: "No valid fields provided for update. At least one field (birth, sex, clubId, locationId, active, name) must be present." }), {
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
				playerId,
				updatedFields: result[0],
				message: `Player ${playerId} updated. Fields: ${Object.keys(updateData).join(", ")}`,
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
