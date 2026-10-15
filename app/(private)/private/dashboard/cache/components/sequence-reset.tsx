"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { resetSequencesAction, type SequenceResult } from "@/app/actions/reset-sequences"
import { Button } from "@/components/ui/button"

export function SequenceReset() {
	const [results, setResults] = useState<SequenceResult[] | null>(null)
	const [isPending, startTransition] = useTransition()

	function handleReset() {
		startTransition(async () => {
			const result = await resetSequencesAction()
			if (result.success && result.results) {
				setResults(result.results)
				toast.success(`Reset ${result.results.length} sequences`)
			} else {
				toast.error(result.error ?? "Failed to reset sequences")
			}
		})
	}

	return (
		<div className="rounded-lg border bg-card p-4 space-y-4">
			<div className="flex items-center justify-between">
				<div>
					<h2 className="font-semibold text-lg">Sequence Reset</h2>
					<p className="text-muted-foreground text-sm">
						Fix duplicate ID errors by syncing all serial sequences with the current max ID of each table.
					</p>
				</div>
				<Button
					variant="outline"
					onClick={handleReset}
					disabled={isPending}
				>
					{isPending ? "Resetting..." : "Reset All Sequences"}
				</Button>
			</div>

			{results && (
				<div className="rounded-md border overflow-hidden">
					<table className="w-full text-sm">
						<thead className="bg-muted/50">
							<tr>
								<th className="px-3 py-2 text-left font-medium">Table</th>
								<th className="px-3 py-2 text-right font-medium">Max ID</th>
								<th className="px-3 py-2 text-right font-medium">Next insert</th>
							</tr>
						</thead>
						<tbody>
							{results.map((row) => (
								<tr key={row.table} className="border-t">
									<td className="px-3 py-1.5 font-mono text-xs">{row.table}</td>
									<td className="px-3 py-1.5 text-right tabular-nums">
										{row.maxId === 0 ? (
											<span className="text-muted-foreground">empty</span>
										) : (
											row.maxId
										)}
									</td>
									<td className="px-3 py-1.5 text-right tabular-nums text-green-600 dark:text-green-400">
										{row.nextVal}
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			)}
		</div>
	)
}
