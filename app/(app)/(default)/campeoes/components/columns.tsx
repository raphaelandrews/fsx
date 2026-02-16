"use client"

import type { ColumnDef } from "@tanstack/react-table"

import { Actions } from "./actions"
import type { Tournament } from "@/db/queries"

// biome-ignore lint/suspicious/noExplicitAny: No
export const columns: ColumnDef<any>[] = [
	{
		accessorKey: "date",
		header: "Ano",
		cell: ({ row }) => {
			const date = row.original.date
			return <div>{date ? date.slice(0, 4) : "-"}</div>
		},
	},
	{
		accessorKey: "champions",
		header: "Campeão",
		cell: ({ row }) => {
			const podiums = row.original.tournamentPodiums
			const champion = podiums?.[0]?.player
			const championTeam = podiums?.[1]?.player

			if (podiums?.[3]?.player) {
				return (
					<div className="flex items-center gap-3">
						<Actions
							id={champion.id}
							image={champion.imageUrl}
							name={champion.name}
							nickname={champion.nickname}
							shortTitle={champion.playersToTitles?.[0]?.title.shortTitle}
						/>
						<Actions
							id={championTeam.id}
							image={championTeam.imageUrl}
							name={championTeam.name}
							nickname={championTeam.nickname}
							shortTitle={championTeam.playersToTitles?.[0]?.title.shortTitle}
						/>
					</div>
				)
			}
			return (
				<>
					{champion && (
						<Actions
							id={champion.id}
							image={champion.imageUrl}
							name={champion.name}
							nickname={champion.nickname}
							shortTitle={champion.playersToTitles?.[0]?.title.shortTitle}
						/>
					)}
				</>
			)
		},
	},
	{
		accessorKey: "runner-up",
		header: "Vice",
		cell: ({ row }) => {
			const podiums = row.original.tournamentPodiums
			const runnerUp = podiums?.[1]?.player
			const runnerUpTeam = podiums?.[2]?.player
			const teamRunnerUp = podiums?.[3]?.player

			if (teamRunnerUp) {
				return (
					<div className="flex items-center gap-3">
						<Actions
							id={teamRunnerUp.id}
							image={teamRunnerUp.imageUrl}
							name={teamRunnerUp.name}
							nickname={teamRunnerUp.nickname}
							shortTitle={teamRunnerUp.playersToTitles?.[0]?.title.shortTitle}
						/>
						{runnerUpTeam && (
							<Actions
								id={runnerUpTeam.id}
								image={runnerUpTeam.imageUrl}
								name={runnerUpTeam.name}
								nickname={runnerUpTeam.nickname}
								shortTitle={runnerUpTeam.playersToTitles?.[0]?.title.shortTitle}
							/>
						)}
					</div>
				)
			}
			return (
				<>
					{runnerUp && (
						<Actions
							id={runnerUp.id}
							image={runnerUp.imageUrl}
							name={runnerUp.name}
							nickname={runnerUp.nickname}
							shortTitle={runnerUp.playersToTitles?.[0]?.title.shortTitle}
						/>
					)}
					{!runnerUp && <p>-</p>}
				</>
			)
		},
	},
]
