import * as React from "react"
import { DataTable } from "./data-table"

const SKELETON_KEYS = Array.from({ length: 8 }, () => crypto.randomUUID())

function TableLoadingSkeleton() {
	return (
		<div className="animate-pulse bg-muted rounded-lg h-96 p-4">
			<div className="h-8 bg-muted-foreground/10 rounded mb-4" />
			<div className="space-y-2">
				{/* 🎯 Usamos as chaves únicas geradas acima */}
				{SKELETON_KEYS.map((key) => (
					<div key={key} className="h-6 bg-muted-foreground/10 rounded" />
				))}
			</div>
		</div>
	)
}

export function DataTableWrapper({ columns, data }: any) {
	return (
		<React.Suspense fallback={<TableLoadingSkeleton />}>
			<DataTable columns={columns} data={data} />
		</React.Suspense>
	)
}
