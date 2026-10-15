"use client"

import { useState, useTransition } from "react"
import {
	SearchIcon,
	Loader2Icon,
	UserIcon,
	TrashIcon,
	PlusIcon,
	PencilIcon,
} from "lucide-react"
import { toast } from "sonner"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { searchPlayers } from "../../actions/search-players"
import { getPlayerTitles } from "../actions/get-player-titles"
import { addPlayerTitle } from "../actions/add-player-title"
import { removePlayerTitle } from "../actions/remove-player-title"
import { updatePlayerTitle } from "../actions/update-player-title"

type AllTitle = {
	id: number
	title: string
	shortTitle: string
	type: "internal" | "external"
}

type PlayerSearchResult = {
	id: number
	name: string
	imageUrl: string | null
}

type PlayerTitleRelation = {
	id: number
	playerId: number
	titleId: number
	title: string
	shortTitle: string
	type: "internal" | "external"
}

interface PlayerTitlesManagerProps {
	allTitles: AllTitle[]
}

export function PlayerTitlesManager({ allTitles }: PlayerTitlesManagerProps) {
	const [searchQuery, setSearchQuery] = useState("")
	const [searchResults, setSearchResults] = useState<PlayerSearchResult[]>([])
	const [hasSearched, setHasSearched] = useState(false)
	const [selectedPlayer, setSelectedPlayer] = useState<PlayerSearchResult | null>(null)
	const [playerTitles, setPlayerTitles] = useState<PlayerTitleRelation[]>([])

	const [isPendingSearch, startSearch] = useTransition()
	const [isPendingTitles, startLoadTitles] = useTransition()

	const [selectedTitleToAdd, setSelectedTitleToAdd] = useState("")
	const [isAdding, setIsAdding] = useState(false)

	const [relationToDelete, setRelationToDelete] = useState<PlayerTitleRelation | null>(null)
	const [isRemoving, setIsRemoving] = useState(false)

	const [relationToUpdate, setRelationToUpdate] = useState<PlayerTitleRelation | null>(null)
	const [selectedTitleToUpdate, setSelectedTitleToUpdate] = useState("")
	const [isUpdating, setIsUpdating] = useState(false)

	const handleSearch = () => {
		if (!searchQuery.trim()) return
		startSearch(async () => {
			const results = await searchPlayers(searchQuery)
			setSearchResults(results)
			setHasSearched(true)
		})
	}

	const handleSelectPlayer = (player: PlayerSearchResult) => {
		setSelectedPlayer(player)
		setSearchResults([])
		setHasSearched(false)
		setSearchQuery(player.name)
		setSelectedTitleToAdd("")
		startLoadTitles(async () => {
			const titles = await getPlayerTitles(player.id)
			setPlayerTitles(titles)
		})
	}

	const assignedTitleIds = playerTitles.map((pt) => pt.titleId)
	const availableTitlesToAdd = allTitles.filter((t) => !assignedTitleIds.includes(t.id))

	const handleAddTitle = async () => {
		if (!selectedPlayer || !selectedTitleToAdd) return
		setIsAdding(true)
		const result = await addPlayerTitle(selectedPlayer.id, Number(selectedTitleToAdd))
		if (result.success) {
			toast.success("Title added")
			const titles = await getPlayerTitles(selectedPlayer.id)
			setPlayerTitles(titles)
			setSelectedTitleToAdd("")
		} else {
			toast.error(result.error ?? "Failed to add title")
		}
		setIsAdding(false)
	}

	const handleRemove = async () => {
		if (!relationToDelete) return
		setIsRemoving(true)
		const result = await removePlayerTitle(relationToDelete.id)
		if (result.success) {
			toast.success("Title removed")
			setPlayerTitles((prev) => prev.filter((pt) => pt.id !== relationToDelete.id))
		} else {
			toast.error(result.error ?? "Failed to remove title")
		}
		setIsRemoving(false)
		setRelationToDelete(null)
	}

	const handleUpdate = async () => {
		if (!relationToUpdate || !selectedTitleToUpdate) return
		setIsUpdating(true)
		const result = await updatePlayerTitle(
			relationToUpdate.id,
			Number(selectedTitleToUpdate)
		)
		if (result.success) {
			toast.success("Title updated")
			if (selectedPlayer) {
				const titles = await getPlayerTitles(selectedPlayer.id)
				setPlayerTitles(titles)
			}
		} else {
			toast.error(result.error ?? "Failed to update title")
		}
		setIsUpdating(false)
		setRelationToUpdate(null)
		setSelectedTitleToUpdate("")
	}

	return (
		<div className="space-y-6">
			{/* Player search */}
			<div className="space-y-2">
				<div className="flex gap-2">
					<div className="relative flex-1">
						<SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
						<Input
							placeholder="Search player by name..."
							value={searchQuery}
							onChange={(e) => {
								setSearchQuery(e.target.value)
								if (selectedPlayer && e.target.value !== selectedPlayer.name) {
									setSelectedPlayer(null)
									setPlayerTitles([])
								}
							}}
							onKeyDown={(e) => e.key === "Enter" && handleSearch()}
							className="pl-9"
						/>
					</div>
					<Button
						onClick={handleSearch}
						disabled={isPendingSearch || !searchQuery.trim()}
					>
						{isPendingSearch ? (
							<Loader2Icon className="h-4 w-4 animate-spin" />
						) : (
							"Search"
						)}
					</Button>
				</div>

				{!isPendingSearch && hasSearched && searchResults.length === 0 && (
					<p className="text-sm text-muted-foreground">
						No players found for &quot;{searchQuery}&quot;
					</p>
				)}

				{!isPendingSearch && searchResults.length > 0 && (
					<div className="rounded-md border bg-popover shadow-md">
						{searchResults.map((player) => (
							<button
								key={player.id}
								type="button"
								className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm hover:bg-muted"
								onClick={() => handleSelectPlayer(player)}
							>
								<div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
									{player.imageUrl ? (
										<img
											src={player.imageUrl}
											alt={player.name}
											className="h-full w-full object-cover"
										/>
									) : (
										<UserIcon className="h-4 w-4 text-muted-foreground" />
									)}
								</div>
								<div>
									<span className="font-medium">{player.name}</span>
									<span className="ml-2 text-muted-foreground">#{player.id}</span>
								</div>
							</button>
						))}
					</div>
				)}
			</div>

			{/* Selected player titles */}
			{selectedPlayer && (
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="flex items-center gap-3 text-base">
							<div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
								{selectedPlayer.imageUrl ? (
									<img
										src={selectedPlayer.imageUrl}
										alt={selectedPlayer.name}
										className="h-full w-full object-cover"
									/>
								) : (
									<UserIcon className="h-4 w-4 text-muted-foreground" />
								)}
							</div>
							<span>{selectedPlayer.name}</span>
							<span className="font-normal text-muted-foreground text-sm">
								#{selectedPlayer.id}
							</span>
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						{isPendingTitles ? (
							<div className="flex items-center gap-2 text-muted-foreground text-sm">
								<Loader2Icon className="h-4 w-4 animate-spin" />
								Loading titles...
							</div>
						) : playerTitles.length === 0 ? (
							<p className="text-sm text-muted-foreground">No titles assigned.</p>
						) : (
							<div className="space-y-2">
								{playerTitles.map((pt) => (
									<div
										key={pt.id}
										className="flex items-center justify-between rounded-md border px-4 py-2"
									>
										<div className="flex items-center gap-2">
											<Badge variant="outline" className="font-mono">
												{pt.shortTitle}
											</Badge>
											<span className="text-sm font-medium">{pt.title}</span>
											<Badge
												variant={pt.type === "internal" ? "secondary" : "default"}
												className="text-xs"
											>
												{pt.type}
											</Badge>
										</div>
										<div className="flex gap-1">
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8"
												onClick={() => {
													setRelationToUpdate(pt)
													setSelectedTitleToUpdate("")
												}}
											>
												<PencilIcon className="h-4 w-4" />
												<span className="sr-only">Edit</span>
											</Button>
											<Button
												variant="ghost"
												size="icon"
												className="h-8 w-8 text-destructive hover:text-destructive"
												onClick={() => setRelationToDelete(pt)}
											>
												<TrashIcon className="h-4 w-4" />
												<span className="sr-only">Remove</span>
											</Button>
										</div>
									</div>
								))}
							</div>
						)}

						{!isPendingTitles && availableTitlesToAdd.length > 0 && (
							<div className="flex gap-2 border-t pt-4">
								<Select
									value={selectedTitleToAdd}
									onValueChange={setSelectedTitleToAdd}
								>
									<SelectTrigger className="flex-1">
										<SelectValue placeholder="Select a title to add..." />
									</SelectTrigger>
									<SelectContent>
										{availableTitlesToAdd.map((t) => (
											<SelectItem key={t.id} value={String(t.id)}>
												<span className="mr-2 font-mono text-xs">{t.shortTitle}</span>
												{t.title}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<Button
									onClick={handleAddTitle}
									disabled={!selectedTitleToAdd || isAdding}
								>
									{isAdding ? (
										<Loader2Icon className="h-4 w-4 animate-spin" />
									) : (
										<>
											<PlusIcon className="mr-2 h-4 w-4" />
											Add
										</>
									)}
								</Button>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Delete confirmation */}
			<AlertDialog
				open={!!relationToDelete}
				onOpenChange={(open) => !open && setRelationToDelete(null)}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Remove title?</AlertDialogTitle>
						<AlertDialogDescription>
							This will remove{" "}
							<strong>{relationToDelete?.title}</strong> from{" "}
							{selectedPlayer?.name}.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel disabled={isRemoving}>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={handleRemove}
							disabled={isRemoving}
							className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
						>
							{isRemoving ? (
								<>
									<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
									Removing...
								</>
							) : (
								"Remove"
							)}
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>

			{/* Update dialog */}
			<Dialog
				open={!!relationToUpdate}
				onOpenChange={(open) => {
					if (!open) {
						setRelationToUpdate(null)
						setSelectedTitleToUpdate("")
					}
				}}
			>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Change title</DialogTitle>
					</DialogHeader>
					<div className="space-y-4">
						<p className="text-sm text-muted-foreground">
							Replacing{" "}
							<Badge variant="outline" className="font-mono">
								{relationToUpdate?.shortTitle}
							</Badge>{" "}
							{relationToUpdate?.title} with:
						</p>
						<Select
							value={selectedTitleToUpdate}
							onValueChange={setSelectedTitleToUpdate}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select new title..." />
							</SelectTrigger>
							<SelectContent>
								{allTitles
									.filter((t) => !assignedTitleIds.includes(t.id))
									.map((t) => (
										<SelectItem key={t.id} value={String(t.id)}>
											<span className="mr-2 font-mono text-xs">{t.shortTitle}</span>
											{t.title}
										</SelectItem>
									))}
							</SelectContent>
						</Select>
						<div className="flex justify-end gap-2">
							<Button
								variant="secondary"
								onClick={() => {
									setRelationToUpdate(null)
									setSelectedTitleToUpdate("")
								}}
								disabled={isUpdating}
							>
								Cancel
							</Button>
							<Button
								onClick={handleUpdate}
								disabled={!selectedTitleToUpdate || isUpdating}
							>
								{isUpdating ? (
									<>
										<Loader2Icon className="mr-2 h-4 w-4 animate-spin" />
										Updating...
									</>
								) : (
									"Update"
								)}
							</Button>
						</div>
					</div>
				</DialogContent>
			</Dialog>
		</div>
	)
}
