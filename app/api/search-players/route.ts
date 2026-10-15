import { NextResponse } from "next/server"
import type { z } from "zod"

import { APISearchPlayersResponseSchema, getSearchPlayers } from "@/db/queries"

const createResponse = (
	data: z.infer<typeof APISearchPlayersResponseSchema>,
	status = 200
) => NextResponse.json(data, { status })

export async function GET(request: Request) {
	try {
		const { searchParams } = new URL(request.url)
		const query = searchParams.get("q") || ""
		const searchQuery = await getSearchPlayers(query)

		console.info("Searching players with query:", query)

		if (!searchQuery) {
			return createResponse(
				{
					success: false,
					error: { code: 404, message: "Players not found" },
				},
				404
			)
		}

		const validation = APISearchPlayersResponseSchema.safeParse({
			success: true,
			data: searchQuery,
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

		if (validation.data.success && validation.data.data.length === 0) {
			return createResponse({
				success: true,
				data: [],
			})
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
