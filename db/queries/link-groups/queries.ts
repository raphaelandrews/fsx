import { cacheLife, cacheTag } from "next/cache"

import { db } from "@/db"

export async function getLinkGroups() {
	"use cache"
	cacheTag("link-groups")
	cacheLife("weeks")

	return db.query.linkGroups.findMany({
		columns: {
			id: true,
			label: true,
		},
		with: {
			links: {
				columns: {
					href: true,
					label: true,
					icon: true,
					order: true,
				},
				orderBy: (links, { asc }) => asc(links.order),
			},
		},
		orderBy: (linksGroups, { asc }) => asc(linksGroups.id),
	})
}
