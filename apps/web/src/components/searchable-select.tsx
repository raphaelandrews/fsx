import * as React from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, SearchIcon } from "@hugeicons/core-free-icons";

import { Command, CommandEmpty, CommandItem, CommandList } from "@fsx/ui/components/command";

export interface SearchableOption {
  id: number;
  name: string;
}

interface SearchableSelectProps {
  value: string;
  onChange: (value: string) => void;
  getQueryOptions: (
    query: string
  ) => UseQueryOptions<SearchableOption[], any, SearchableOption[], any>;
  placeholder?: string;
  emptyText?: string;
  initialLabel?: string;
}

export function SearchableSelect({
  value,
  onChange,
  getQueryOptions,
  placeholder = "Buscar...",
  emptyText = "Nenhum resultado.",
  initialLabel = "",
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [selectedLabel, setSelectedLabel] = React.useState(initialLabel);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setDebounced(query), 250);
    return () => clearTimeout(timer);
  }, [query]);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const { data: options = [], isFetching } = useQuery(getQueryOptions(debounced));

  const handleSelect = (opt: SearchableOption) => {
    onChange(String(opt.id));
    setSelectedLabel(opt.name);
    setQuery("");
    setOpen(false);
  };

  const clear = () => {
    onChange("");
    setSelectedLabel("");
    setQuery("");
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <HugeiconsIcon
          icon={SearchIcon}
          className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 opacity-50"
        />
        <input
          className="w-full rounded-md border border-input bg-background py-2 pr-8 pl-8 text-sm outline-hidden focus-visible:border-ring"
          value={open ? (query || selectedLabel) : selectedLabel}
          placeholder={placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setSelectedLabel("");
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
        />
        {selectedLabel && value ? (
          <button
            type="button"
            aria-label="Limpar"
            className="absolute right-2 top-1/2 -translate-y-1/2"
            onClick={clear}
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-4 opacity-50" />
          </button>
        ) : null}
      </div>

      {open ? (
        <div className="absolute z-50 mt-1 w-full overflow-hidden rounded-md border bg-popover shadow-md">
          <Command shouldFilter={false}>
            <CommandList>
              {isFetching ? (
                <div className="px-2 py-3 text-sm text-muted-foreground">Buscando…</div>
              ) : options.length === 0 ? (
                <CommandEmpty>{emptyText}</CommandEmpty>
              ) : (
                options.map((opt) => (
                  <CommandItem
                    key={opt.id}
                    value={String(opt.id)}
                    onSelect={() => handleSelect(opt)}
                  >
                    {opt.name}
                  </CommandItem>
                ))
              )}
            </CommandList>
          </Command>
        </div>
      ) : null}
    </div>
  );
}
