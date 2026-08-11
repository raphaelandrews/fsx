
import { useRouter } from "@tanstack/react-router"
import { useHotkeys, detectPlatform } from "@tanstack/react-hotkeys"
import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowUp01Icon,
  ArrowDown01Icon,
  Cancel01Icon,
  SearchIcon,
} from "@hugeicons/core-free-icons"

import { cn } from "@fsx/ui/lib/utils"

import { Button } from "@fsx/ui/components/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@fsx/ui/components/command"
import { Skeleton } from "@fsx/ui/components/skeleton"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@fsx/ui/components/dialog"

type SearchPlayer = {
  id: number
  name: string
}

function getGradient(id: number): React.CSSProperties {
  const gradients = [
    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
    "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
    "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
    "linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)",
    "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
    "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
    "linear-gradient(135deg, #a1c4fd 0%, #c2e9fb 100%)",
  ]
  return {
    background: gradients[id % gradients.length],
  }
}

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
          const json = (await response.json()) as { data?: SearchPlayer[] }
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

type CommandMenuProps = Record<string, never>

export function CommandMenu({ ...props }: CommandMenuProps) {
  const router = useRouter()
  const platform = detectPlatform()
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
        const json = (await response.json()) as { data?: SearchPlayer[] }
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

  useHotkeys([
    { hotkey: "Mod+K", callback: (e) => { e.preventDefault(); setOpen((open) => !open); } },
    { hotkey: "/", callback: (e) => { e.preventDefault(); setOpen((open) => !open); } },
  ])

  const handlePlayerSelect = (playerId: number) => {
    runCommand(() => router.navigate({ to: `/jogadores/${playerId}` }))
  }

  return (
    <Dialog onOpenChange={setOpen} open={open}>
      <DialogTrigger>
        <Button
          className={cn(
            "relative h-8 w-full justify-start pl-2.5 font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-56 xl:w-64 border border-dashed bg-background dark:bg-input/30"
          )}
          onClick={() => setOpen(true)}
          variant="secondary"
          {...props}
        >
          <span className="hidden lg:inline-flex">Procurar jogadores...</span>
          <span className="inline-flex lg:hidden">Procurar...</span>
          <div className="absolute top-1.5 right-1.5 hidden gap-1 md:flex">
            <CommandMenuKbd>{platform === "mac" ? "⌘" : "Ctrl"}</CommandMenuKbd>
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
        <Command className="**:data-[slot=command-input]:!h-9 **:data-[slot=command-input-wrapper]:!h-9 rounded-none bg-transparent **:data-[slot=command-input-wrapper]:mb-0">
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
                      onSelect={handlePlayerSelect}
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
                <HugeiconsIcon icon={ArrowUp01Icon} />
              </CommandMenuKbd>
              <CommandMenuKbd>
                <HugeiconsIcon icon={ArrowDown01Icon} />
              </CommandMenuKbd>{" "}
            </div>
            Selecionar
          </div>{" "}
          <div className="flex items-center gap-1.5">
            <CommandMenuKbd>
              <HugeiconsIcon icon={Cancel01Icon} />
            </CommandMenuKbd>{" "}
            Fechar
          </div>{" "}
          <div className="flex items-center gap-1.5">
            <CommandMenuKbd>
              <svg
                className="size-3"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <title>Enter key</title>
                <polyline points="9 10 4 15 9 20" />
                <path d="M20 4v7a4 4 0 0 1-4 4H4" />
              </svg>
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
  ...props
}: React.ComponentProps<typeof CommandItem>) {
  return (
    <CommandItem
      className={cn(
        "!px-3 h-9 rounded-md border border-transparent font-medium data-[selected=true]:border-input data-[selected=true]:bg-input/50",
        className
      )}
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
}: React.ComponentProps<"input">) {
  return (
    <div
      className={cn("flex h-9 items-center gap-2 border-b px-3", className)}
      data-slot="command-input-wrapper"
    >
      <HugeiconsIcon className="size-4 shrink-0 opacity-50" icon={SearchIcon} />
      <input
        className="flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50"
        data-slot="command-input"
        {...props}
      />
    </div>
  )
}
