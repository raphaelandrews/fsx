import { asc } from "drizzle-orm"
import { cacheLife, cacheTag } from "next/cache"

import { db } from "@/db"
import { locations } from "@/db/schema"

export async function getLocations() {
	"use cache"
	cacheTag("locations")
	cacheLife("weeks")

	return db
		.select({
			id: locations.id,
			name: locations.name,
		})
		.from(locations)
		.orderBy(asc(locations.name))
}

export type LocationOption = {
	id: number
	name: string
}
