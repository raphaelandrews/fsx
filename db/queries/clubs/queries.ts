import { asc } from "drizzle-orm"
import { db } from "@/db"
import { clubs } from "@/db/schema"
import { unstable_cache } from "@/lib/unstable_cache"

export const getClubs = unstable_cache(
	async () =>
		db
			.select({
				id: clubs.id,
				name: clubs.name,
			})
			.from(clubs)
			.orderBy(asc(clubs.name)),
	["get-clubs"],
	{
		revalidate: 60 * 60 * 24 * 30,
		tags: ["clubs"],
	}
)

export type ClubOption = {
	id: number
	name: string
}
