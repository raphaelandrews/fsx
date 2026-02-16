import { NextResponse } from "next/server";
import { revalidateTag } from "next/cache";

import { db } from "@/db";
import { players } from "@/db/schema";
import { parseBirthDate } from "@/lib/parse-birth-date";
import { createClient } from "@/utils/supabase/server";
import { getNewId } from "@/lib/db-id-helpers";

interface PlayerCreateRequestBody {
	name: string;
	sex?: boolean;
	clubId?: number | null;
	birth?: string | number | null;
	locationId?: number;
}

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

		const body: PlayerCreateRequestBody = await req.json();

		const { name, birth, sex, clubId, locationId } = body;

		if (!name) {
			return new NextResponse(JSON.stringify({ message: "Missing mandatory field: name." }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

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

		const playerId = await getNewId(players);

		const createData = {
			id: playerId,
			name,
			...(parsedBirth !== null && { birth: parsedBirth }),
			...(sex !== undefined && { sex }),
			...(clubId !== undefined && { clubId: clubId === 0 ? null : clubId }),
			...(locationId !== undefined && { locationId }),
		};

		await db.insert(players).values(createData);

		revalidateTag("players", "max")
		revalidateTag("search-players", "max")

		return new NextResponse(
			JSON.stringify({
				dataFields: createData,
				message: `Player with ID ${playerId} created. Fields: ${Object.keys(createData).join(", ")}`,
			}),
			{
				status: 201,
				headers: {
					"Content-Type": "application/json",
				},
			});
	} catch (error) {
		console.error("Error in POST /api/players:", error);

		if (error instanceof SyntaxError && error.message.includes("JSON")) {
			return new NextResponse(JSON.stringify({ message: `Invalid JSON body. Please ensure your request body is valid JSON: ${error.message}` }), {
				status: 400,
				headers: { "Content-Type": "application/json" },
			});
		}

		if (error instanceof Error) {
			if (error.message.includes("Failed to fetch max player ID") || error.message.includes("Failed to retrieve max player ID (NaN).")) {
				return new NextResponse(JSON.stringify({ message: `Failed to generate player ID: ${error.message}` }), {
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
