import * as React from "react";
import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react";
import { Cancel01Icon, SearchIcon } from "@hugeicons/core-free-icons";

import { cn } from "@fsx/ui/lib/utils";

import { useTableText } from "@/hooks/use-table-text";
import { useDebouncedValue } from "@/hooks/use-debounced-value";

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
  id?: string;
}

const LIST_MAX = 256;
const LIST_GAP = 8;

function scrollParent(element: HTMLElement | null) {
  for (let node = element?.parentElement; node; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === "auto" || overflowY === "scroll") return node;
  }
  return null;
}

export function SearchableSelect({
  value,
  onChange,
  getQueryOptions,
  placeholder = "Search...",
  emptyText = "No results.",
  initialLabel = "",
  id,
}: SearchableSelectProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [selectedLabel, setSelectedLabel] = React.useState(initialLabel);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const debounced = useDebouncedValue(query, 250);

  React.useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const [placement, setPlacement] = React.useState({ up: false, maxHeight: LIST_MAX });

  React.useLayoutEffect(() => {
    if (!open || !containerRef.current) return;
    const place = () => {
      const element = containerRef.current;
      if (!element) return;
      const box = element.getBoundingClientRect();
      const bounds = scrollParent(element)?.getBoundingClientRect() ?? { top: 0, bottom: window.innerHeight };
      const below = Math.min(bounds.bottom, window.innerHeight) - box.bottom - LIST_GAP;
      const above = box.top - Math.max(bounds.top, 0) - LIST_GAP;
      const up = below < LIST_MAX && above > below;
      setPlacement({ up, maxHeight: Math.max(96, Math.min(LIST_MAX, up ? above : below)) });
    };
    place();
    window.addEventListener("resize", place);
    return () => window.removeEventListener("resize", place);
  }, [open]);

  const text = useTableText();
  const { data: options = [], isFetching, isError } = useQuery(getQueryOptions(debounced));
  const [activeIndex, setActiveIndex] = React.useState(0);
  const listId = `${React.useId()}-options`;
  const optionId = (index: number) => `${listId}-${index}`;
  const showOptions = open && !isFetching && !isError && options.length > 0;

  React.useEffect(() => setActiveIndex(0), [options]);

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

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Escape" && open) {
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (!open) return setOpen(true);
      if (options.length === 0) return;
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActiveIndex((index) => (index + step + options.length) % options.length);
      return;
    }
    if (event.key === "Enter" && showOptions) {
      event.preventDefault();
      const option = options[activeIndex];
      if (option) handleSelect(option);
    }
  };

  React.useEffect(() => {
    if (showOptions) document.getElementById(optionId(activeIndex))?.scrollIntoView({ block: "nearest" });
  }, [activeIndex, showOptions]);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <HugeiconsIcon
          icon={SearchIcon}
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2 opacity-50"
        />
        <input
          className={cn("h-12 w-full rounded-xl border border-input bg-background py-2 pr-11 pl-9 text-base outline-hidden transition-[border-color,box-shadow] focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/20")}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listId}
          aria-activedescendant={showOptions ? optionId(activeIndex) : undefined}
          autoComplete="off"
          value={open ? (query || selectedLabel) : selectedLabel}
          id={id}
          placeholder={placeholder}
          aria-label={id ? undefined : placeholder}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            setSelectedLabel("");
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={onKeyDown}
        />
        {selectedLabel && value ? (
          <button
            type="button"
            aria-label={text.clearSelection}
            className="absolute top-1/2 right-1 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring"
            onClick={clear}
          >
            <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" className="size-4" />
          </button>
        ) : null}
      </div>

      <div
        className={cn("absolute z-50 w-full overflow-hidden rounded-md border bg-popover shadow-md", placement.up ? "bottom-full mb-1" : "mt-1", !open && "hidden")}
        onMouseDown={(e) => e.preventDefault()}
      >
        <ul id={listId} role="listbox" aria-label={placeholder} className="overflow-y-auto p-1" style={{ maxHeight: placement.maxHeight }}>
          {showOptions
            ? options.map((opt, index) => (
                <li
                  key={opt.id}
                  id={optionId(index)}
                  role="option"
                  aria-selected={index === activeIndex}
                  className="flex cursor-default items-center rounded-sm px-2 py-1.5 text-base select-none aria-selected:bg-muted aria-selected:text-foreground"
                  onMouseMove={() => setActiveIndex(index)}
                  onClick={() => handleSelect(opt)}
                >
                  {opt.name}
                </li>
              ))
            : null}
        </ul>
        <div role="status" className={cn("px-2 py-3 text-sm", isError ? "text-destructive" : "text-muted-foreground", showOptions && "sr-only")}>
          {isFetching ? text.searching : isError ? text.searchFailed : options.length === 0 ? emptyText : null}
        </div>
      </div>
    </div>
  );
}
