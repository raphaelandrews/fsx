import { asc } from "drizzle-orm"

import { db } from "@/db"
import { linkGroups } from "@/db/schema"
import { Separator } from "@/components/ui/separator"
import { columns, type LinkGroupTableData } from "./components/columns"
import { DataTable } from "./components/data-table"

async function getLinkGroups() {
	return db.query.linkGroups.findMany({
		columns: { id: true, label: true },
		with: {
			links: {
				columns: { id: true },
			},
		},
		orderBy: asc(linkGroups.id),
	})
}

export default async function Page() {
	const data = await getLinkGroups()

	const tableData: LinkGroupTableData[] = data.map((group) => ({
		id: group.id,
		label: group.label,
		linksCount: group.links.length,
	}))

	return (
		<div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
			<div>
				<h3 className="font-medium text-lg">Link Groups</h3>
				<p className="py-2 text-muted-foreground text-sm">
					Manage link groups and their links
				</p>
			</div>
			<Separator className="mb-5" />
			<DataTable columns={columns} data={tableData} />
		</div>
	)
}
