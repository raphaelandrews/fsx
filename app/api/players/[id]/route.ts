import { NextResponse } from "next/server"
import type { z } from "zod"

import { APIPlayerByIdResponseSchema, getPlayerById } from "@/db/queries"

const ALLOWED_ORIGINS = [
	process.env.NEXT_PUBLIC_APP_URL,
	process.env.NEXT_PUBLIC_API_URL,
].filter(Boolean) as string[]; 

const createResponse = (
	data: z.infer<typeof APIPlayerByIdResponseSchema>,
	status = 200,
	requestOrigin?: string | null 
) => {
	const corsHeaders: Record<string, string> = {};

	if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) {
		corsHeaders["Access-Control-Allow-Origin"] = requestOrigin;
	} else if (ALLOWED_ORIGINS.length === 0) {
		corsHeaders["Access-Control-Allow-Origin"] = "*";
	}

	return NextResponse.json(data, {
		status,
		headers: {
			...corsHeaders,
		},
	})}

export async function GET(
	request: Request,
	{ params }: { params: Promise<{ id: string }> }
) {
	const requestOrigin = request.headers.get('Origin'); 
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
				404,
				requestOrigin 
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
				400,
				requestOrigin 
			)
		}

		return createResponse(validation.data, 200, requestOrigin) 
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
			500,
			requestOrigin
		)
	}
}

export async function OPTIONS(request: Request) {
	const requestOrigin = request.headers.get('Origin');
	const corsHeaders: Record<string, string> = {};

	if (requestOrigin && ALLOWED_ORIGINS.includes(requestOrigin)) {
		corsHeaders["Access-Control-Allow-Origin"] = requestOrigin;
		corsHeaders["Access-Control-Allow-Methods"] = "GET,OPTIONS"; 
		corsHeaders["Access-Control-Allow-Headers"] = "Content-Type, Authorization"; 
		corsHeaders["Access-Control-Max-Age"] = "86400"; 
	} else if (ALLOWED_ORIGINS.length === 0) {
		corsHeaders["Access-Control-Allow-Origin"] = "*";
		corsHeaders["Access-Control-Allow-Methods"] = "GET,OPTIONS";
		corsHeaders["Access-Control-Allow-Headers"] = "Content-Type, Authorization";
		corsHeaders["Access-Control-Max-Age"] = "86400";
	}

	return new Response(null, {
		status: 204,
		headers: corsHeaders,
	})
}