import { notFound } from "next/navigation"
import { eq } from "drizzle-orm"

import { db } from "@/db"
import { linkGroups } from "@/db/schema"
import { Separator } from "@/components/ui/separator"
import { LinkGroupEditor } from "./components/link-group-editor"

async function getLinkGroupForEdit(id: number) {
	return db.query.linkGroups.findFirst({
		where: eq(linkGroups.id, id),
		with: {
			links: {
				orderBy: (links, { asc }) => asc(links.order),
			},
		},
	})
}

export default async function Page({
	params,
}: {
	params: Promise<{ id: string }>
}) {
	const { id } = await params
	const linkGroupId = Number(id)

	if (Number.isNaN(linkGroupId)) {
		return notFound()
	}

	const linkGroup = await getLinkGroupForEdit(linkGroupId)

	if (!linkGroup) {
		return notFound()
	}

	return (
		<div className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
			<div>
				<h3 className="font-medium text-lg">Edit Link Group</h3>
				<p className="py-2 text-muted-foreground text-sm">
					Update link group information and manage links
				</p>
			</div>
			<Separator className="mb-5" />
			<LinkGroupEditor linkGroup={linkGroup} />
		</div>
	)
}
