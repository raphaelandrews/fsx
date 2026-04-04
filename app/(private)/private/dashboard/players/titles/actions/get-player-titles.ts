"use server"

import { eq } from "drizzle-orm"

import { db } from "@/db"
import { playersToTitles, titles } from "@/db/schema"

export async function getPlayerTitles(playerId: number) {
	return db
		.select({
			id: playersToTitles.id,
			playerId: playersToTitles.playerId,
			titleId: playersToTitles.titleId,
			title: titles.title,
			shortTitle: titles.shortTitle,
			type: titles.type,
		})
		.from(playersToTitles)
		.innerJoin(titles, eq(playersToTitles.titleId, titles.id))
		.where(eq(playersToTitles.playerId, playerId))
		.orderBy(titles.title)
}
