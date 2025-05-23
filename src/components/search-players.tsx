import * as React from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { DialogProps } from "@radix-ui/react-dialog";
import { ArrowUpIcon, ArrowDownIcon, SearchIcon } from "lucide-react";

import { searchPlayersQueryOptions } from "~/db/queries";
import { getGradient } from "~/lib/generate-gradients";
import { cn } from "~/lib/utils";

import { ClientOnly } from "~/components/client-only";
import { Button } from "~/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
} from "~/components/ui/command";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";

const LoadingSkeleton = () => (
  <div className="grid gap-1">
    <Skeleton className="h-10 w-full rounded-md" />
    <Skeleton className="h-10 w-full rounded-md" />
    <Skeleton className="h-10 w-full rounded-md" />
    <Skeleton className="h-10 w-full rounded-md" />
  </div>
);

const SearchResults = React.memo(
  ({
    searchTerm,
    onSelect,
  }: {
    searchTerm: string;
    onSelect: (playerId: number) => void;
  }) => {
    const { data: fetchedPlayers = [], isLoading } = useQuery(
      searchPlayersQueryOptions(searchTerm)
    );
console.log("searchTerm: ",searchTerm)
    const playersWithGradients = React.useMemo(() => {
      return fetchedPlayers.map((player) => ({
        ...player,
        gradient: getGradient(),
      }));
    }, [fetchedPlayers]);

    if (isLoading) {
      return <LoadingSkeleton />;
    }

    if (playersWithGradients.length === 0) {
      return <CommandEmpty>Nenhum jogador encontrado.</CommandEmpty>;
    }

    return (
      <>
        {playersWithGradients.map((player) => (
          <CommandItem
            key={`player-${player.id}`}
            value={player.name}
            onSelect={() => onSelect(player.id)}
            className="group transition-colors data-[selected=true]:bg-accent hover:bg-accent/50"
          >
            <div className="size-5 rounded" style={player.gradient} />
            <span>{player.name}</span>
          </CommandItem>
        ))}
      </>
    );
  }
);

export function SearchPlayers({ ...props }: DialogProps) {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [isTyping, setIsTyping] = React.useState(false);

  React.useEffect(() => {
    if (searchValue !== debouncedSearch) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setDebouncedSearch(searchValue);
        setIsTyping(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchValue, debouncedSearch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleSelect = (playerId: number) => {
    navigate({ to: `/jogadores/${playerId}` });
    setOpen(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) {
      setTimeout(() => {
        setSearchValue("");
        setDebouncedSearch("");
      }, 150);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  React.useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      const isKShortcut = e.key === "k" && (e.metaKey || e.ctrlKey);
      const isSlashShortcut = e.key === "/";
      const isInputField =
        e.target instanceof HTMLElement &&
        (e.target.isContentEditable ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement);

      if ((isKShortcut || isSlashShortcut) && !isInputField) {
        e.preventDefault();
        handleOpenChange(!open);
      }
    };

    document.addEventListener("keydown", handleGlobalKeyDown);
    return () => document.removeEventListener("keydown", handleGlobalKeyDown);
  }, [open]);
console.log(searchValue)
  return (
    <ClientOnly
      fallback={
        <Button
          variant="outline"
          className={cn(
            "relative h-7 w-full justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
          )}
          {...props}
        >
          <span className="hidden lg:inline-flex">Procurar jogadores...</span>
          <span className="inline-flex lg:hidden">Procurar...</span>
          <kbd className="pointer-events-none absolute right-2 top-0.75 hidden h-5 select-none items-center gap-1 rounded border bg-muted/80 px-1.5 font-mono text-[10px] font-medium sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>
      }
    >
      <>
        <Button
          variant="outline"
          className={cn(
            "relative h-7 w-full justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
          )}
          onClick={() => handleOpenChange(true)}
          {...props}
        >
          <span className="hidden lg:inline-flex">Procurar jogadores...</span>
          <span className="inline-flex lg:hidden">Procurar...</span>
          <kbd className="pointer-events-none absolute right-2 top-0.75 hidden h-5 select-none items-center gap-1 rounded border bg-muted/80 px-1.5 font-mono text-[10px] font-medium sm:flex">
            <span className="text-xs">⌘</span>K
          </kbd>
        </Button>

        <CommandDialog open={open} onOpenChange={handleOpenChange}>
          <div className="flex items-center border-b px-3">
            <SearchIcon className="mr-2 size-4 shrink-0 stroke-muted-foreground" />
            <Input
              placeholder="Procurar jogador(a)"
              value={searchValue}
              onChange={handleSearchChange}
              className={cn(
                "flex h-11 w-full rounded-md bg-transparent py-3 text-sm",
                "outline-none placeholder:text-muted-foreground",
                "disabled:cursor-not-allowed disabled:opacity-50",
                "border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-none"
              )}
              autoFocus
            />
          </div>

          <CommandList>
            <CommandGroup heading="Jogadores">
              {isTyping ? (
                <LoadingSkeleton />
              ) : (
                <React.Suspense fallback={<LoadingSkeleton />}>
                  {open && (
                    <SearchResults
                      searchTerm={debouncedSearch}
                      onSelect={handleSelect}
                    />
                  )}
                </React.Suspense>
              )}
            </CommandGroup>
          </CommandList>

          <div className="bg-muted border-t px-3 py-2 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="p-1 border rounded bg-background">
                  <ArrowUpIcon className="h-3 w-3" />
                </div>
                <div className="p-1 border rounded bg-background">
                  <ArrowDownIcon className="h-3 w-3" />
                </div>
                <span>Navegar</span>
              </div>
              <div>
                <span className="px-1 py-0.5 border rounded bg-background">
                  ESC
                </span>
                <span className="ml-1">Fechar</span>
              </div>
              <div>
                <span className="px-1 py-0.5 border rounded bg-background">
                  ENTER
                </span>
                <span className="ml-1">Abrir</span>
              </div>
            </div>
          </div>
        </CommandDialog>
      </>
    </ClientOnly>
  );
}
