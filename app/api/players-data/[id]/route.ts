import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"

import { db } from "@/db"
import { players } from "@/db/schema"
import { eq } from "drizzle-orm"

interface PlayerUpdateRequestBody {
	sex?: boolean
	clubId?: number | null
	birth?: Date
	locationId?: number
	active: boolean
}

export async function PUT(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const supabase = createClient()

	const {
		data: { session },
	} = await (await supabase).auth.getSession()

	if (!session?.user?.id) {
		return new NextResponse("Unauthenticated", { status: 403 })
	}

	const playerId = Number.parseInt((await params).id, 10)
	if (Number.isNaN(playerId) || playerId <= 0) {
		return new NextResponse("Invalid player ID provided.", { status: 400 })
	}

	const body: PlayerUpdateRequestBody = await request.json()

	const updateData: Partial<typeof players.$inferInsert> = {}

	if (body.birth !== undefined) {
		updateData.birth = body.birth
	}
	if (body.sex !== undefined) {
		updateData.sex = body.sex
	}
	if (body.clubId !== undefined) {
		updateData.clubId = body.clubId === 0 ? null : body.clubId
	}
	if (body.locationId !== undefined) {
		updateData.locationId = body.locationId
	}

	if (body.active !== undefined) {
		updateData.active = body.active
	}

	if (Object.keys(updateData).length === 0) {
		return new NextResponse("No valid fields provided for update.", {
			status: 400,
		})
	}

	try {
		const result = await db
			.update(players)
			.set(updateData)
			.where(eq(players.id, playerId))

		if (result.length === 0) {
			return new NextResponse("Player not found or no changes made.", {
				status: 404,
			})
		}

		console.log(`Jogador ${playerId} atualizado`)

		return new NextResponse(
			JSON.stringify({
				player_id: playerId,
				message: "Player updated successfully",
			}),
			{
				status: 200,
				headers: {
					"Content-Type": "application/json",
				},
			}
		)
	} catch (error) {
		console.error("Error updating player:", error)
		return new NextResponse("Internal server error during player update.", {
			status: 500,
		})
	}
}
