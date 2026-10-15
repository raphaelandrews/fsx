import { desc } from "drizzle-orm"

import { db } from "@/db"
import { events } from "@/db/schema"
import { Separator } from "@/components/ui/separator"
import { columns, type EventTableData } from "./components/columns"
import { DataTable } from "./components/data-table"

async function getEvents() {
	return db
		.select({
			id: events.id,
			name: events.name,
			startDate: events.startDate,
			endDate: events.endDate,
			type: events.type,
			timeControl: events.timeControl,
		})
		.from(events)
		.orderBy(desc(events.startDate))
}

export default async function Page() {
	const data = await getEvents()

	const tableData: EventTableData[] = data.map((event) => ({
		id: event.id,
		name: event.name,
		startDate: event.startDate,
		endDate: event.endDate,
		type: event.type,
		timeControl: event.timeControl,
	}))

	return (
		<div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
			<div>
				<h3 className="font-medium text-lg">Events</h3>
				<p className="py-2 text-muted-foreground text-sm">
					Manage chess events
				</p>
			</div>
			<Separator className="mb-5" />
			<DataTable columns={columns} data={tableData} />
		</div>
	)
}
