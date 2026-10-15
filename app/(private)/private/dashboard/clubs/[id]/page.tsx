import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { clubs } from "@/db/schema"
import { Separator } from "@/components/ui/separator"
import { ClubEditor } from "./components/club-editor"

async function getClubForEdit(id: number) {
	return db.query.clubs.findFirst({
		where: eq(clubs.id, id),
	})
}

export default async function Page({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = await params
	const clubId = Number(id)

	if (Number.isNaN(clubId)) {
		return notFound()
	}

	const club = await getClubForEdit(clubId)

	if (!club) {
		return notFound()
	}

	return (
		<div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
			<div>
				<h3 className="font-medium text-lg">Edit Club</h3>
				<p className="py-2 text-muted-foreground text-sm">
					Update club information
				</p>
			</div>
			<Separator className="mb-5" />
			<ClubEditor club={club} />
		</div>
	)
}
