"use client"

import { useState } from "react"
import {
	DownloadIcon,
	Loader2Icon,
	CheckCircle2Icon,
	CircleIcon,
	AlertCircleIcon,
	DatabaseIcon,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"

const TABLES = [
	"announcements",
	"championships",
	"circuitPhases",
	"circuitPodiums",
	"circuits",
	"clubs",
	"cupBrackets",
	"cupGames",
	"cupGroups",
	"cupMatches",
	"cupPlayers",
	"cupPlayoffs",
	"cupRounds",
	"cups",
	"defendingChampions",
	"events",
	"insignias",
	"linkGroups",
	"links",
	"locations",
	"norms",
	"players",
	"playersToInsignias",
	"playersToNorms",
	"playersToRoles",
	"playersToTitles",
	"playersToTournaments",
	"posts",
	"roles",
	"titles",
	"tournamentPodiums",
	"tournaments",
] as const

type TableName = (typeof TABLES)[number]
type TableStatus = "pending" | "loading" | "done" | "error"

type TableState = {
	status: TableStatus
	count?: number
	error?: string
}

function formatBytes(bytes: number) {
	if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
	return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function formatNumber(n: number) {
	return n.toLocaleString()
}

const initialStates = (): Record<TableName, TableState> =>
	Object.fromEntries(TABLES.map((t) => [t, { status: "pending" }])) as Record<
		TableName,
		TableState
	>

export default function Page() {
	const [tableStates, setTableStates] = useState<Record<TableName, TableState>>(
		initialStates
	)
	const [running, setRunning] = useState(false)
	const [done, setDone] = useState(false)
	const [totalRows, setTotalRows] = useState(0)
	const [fileSize, setFileSize] = useState<number | null>(null)
	const [currentTable, setCurrentTable] = useState<string | null>(null)

	const completedCount = Object.values(tableStates).filter(
		(s) => s.status === "done" || s.status === "error"
	).length

	const progressPct =
		running || done ? Math.round((completedCount / TABLES.length) * 100) : 0

	function setTable(table: TableName, state: TableState) {
		setTableStates((prev) => ({ ...prev, [table]: state }))
	}

	async function handleBackup() {
		setRunning(true)
		setDone(false)
		setTotalRows(0)
		setFileSize(null)
		setCurrentTable(null)
		setTableStates(initialStates())

		// biome-ignore lint/suspicious/noExplicitAny: backup accumulator
		const backupData: Record<string, any[]> = {}
		let rowsTotal = 0

		for (const table of TABLES) {
			setCurrentTable(table)
			setTable(table, { status: "loading" })

			try {
				const res = await fetch(
					`/private/dashboard/backup/download?table=${table}`
				)
				if (!res.ok) throw new Error(`HTTP ${res.status}`)
				const { count, rows } = await res.json()

				backupData[table] = rows
				rowsTotal += count
				setTable(table, { status: "done", count })
				setTotalRows(rowsTotal)
			} catch (err) {
				setTable(table, {
					status: "error",
					error: err instanceof Error ? err.message : "Failed",
				})
			}
		}

		setCurrentTable(null)

		const backup = {
			exportedAt: new Date().toISOString(),
			tables: backupData,
		}

		const json = JSON.stringify(backup, null, 2)
		const blob = new Blob([json], { type: "application/json" })
		setFileSize(blob.size)

		const url = URL.createObjectURL(blob)
		const a = document.createElement("a")
		a.href = url
		a.download = `backup-${new Date().toISOString().split("T")[0]}.json`
		a.click()
		URL.revokeObjectURL(url)

		setRunning(false)
		setDone(true)
	}

	const hasStarted = running || done

	return (
		<div className="mx-auto max-w-3xl p-4 sm:p-6 lg:p-8">
			<div>
				<h3 className="font-medium text-lg">Backup</h3>
				<p className="py-2 text-muted-foreground text-sm">
					Downloads all data from every table as a single JSON file. Each table
					is fetched individually to avoid timeouts.
				</p>
			</div>
			<Separator className="mb-5" />

			<div className="space-y-4">
				{/* Progress bar */}
				{hasStarted && (
					<div className="space-y-1.5">
						<div className="flex items-center justify-between text-sm">
							<span className="text-muted-foreground">
								{done
									? "All tables exported"
									: currentTable
										? `Fetching ${currentTable}…`
										: "Starting…"}
							</span>
							<span className="tabular-nums font-medium">
								{completedCount}/{TABLES.length}
							</span>
						</div>
						<div className="h-2 w-full overflow-hidden rounded-full bg-muted">
							<div
								className="h-full rounded-full bg-primary transition-all duration-300"
								style={{ width: `${progressPct}%` }}
							/>
						</div>
					</div>
				)}

				{/* Summary when done */}
				{done && fileSize !== null && (
					<div className="flex items-center gap-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300">
						<CheckCircle2Icon className="h-4 w-4 shrink-0" />
						<div>
							<p className="font-medium">Backup downloaded successfully</p>
							<p className="text-xs opacity-75">
								{formatNumber(totalRows)} rows across {TABLES.length} tables —{" "}
								{formatBytes(fileSize)}
							</p>
						</div>
					</div>
				)}

				{/* Tables grid */}
				<div className="rounded-lg border">
					<div className="flex items-center justify-between border-b px-4 py-3">
						<div className="flex items-center gap-2">
							<DatabaseIcon className="h-4 w-4 text-muted-foreground" />
							<span className="text-sm font-medium">Tables</span>
						</div>
						{!hasStarted && (
							<Badge variant="secondary">{TABLES.length} tables</Badge>
						)}
						{hasStarted && (
							<span className="text-xs text-muted-foreground tabular-nums">
								{formatNumber(totalRows)} rows so far
							</span>
						)}
					</div>
					<div className="grid grid-cols-2 divide-x divide-y sm:grid-cols-3">
						{TABLES.map((table) => {
							const state = tableStates[table]
							return (
								<div
									key={table}
									className="flex items-center justify-between gap-2 px-3 py-2"
								>
									<div className="flex min-w-0 items-center gap-2">
										{state.status === "pending" && (
											<CircleIcon className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40" />
										)}
										{state.status === "loading" && (
											<Loader2Icon className="h-3.5 w-3.5 shrink-0 animate-spin text-blue-500" />
										)}
										{state.status === "done" && (
											<CheckCircle2Icon className="h-3.5 w-3.5 shrink-0 text-green-500" />
										)}
										{state.status === "error" && (
											<AlertCircleIcon className="h-3.5 w-3.5 shrink-0 text-destructive" />
										)}
										<span className="truncate font-mono text-xs">{table}</span>
									</div>
									{state.status === "done" && state.count !== undefined && (
										<span className="shrink-0 tabular-nums text-xs text-muted-foreground">
											{formatNumber(state.count)}
										</span>
									)}
								</div>
							)
						})}
					</div>
				</div>

				<Button onClick={handleBackup} disabled={running}>
					{running ? (
						<>
							<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
							Exporting…
						</>
					) : (
						<>
							<DownloadIcon className="mr-2 h-4 w-4" />
							{done ? "Download Again" : "Download Backup"}
						</>
					)}
				</Button>
			</div>
		</div>
	)
}
