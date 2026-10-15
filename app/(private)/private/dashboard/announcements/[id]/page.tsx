import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { announcements } from "@/db/schema"
import { Separator } from "@/components/ui/separator"
import { AnnouncementEditor } from "./components/announcement-editor"

async function getAnnouncementForEdit(id: number) {
	return db.query.announcements.findFirst({
		where: eq(announcements.id, id),
	})
}

export default async function Page({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = await params
	const announcementId = Number(id)

	if (Number.isNaN(announcementId)) {
		return notFound()
	}

	const announcement = await getAnnouncementForEdit(announcementId)

	if (!announcement) {
		return notFound()
	}

	return (
		<div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
			<div>
				<h3 className="font-medium text-lg">Edit Announcement</h3>
				<p className="py-2 text-muted-foreground text-sm">
					Update announcement information
				</p>
			</div>
			<Separator className="mb-5" />
			<AnnouncementEditor announcement={announcement} />
		</div>
	)
}
