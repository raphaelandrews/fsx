import { asc } from "drizzle-orm"

import { db } from "@/db"
import { clubs } from "@/db/schema"
import { Separator } from "@/components/ui/separator"
import { columns, type ClubTableData } from "./components/columns"
import { DataTable } from "./components/data-table"

async function getClubs() {
	return db
		.select({
			id: clubs.id,
			name: clubs.name,
			logo: clubs.logo,
		})
		.from(clubs)
		.orderBy(asc(clubs.name))
}

export default async function Page() {
	const data = await getClubs()

	const tableData: ClubTableData[] = data.map((club) => ({
		id: club.id,
		name: club.name,
		logo: club.logo,
	}))

	return (
		<div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
			<div>
				<h3 className="font-medium text-lg">Clubs</h3>
				<p className="py-2 text-muted-foreground text-sm">
					Manage chess clubs
				</p>
			</div>
			<Separator className="mb-5" />
			<DataTable columns={columns} data={tableData} />
		</div>
	)
}
