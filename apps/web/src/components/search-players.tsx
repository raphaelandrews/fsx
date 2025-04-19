import * as React from "react";
import { useNavigate } from "@tanstack/react-router";
import type { DialogProps } from "@radix-ui/react-dialog";
import { SearchIcon, User } from "lucide-react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { cn } from "~/lib/utils";
import { searchPlayersQueryOptions } from "~/queries/search-players";
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
import type { SearchPlayer } from "~/schemas";

interface Player {
  id: string;
  name: string;
}

function normalizeSearchText(text: string): string {
  return text
    .normalize("NFD")
    // biome-ignore lint/suspicious/noMisleadingCharacterClass: <explanation>
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .toLowerCase();
}

export function SearchPlayers({ ...props }: DialogProps) {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const [searchValue, setSearchValue] = React.useState("");

  const { data: players = [], isLoading } = useSuspenseQuery({
    ...searchPlayersQueryOptions(),
    refetchOnWindowFocus: false,
  });

  const filteredPlayers = React.useMemo(() => {
    if (!searchValue.trim()) return players.slice(0, 10);

    const normalizedSearch = normalizeSearchText(searchValue);
    return players
      .filter((player) =>
        normalizeSearchText(player.name).includes(normalizedSearch)
      )
      .slice(0, 10);
  }, [searchValue, players]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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
        setOpen((prev) => !prev);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative h-8 w-full justify-start rounded-lg",
          "bg-muted/50 text-sm font-normal text-muted-foreground",
          "shadow-none sm:pr-12 md:w-40 lg:w-64",
          "hover:bg-muted/70 transition-colors"
        )}
        onClick={() => setOpen(true)}
        {...props}
      >
        <span className="hidden lg:inline-flex">Procurar jogadores...</span>
        <span className="inline-flex lg:hidden">Procurar...</span>
        <kbd className="pointer-events-none absolute right-2 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted/80 px-1.5 font-mono text-[10px] font-medium sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center border-b px-3">
          <SearchIcon className="mr-2 size-4 shrink-0 opacity-50" />
          <Input
            placeholder="Procurar jogador(a)"
            value={searchValue}
            onChange={handleSearchChange}
            className={cn(
              "flex h-11 w-full rounded-md bg-transparent py-3 text-sm",
              "outline-none placeholder:text-muted-foreground",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            )}
          />
        </div>

        <CommandList>
          <CommandEmpty>Nenhum jogador encontrado.</CommandEmpty>

          <CommandGroup heading="Jogadores">
            {isLoading ? (
              <div className="grid gap-1">
                <Skeleton className="h-11 w-full rounded-md" />
                <Skeleton className="h-11 w-full rounded-md" />
                <Skeleton className="h-11 w-full rounded-md" />
                <Skeleton className="h-11 w-full rounded-md" />
              </div>
            ) : (
              filteredPlayers.map((player) => (
                <CommandItem
                  key={`player-${player.id}`} 
                  value={player.name}
                  onSelect={() => {
                    navigate({ to: `/jogadores/${player.id}` });
                    setOpen(false);
                  }}
                  className="group hover:bg-accent/80 transition-colors"
                >
                  <User className="mr-2 size-4 group-hover:text-primary" />
                  <span>{player.name}</span>
                </CommandItem>
              ))
            )}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
