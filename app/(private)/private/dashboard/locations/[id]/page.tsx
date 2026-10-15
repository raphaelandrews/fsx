import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { locations } from "@/db/schema"
import { Separator } from "@/components/ui/separator"
import { LocationEditor } from "./components/location-editor"

async function getLocationForEdit(id: number) {
	return db.query.locations.findFirst({
		where: eq(locations.id, id),
	})
}

export default async function Page({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = await params
	const locationId = Number(id)

	if (Number.isNaN(locationId)) {
		return notFound()
	}

	const location = await getLocationForEdit(locationId)

	if (!location) {
		return notFound()
	}

	return (
		<div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
			<div>
				<h3 className="font-medium text-lg">Edit Location</h3>
				<p className="py-2 text-muted-foreground text-sm">
					Update location information
				</p>
			</div>
			<Separator className="mb-5" />
			<LocationEditor location={location} />
		</div>
	)
}
