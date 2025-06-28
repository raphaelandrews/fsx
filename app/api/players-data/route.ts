import { NextResponse } from "next/server";
import { sql } from "drizzle-orm";

import { db } from "@/db";
import { players } from "@/db/schema";
import { createClient } from "@/utils/supabase/server";

export async function POST(req: Request) {
	const supabase = createClient();

	try {
		const {
			data: { user },
		} = await (await supabase).auth.getUser();

		if (!user) {
			return new NextResponse("Unauthenticated", { status: 403 });
		}

		async function maxPlayerId() {
			try {
				const result = await db
					.select({ id: players.id })
					.from(players)
					.orderBy(sql`${players.id} DESC`)
					.limit(1);

				return result.length > 0 ? result[0].id : 0;
			} catch (error) {
				console.error("Error fetching max player ID:", error);
				throw new Error(`Failed to fetch max player ID: ${error}`);
			}
		}

		async function newPlayerId() {
			try {
				const maxId = await maxPlayerId();
				if (maxId === null || Number.isNaN(maxId)) {
					throw new Error("Failed to retrieve max player ID.");
				}
				return maxId + 1;
			} catch (error) {
				console.error("Error generating new player ID:", error);
				throw new Error(`Failed to generate new player ID: ${error}`);
			}
		}

		const body = await req.json();

		const { name, birth, sex, clubId, locationId } = body;

		if (!name) {
			return new NextResponse("Missing mandatory field: name", { status: 400 });
		}

		const playerId = await newPlayerId();

		if (playerId === null) {
			return new NextResponse("Failed to generate player ID", { status: 500 });
		}

		const createData = {
			id: playerId,
			name,
			...(birth !== undefined && { birth }),
			...(sex !== undefined && { sex }),
			...(clubId !== undefined && clubId !== 0 && { clubId }),
			...(locationId !== undefined && { locationId }),
		};

		await db.insert(players).values(createData);

		console.log(`Jogador ${playerId} criado`);

		return new NextResponse(JSON.stringify(createData), {
			status: 200,
			headers: {
				"Content-Type": "application/json",
			},
		});
	} catch (error) {
		console.error("Error in POST /api/players:", error);

		if (error instanceof SyntaxError && error.message.includes("JSON")) {
			return new NextResponse(`Invalid JSON body. Please ensure your request body is valid JSON: ${error.message}`, { status: 400 });
		}

		if (error instanceof Error) {
			if (error.message.includes("Failed to fetch max player ID") || error.message.includes("Failed to generate new player ID")) {
				return new NextResponse(`Failed to fetch max player ID: ${error.message}`, { status: 500 });
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
