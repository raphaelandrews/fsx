import { asc } from "drizzle-orm"

import { db } from "@/db"
import { titles } from "@/db/schema"
import { Separator } from "@/components/ui/separator"
import { PlayerTitlesManager } from "./components/player-titles-manager"

async function getAllTitles() {
	return db
		.select({
			id: titles.id,
			title: titles.title,
			shortTitle: titles.shortTitle,
			type: titles.type,
		})
		.from(titles)
		.orderBy(asc(titles.title))
}

export default async function Page() {
	const allTitles = await getAllTitles()

	return (
		<div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
			<div>
				<h3 className="font-medium text-lg">Player Titles</h3>
				<p className="py-2 text-muted-foreground text-sm">
					Search a player and manage their title assignments
				</p>
			</div>
			<Separator className="mb-5" />
			<PlayerTitlesManager allTitles={allTitles} />
		</div>
	)
}
