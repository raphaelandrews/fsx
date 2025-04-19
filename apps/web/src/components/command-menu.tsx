import * as React from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import type { DialogProps } from "@radix-ui/react-dialog";
import { LaptopIcon, MoonIcon, SearchIcon, SunIcon, User } from "lucide-react";

import { searchPlayersQueryOptions } from "~/queries/search-players";
import { cn } from "~/lib/utils";
import { useTheme } from "~/components/theme-provider";
import { Button } from "~/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "~/components/ui/command";
import { Input } from "~/components/ui/input";
import { Skeleton } from "~/components/ui/skeleton";

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

  const { data: players, isLoading } = useSuspenseQuery({
    ...searchPlayersQueryOptions(),
    refetchOnWindowFocus: false,
  });

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
          "relative h-8 w-full justify-start rounded-lg bg-muted/50 text-sm font-normal",
          "text-muted-foreground shadow-none sm:pr-12 md:w-40 lg:w-64",
          "hover:bg-muted/70 transition-colors"
        )}
        onClick={() => setOpen(true)}
        {...props}
      >
        <span className="hidden lg:inline-flex">Search players...</span>
        <span className="inline-flex lg:hidden">Search...</span>
        <kbd className="pointer-events-none absolute right-1.5 top-1.5 hidden h-5 select-none items-center gap-1 rounded border bg-muted/80 px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <div className="flex items-center border-b px-3">
          <SearchIcon className="mr-2 size-4 shrink-0 opacity-50" />
          <Input
            placeholder="Search player..."
            value={value}
            onChange={handleInputChange}
            className={cn(
              "flex h-11 w-full rounded-md bg-transparent py-3 text-sm",
              "outline-none placeholder:text-muted-foreground",
              "disabled:cursor-not-allowed disabled:opacity-50",
              "border-0 px-0 focus-visible:ring-0 focus-visible:ring-offset-0"
            )}
          />
        </div>

        <CommandList>
          <CommandEmpty>No players found.</CommandEmpty>

          <CommandGroup heading="Players">
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
                  onSelect={() => navigate({ to: `/players/${player.id}` })}
                  className="group hover:bg-accent/80 transition-colors"
                >
                  <User className="mr-2 size-4 group-hover:text-primary" />
                  <span>{player.name}</span>
                </CommandItem>
              ))
            )}
          </CommandGroup>

          <CommandSeparator />

          <CommandGroup heading="Theme">
            <CommandItem
              key="theme-light"
              onSelect={() => setTheme("light")}
              className="hover:bg-accent/80 transition-colors"
            >
              <SunIcon className="mr-2 size-4" />
              Light
            </CommandItem>
            <CommandItem
              key="theme-dark"
              onSelect={() => setTheme("dark")}
              className="hover:bg-accent/80 transition-colors"
            >
              <MoonIcon className="mr-2 size-4" />
              Dark
            </CommandItem>
            <CommandItem
              key="theme-system"
              onSelect={() => setTheme("system")}
              className="hover:bg-accent/80 transition-colors"
            >
              <LaptopIcon className="mr-2 size-4" />
              System
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
