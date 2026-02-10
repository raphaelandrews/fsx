import { asc } from "drizzle-orm"
import { db } from "@/db"
import { locations } from "@/db/schema"
import { unstable_cache } from "@/lib/unstable_cache"

export const getLocations = unstable_cache(
	async () =>
		db
			.select({
				id: locations.id,
				name: locations.name,
			})
			.from(locations)
			.orderBy(asc(locations.name)),
	["get-locations"],
	{
		revalidate: 60 * 60 * 24 * 30,
		tags: ["locations"],
	}
)

export type LocationOption = {
	id: number
	name: string
}
