import { asc } from "drizzle-orm"

import { db } from "@/db"
import { locations } from "@/db/schema"
import { Separator } from "@/components/ui/separator"
import { columns, type LocationTableData } from "./components/columns"
import { DataTable } from "./components/data-table"

async function getLocations() {
	return db
		.select({
			id: locations.id,
			name: locations.name,
			type: locations.type,
			flag: locations.flag,
		})
		.from(locations)
		.orderBy(asc(locations.name))
}

export default async function Page() {
	const data = await getLocations()

	const tableData: LocationTableData[] = data.map((location) => ({
		id: location.id,
		name: location.name,
		type: location.type,
		flag: location.flag,
	}))

	return (
		<div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
			<div>
				<h3 className="font-medium text-lg">Locations</h3>
				<p className="py-2 text-muted-foreground text-sm">
					Manage locations
				</p>
			</div>
			<Separator className="mb-5" />
			<DataTable columns={columns} data={tableData} />
		</div>
	)
}
