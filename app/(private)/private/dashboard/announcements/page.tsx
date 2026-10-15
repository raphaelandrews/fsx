import { desc } from "drizzle-orm"

import { db } from "@/db"
import { announcements } from "@/db/schema"
import { Separator } from "@/components/ui/separator"
import { columns, type AnnouncementTableData } from "./components/columns"
import { DataTable } from "./components/data-table"

async function getAnnouncements() {
	return db
		.select({
			id: announcements.id,
			year: announcements.year,
			number: announcements.number,
			content: announcements.content,
		})
		.from(announcements)
		.orderBy(desc(announcements.year), desc(announcements.number))
}

export default async function Page() {
	const data = await getAnnouncements()

	const tableData: AnnouncementTableData[] = data.map((announcement) => ({
		id: announcement.id,
		year: announcement.year,
		number: announcement.number,
		content: announcement.content,
	}))

	return (
		<div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
			<div>
				<h3 className="font-medium text-lg">Announcements</h3>
				<p className="py-2 text-muted-foreground text-sm">
					Manage announcements
				</p>
			</div>
			<Separator className="mb-5" />
			<DataTable columns={columns} data={tableData} />
		</div>
	)
}
