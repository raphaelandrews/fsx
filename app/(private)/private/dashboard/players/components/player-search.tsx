"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { SearchIcon, Loader2Icon, UserIcon } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
	Card,
	CardContent,
} from "@/components/ui/card"
import { searchPlayers } from "../actions/search-players"

type Player = {
	id: number
	name: string
	imageUrl: string | null
}

export function PlayerSearch() {
	const router = useRouter()
	const [query, setQuery] = useState("")
	const [results, setResults] = useState<Player[]>([])
	const [hasSearched, setHasSearched] = useState(false)
	const [isPending, startTransition] = useTransition()

	const handleSearch = () => {
		if (!query.trim()) return

		startTransition(async () => {
			const players = await searchPlayers(query)
			setResults(players)
			setHasSearched(true)
		})
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter") {
			handleSearch()
		}
	}

	return (
		<div className="space-y-6">
			<div className="flex gap-2">
				<div className="relative flex-1">
					<SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						placeholder="Search by name or ID..."
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						onKeyDown={handleKeyDown}
						className="pl-9"
					/>
				</div>
				<Button onClick={handleSearch} disabled={isPending || !query.trim()}>
					{isPending ? (
						<Loader2Icon className="h-4 w-4 animate-spin" />
					) : (
						"Search"
					)}
				</Button>
			</div>

			{isPending && (
				<div className="flex items-center justify-center py-8">
					<Loader2Icon className="h-6 w-6 animate-spin text-muted-foreground" />
				</div>
			)}

			{!isPending && hasSearched && results.length === 0 && (
				<div className="py-8 text-center text-muted-foreground">
					No players found for "{query}"
				</div>
			)}

			{!isPending && results.length > 0 && (
				<div className="space-y-2">
					<p className="text-sm text-muted-foreground">
						{results.length} player{results.length !== 1 ? "s" : ""} found
					</p>
					<div className="grid gap-2">
						{results.map((player) => (
							<Card
								key={player.id}
								className="cursor-pointer transition-colors hover:bg-muted/50"
								onClick={() =>
									router.push(`/private/dashboard/players/${player.id}`)
								}
							>
								<CardContent className="flex items-center gap-4 p-4">
									<div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-muted">
										{player.imageUrl ? (
											<img
												src={player.imageUrl}
												alt={player.name}
												className="h-full w-full object-cover"
											/>
										) : (
											<UserIcon className="h-5 w-5 text-muted-foreground" />
										)}
									</div>
									<div className="flex-1">
										<p className="font-medium">{player.name}</p>
										<p className="text-sm text-muted-foreground">
											ID: {player.id}
										</p>
									</div>
									<Button variant="outline" size="sm">
										Edit
									</Button>
								</CardContent>
							</Card>
						))}
					</div>
				</div>
			)}
		</div>
	)
}
