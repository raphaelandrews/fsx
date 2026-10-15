import { notFound } from "next/navigation"

import { getPlayerForEdit, getClubs, getLocations } from "@/db/queries"
import { Separator } from "@/components/ui/separator"
import { PlayerEditor } from "./components/player-editor"

export default async function Page({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = await params
	const playerId = Number(id)

	if (Number.isNaN(playerId)) {
		return notFound()
	}

	const [player, clubs, locations] = await Promise.all([
		getPlayerForEdit(playerId),
		getClubs(),
		getLocations(),
	])

	if (!player) {
		return notFound()
	}

	return (
		<div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
			<div>
				<h3 className="font-medium text-lg">Edit Player</h3>
				<p className="py-2 text-muted-foreground text-sm">
					Update player information
				</p>
			</div>
			<Separator className="mb-5" />
			<PlayerEditor player={player} clubs={clubs} locations={locations} />
		</div>
	)
}
