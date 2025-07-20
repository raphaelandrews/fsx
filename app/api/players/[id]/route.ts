import { NextResponse } from "next/server"
import type { z } from "zod"

import { APIPlayerByIdResponseSchema, getPlayerById } from "@/db/queries"

const createResponse = (
	data: z.infer<typeof APIPlayerByIdResponseSchema>,
	status = 200
) => NextResponse.json(data, { status })

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	try {
		const { id } = await params
		console.info(`Fetching player ${id} from ${request.url}`)

		const player = await getPlayerById(Number(id))

		if (!player) {
			return createResponse(
				{
					success: false,
					error: { code: 404, message: `Player ${id} not found` },
				},
				404
			)
		}

		const validation = APIPlayerByIdResponseSchema.safeParse({
			success: true,
			data: player,
		})

		if (!validation.success) {
			console.error("Validation failed:", validation.error)
			return createResponse(
				{
					success: false,
					error: {
						code: 400,
						message: "Invalid data format",
						details: validation.error.errors,
					},
				},
				400
			)
		}

		return createResponse(validation.data)
	} catch (error: unknown) {
		const details =
			process.env.NODE_ENV === "development"
				? error instanceof Error
					? error.message
					: String(error)
				: undefined

		console.error("[ERROR]:", error)
		return createResponse(
			{
				success: false,
				error: {
					code: 500,
					message: "Internal server error",
					details,
				},
			},
			500
		)
	}
}

export async function OPTIONS() {
	return new Response(null, {
		status: 204,
	})
}
