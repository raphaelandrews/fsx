import * as React from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { DialogProps } from "@radix-ui/react-dialog";
import { LaptopIcon, MoonIcon, SearchIcon, SunIcon, User } from "lucide-react";

import { playerQueryOptions, searchPlayersQueryOptions } from "@/actions/players/playersQueryOptions";
import { cn } from "@/lib/utils";

import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

function removeSpecialCharacters(text: string) {
  return (
    text
      .normalize("NFD")
      // biome-ignore lint/suspicious/noMisleadingCharacterClass: <explanation>
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9\s]/g, "")
  );
}

export function CommandMenu({ ...props }: DialogProps) {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const { setTheme } = useTheme();
  const [value, setValue] = React.useState("");

  // Fetch players using TanStack Query
  const { data: players, isLoading } = useSuspenseQuery(searchPlayersQueryOptions);

  // Filter players based on search input
  const filteredPlayers = React.useMemo(() => {
    if (!value) return players.slice(0, 10);
    return players
      .filter((player) =>
        removeSpecialCharacters(player.name.toLowerCase()).includes(
          removeSpecialCharacters(value.toLowerCase())
        )
      )
      .slice(0, 10);
  }, [value, players]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setValue(e.target.value);
  };

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        if (
          (e.target instanceof HTMLElement && e.target.isContentEditable) ||
          e.target instanceof HTMLInputElement ||
          e.target instanceof HTMLTextAreaElement ||
          e.target instanceof HTMLSelectElement
        ) {
          return;
        }

        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <>
      <Button
        variant="outline"
        className={cn(
          "relative h-8 w-full justify-start rounded-[0.5rem] bg-muted/50 text-sm font-normal text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64"
        )}
        onClick={() => setOpen(true)}
        {...props}
      >
        <span className="hidden lg:inline-flex">Procurar jogadores...</span>
        <span className="inline-flex lg:hidden">Procurar...</span>
        <kbd className="pointer-events-none absolute right-[0.3rem] top-[0.3rem] hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center border-b px-3">
          <SearchIcon className="mr-2 h-4 w-4 shrink-0 opacity-50" />
          <Input
            placeholder="Procurar jogador(a)"
            value={value}
            onChange={handleInputChange}
            className="flex h-11 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        <CommandList>
          <CommandEmpty>Nenhum jogador encontrado.</CommandEmpty>
          <CommandGroup heading="Jogadores">
            {isLoading ? (
              <div className="grid gap-1">
                <Skeleton className="w-full h-11 rounded-md" />
                <Skeleton className="w-full h-11 rounded-md" />
                <Skeleton className="w-full h-11 rounded-md" />
                <Skeleton className="w-full h-11 rounded-md" />
              </div>
            ) : (
              <>
                {filteredPlayers.map((item) => (
                  <CommandItem
                    key={item.id}
                    value={item.name}
                    onSelect={() => navigate({ to: `/jogadores/${item.id}`})}
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>{item.name}</span>
                  </CommandItem>
                ))}
              </>
            )}
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Theme">
            <CommandItem onSelect={() => setTheme("light")}>
              <SunIcon className="mr-2 h-4 w-4" />
              Light
            </CommandItem>
            <CommandItem onSelect={() => setTheme("dark")}>
              <MoonIcon className="mr-2 h-4 w-4" />
              Dark
            </CommandItem>
            <CommandItem onSelect={() => setTheme("system")}>
              <LaptopIcon className="mr-2 h-4 w-4" />
              System
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
