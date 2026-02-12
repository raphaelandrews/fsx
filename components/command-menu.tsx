"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import type { DialogProps } from "@radix-ui/react-dialog"
import {
	ArrowUpIcon,
	ArrowDownIcon,
	SearchIcon,
	CornerDownLeftIcon,
	XIcon,
} from "lucide-react"

import { useIsMac } from "@/hooks/use-is-mac"
import type { SearchPlayer } from "@/db/queries"
import { getGradient } from "@/lib/generate-gradients"
import { cn } from "@/lib/utils"

import { Button } from "@/components/ui/button"
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandItem,
	CommandList,
} from "@/components/ui/command"
import { Skeleton } from "@/components/ui/skeleton"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "./ui/dialog"

const LoadingSkeleton = () => (
	<div className="grid gap-1">
		<Skeleton className="h-10 w-full rounded-md" />
		<Skeleton className="h-10 w-full rounded-md" />
		<Skeleton className="h-10 w-full rounded-md" />
		<Skeleton className="h-10 w-full rounded-md" />
		<Skeleton className="h-10 w-full rounded-md" />
		<Skeleton className="h-10 w-full rounded-md" />
		<Skeleton className="h-10 w-full rounded-md" />
		<Skeleton className="h-10 w-full rounded-md" />
		<Skeleton className="h-10 w-full rounded-md" />
		<Skeleton className="h-10 w-full rounded-md" />
	</div>
)

const CommandResults = React.memo(
	({
		searchTerm,
		initialPlayers,
		onSelect,
	}: {
		searchTerm: string
		initialPlayers: {
			id: number
			name: string
			gradient: React.CSSProperties
		}[]
		onSelect: (playerId: number) => void
	}) => {
		const [fetchedPlayers, setFetchedPlayers] = React.useState<SearchPlayer[]>(
			[]
		)
		const [isLoading, setIsLoading] = React.useState(true)
		const [error, setError] = React.useState<string | null>(null)

		React.useEffect(() => {
			if (!searchTerm) {
				setFetchedPlayers(
					initialPlayers.map((p) => ({ id: p.id, name: p.name }))
				)
				setIsLoading(false)
				return
			}

			const fetchPlayers = async () => {
				setIsLoading(true)
				setError(null)
				try {
					const response = await fetch(`/api/search-players?q=${searchTerm}`)
					if (!response.ok) {
						throw new Error(
							`This is an HTTP error: The status is ${response.status}`
						)
					}
					const json = await response.json()
					setFetchedPlayers(json.data || [])
				} catch (error) {
					console.error("Could not fetch players:", error)
					setError("Failed to fetch players.")
					setFetchedPlayers([])
				} finally {
					setIsLoading(false)
				}
			}

			fetchPlayers()
		}, [searchTerm, initialPlayers])

		const playersWithGradients = React.useMemo(() => {
			return fetchedPlayers.map((player) => ({
				...player,
				gradient: getGradient(player.id),
			}))
		}, [fetchedPlayers])

		if (isLoading) {
			return <LoadingSkeleton />
		}

		if (error) {
			return <CommandEmpty>Erro ao buscar jogadores.</CommandEmpty>
		}

		if (playersWithGradients.length === 0 && searchTerm) {
			return <CommandEmpty>Nenhum jogador encontrado.</CommandEmpty>
		}

		return (
			<div>
				{playersWithGradients.map((player) => (
					<CommandMenuItem
						key={player.id}
						onSelect={() => onSelect(player.id)}
						value={player.name}
					>
						<div className="size-5 rounded" style={player.gradient} />
						{player.name}
					</CommandMenuItem>
				))}
			</div>
		)
	}
)

CommandResults.displayName = "SearchResults"

export function CommandMenu({ ...props }: DialogProps) {
	const router = useRouter()
	const isMac = useIsMac()
	const [open, setOpen] = React.useState(false)
	const [searchValue, setSearchValue] = React.useState("")
	const [debouncedSearch, setDebouncedSearch] = React.useState("")
	const [isTyping, setIsTyping] = React.useState(false)
	const [initialPlayers, setInitialPlayers] = React.useState<
		{ id: number; name: string; gradient: React.CSSProperties }[]
	>([])
	const dialogOpenRef = React.useRef(open)
	const hasFetchedInitialPlayersRef = React.useRef(false)
	const [isLoadingInitialPlayers, setIsLoadingInitialPlayers] =
		React.useState(false)

	React.useEffect(() => {
		const fetchInitialPlayers = async () => {
			setIsLoadingInitialPlayers(true)
			try {
				const response = await fetch("/api/search-players?q=")
				if (!response.ok) throw new Error("Failed to fetch initial players")
				const json = await response.json()
				const playersWithGradients = (json.data || []).map(
					(player: SearchPlayer) => ({
						...player,
						gradient: getGradient(player.id),
					})
				)
				setInitialPlayers(playersWithGradients)
				hasFetchedInitialPlayersRef.current = true
			} catch (error) {
				console.error("Could not fetch initial players:", error)
			} finally {
				setIsLoadingInitialPlayers(false)
			}
		}

		if (open && !hasFetchedInitialPlayersRef.current) {
			fetchInitialPlayers()
		}
	}, [open])

	React.useEffect(() => {
		dialogOpenRef.current = open
		if (!open) {
			setSearchValue("")
			setDebouncedSearch("")
		}
	}, [open])

	React.useEffect(() => {
		if (!dialogOpenRef.current) return
		if (searchValue !== debouncedSearch) {
			setIsTyping(true)
		}
		const timer = setTimeout(() => {
			setDebouncedSearch(searchValue)
			setIsTyping(false)
		}, 300)
		return () => clearTimeout(timer)
	}, [searchValue, debouncedSearch])

	const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchValue(e.target.value)
	}

	const runCommand = React.useCallback((command: () => unknown) => {
		setOpen(false)
		command()
	}, [])

	React.useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
				if (
					(e.target instanceof HTMLElement && e.target.isContentEditable) ||
					e.target instanceof HTMLInputElement ||
					e.target instanceof HTMLTextAreaElement ||
					e.target instanceof HTMLSelectElement
				) {
					return
				}

				e.preventDefault()
				setOpen((open) => !open)
			}
		}

		document.addEventListener("keydown", down)
		return () => document.removeEventListener("keydown", down)
	}, [])

	return (
		<Dialog onOpenChange={setOpen} open={open}>
			<DialogTrigger asChild>
				<Button
					className={cn(
						"relative h-8 w-full justify-start bg-muted/40 pl-2.5 font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-56 xl:w-64 dark:bg-card"
					)}
					onClick={() => setOpen(true)}
					variant="secondary"
					{...props}
				>
					<span className="hidden lg:inline-flex">Procurar jogadores...</span>
					<span className="inline-flex lg:hidden">Procurar...</span>
					<div className="absolute top-1.5 right-1.5 hidden gap-1 md:flex">
						<CommandMenuKbd>{isMac ? "⌘" : "Ctrl"}</CommandMenuKbd>
						<CommandMenuKbd className="aspect-square">K</CommandMenuKbd>
					</div>
				</Button>
			</DialogTrigger>
			<DialogContent
				className="rounded-xl border-none bg-clip-padding p-2 pb-11 shadow-2xl ring-4 ring-neutral-200/80 dark:bg-neutral-900 dark:ring-neutral-800"
				showCloseButton={false}
			>
				<DialogHeader className="sr-only">
					<DialogTitle>Procurar jogadores...</DialogTitle>
					<DialogDescription>
						Procurare jogadores cadastrados na FSX...
					</DialogDescription>
				</DialogHeader>
				<Command className="**:data-[slot=command-input]:!h-9 **:data-[slot=command-input-wrapper]:!h-9 rounded-none bg-transparent **:data-[slot=command-input-wrapper]:mb-0 **:data-[slot=command-input-wrapper]:rounded-md **:data-[slot=command-input-wrapper]:border **:data-[slot=command-input-wrapper]:border-input **:data-[slot=command-input-wrapper]:bg-input/50 **:data-[slot=command-input]:py-0">
					<CommandMenuInput
						onChange={handleSearchChange}
						placeholder="Procurar jogadores.."
						value={searchValue}
					/>
					<CommandList className="no-scrollbar min-h-80 scroll-pt-2 scroll-pb-1.5">
						<CommandGroup
							className="!p-0 [&_[cmdk-group-heading]]:!p-3 [&_[cmdk-group-heading]]:!pb-1 [&_[cmdk-group-heading]]:scroll-mt-16"
							heading="Jogadores"
						>
							{isLoadingInitialPlayers || isTyping ? (
								<LoadingSkeleton />
							) : (
								<React.Suspense fallback={<LoadingSkeleton />}>
									{open && (
										<CommandResults
											initialPlayers={initialPlayers}
											onSelect={(playerId) => {
												runCommand(() => router.push(`/jogadores/${playerId}`))
											}}
											searchTerm={debouncedSearch}
										/>
									)}
								</React.Suspense>
							)}
						</CommandGroup>
					</CommandList>
				</Command>
				<div className="absolute inset-x-0 bottom-0 z-20 flex h-10 items-center gap-2 rounded-b-xl border-t border-t-neutral-100 bg-neutral-50 px-4 font-medium text-muted-foreground text-xs dark:border-t-neutral-700 dark:bg-neutral-800">
					<div className="flex items-center gap-1.5">
						<div className="flex items-center gap-1">
							<CommandMenuKbd>
								<ArrowUpIcon />
							</CommandMenuKbd>
							<CommandMenuKbd>
								<ArrowDownIcon />
							</CommandMenuKbd>{" "}
						</div>
						Selecionar
					</div>{" "}
					<div className="flex items-center gap-1.5">
						<CommandMenuKbd>
							<XIcon />
						</CommandMenuKbd>{" "}
						Fechar
					</div>{" "}
					<div className="flex items-center gap-1.5">
						<CommandMenuKbd>
							<CornerDownLeftIcon />
						</CommandMenuKbd>{" "}
						Navegar
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}

function CommandMenuItem({
	children,
	className,
	onHighlight,
	...props
}: React.ComponentProps<typeof CommandItem> & {
	onHighlight?: () => void
	"data-selected"?: string
	"aria-selected"?: string
}) {
	const ref = React.useRef<HTMLDivElement>(null)

	return (
		<CommandItem
			className={cn(
				"!px-3 h-9 rounded-md border border-transparent font-medium data-[selected=true]:border-input data-[selected=true]:bg-input/50",
				className
			)}
			ref={ref}
			{...props}
		>
			{children}
		</CommandItem>
	)
}

function CommandMenuKbd({ className, ...props }: React.ComponentProps<"kbd">) {
	return (
		<kbd
			className={cn(
				"pointer-events-none flex h-5 select-none items-center justify-center gap-1 rounded border bg-background px-1 font-medium font-sans text-[0.7rem] text-muted-foreground [&_svg:not([class*='size-'])]:size-3",
				className
			)}
			{...props}
		/>
	)
}

function CommandMenuInput({
	className,
	...props
}: React.ComponentProps<"input"> & {
	onChange?: React.ChangeEventHandler<HTMLInputElement>
}) {
	return (
		<div
			className="flex h-9 items-center gap-2 border-b px-3"
			data-slot="command-input-wrapper"
		>
			<SearchIcon className="size-4 shrink-0 opacity-50" />
			<input
				className={cn(
					"flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
					className
				)}
				data-slot="command-input"
				{...props}
			/>
		</div>
	)
}
