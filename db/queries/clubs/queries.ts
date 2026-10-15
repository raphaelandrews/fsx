import { asc } from "drizzle-orm"
import { cacheLife, cacheTag } from "next/cache"

import { db } from "@/db"
import { clubs } from "@/db/schema"

export async function getClubs() {
	"use cache"
	cacheTag("clubs")
	cacheLife("weeks")

	return db
		.select({
			id: clubs.id,
			name: clubs.name,
		})
		.from(clubs)
		.orderBy(asc(clubs.name))
}

export type ClubOption = {
	id: number
	name: string
}
