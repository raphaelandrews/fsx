import { queryOptions } from "@tanstack/react-query"
import axios from "redaxios"

import { APIPlayerByIdResponseSchema } from "./schema"
import { API_URL } from "@/lib/utils"

export const fetchPlayerById = async ({ data: id }: { data: number }) => {
	console.info(`Fetching player by id=${id}... @${API_URL}/player/${id}`)

	try {
		const response = await axios.get(`${API_URL}/players/${id}`)
		const parsed = APIPlayerByIdResponseSchema.safeParse(response.data)

		if (!parsed.success) {
			console.error("Validation error:", parsed.error)
			throw new Error("Invalid API response format")
		}

		if (!parsed.data.success) {
			throw new Error(parsed.data.error.message)
		}

		return parsed.data.data
	} catch (error: unknown) {
		console.error(`Error fetching player ${id}:`, error)
		const message =
			error instanceof Error ? error.message : `Failed to fetch player ${id}`
		throw new Error(message)
	}
}

export const playerByIdQueryOptions = (id: number) =>
	queryOptions({
		queryKey: ["player", { id }],
		queryFn: () => fetchPlayerById({ data: id }),
		refetchOnWindowFocus: false,
		refetchOnMount: false,
		refetchOnReconnect: false,
		staleTime: 1000 * 60 * 60 * 24 * 2,
		gcTime: 1000 * 60 * 60 * 24 * 2,
		retry: (failureCount, error: Error) => {
			if (error.message.includes("Invalid API")) return false
			return failureCount < 2
		},
	})
