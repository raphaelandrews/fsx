import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { events } from "@/db/schema"
import { Separator } from "@/components/ui/separator"
import { EventEditor } from "./components/event-editor"

async function getEventForEdit(id: number) {
	return db.query.events.findFirst({
		where: eq(events.id, id),
	})
}

export default async function Page({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = await params
	const eventId = Number(id)

	if (Number.isNaN(eventId)) {
		return notFound()
	}

	const event = await getEventForEdit(eventId)

	if (!event) {
		return notFound()
	}

	return (
		<div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
			<div>
				<h3 className="font-medium text-lg">Edit Event</h3>
				<p className="py-2 text-muted-foreground text-sm">
					Update event information
				</p>
			</div>
			<Separator className="mb-5" />
			<EventEditor event={event} />
		</div>
	)
}
