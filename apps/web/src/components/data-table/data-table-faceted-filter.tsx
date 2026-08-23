// NOTE: project-customized — URL-driven controlled faceted filter.
// Adapted from `apps/web/src/components/titulados/data-table-faceted-filter.tsx`
// (which is TanStack-Table coupled). This version accepts plain `value` and
// `onChange` props so it can be wired to any state container — TanStack Router
// search params, useState, server actions, etc. The internal trigger/popover
// markup matches the titulados pattern for visual consistency.

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  Add01Icon,
  Cancel01Icon,
  Tick02Icon,
} from "@hugeicons/core-free-icons"

import { cn } from "@fsx/ui/lib/utils"
import { Badge } from "@fsx/ui/components/badge"
import { Button } from "@fsx/ui/components/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@fsx/ui/components/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@fsx/ui/components/popover"
import { Separator } from "@fsx/ui/components/separator"

interface DataTableFacetedFilterOption {
  label: string
  value: string
  icon?: React.ComponentType<{ className?: string }>
}

interface DataTableFacetedFilterProps {
  title: string
  options: DataTableFacetedFilterOption[]
  value: string[]
  onChange: (value: string[]) => void
  /**
   * When true, `onChange` is called with a 0-or-1-length array (single
   * selection). The option still toggles normally (click again to clear).
   */
  singleSelect?: boolean
  className?: string
}

export function DataTableFacetedFilter({
  title,
  options,
  value,
  onChange,
  singleSelect = false,
  className,
}: DataTableFacetedFilterProps) {
  const selectedValues = new Set(value)
  const selectedCount = selectedValues.size

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            className={cn("h-8", className)}
            size="sm"
            variant="outline"
          />
        }
      >
        <HugeiconsIcon
          className="size-4"
          icon={Add01Icon}
          strokeWidth={2}
        />
        {title}
        {selectedCount > 0 ? (
          <>
            <Separator className="mx-2 h-4" orientation="vertical" />
            <Badge
              className="rounded-full px-1.5 font-normal lg:hidden"
              variant="secondary"
            >
              {selectedCount}
            </Badge>
            <div className="hidden flex-wrap items-center gap-1 lg:flex">
              {selectedCount > 2 ? (
                <Badge
                  className="rounded-full px-1.5 font-normal"
                  variant="secondary"
                >
                  {selectedCount} selecionados
                </Badge>
              ) : (
                options
                  .filter((option) => selectedValues.has(option.value))
                  .map((option) => (
                    <Badge
                      className="rounded-full px-1.5 font-normal"
                      key={option.value}
                      variant="secondary"
                    >
                      {option.label}
                    </Badge>
                  ))
              )}
            </div>
          </>
        ) : null}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[200px] p-0">
        <Command>
          <CommandInput placeholder={title} />
          <CommandList>
            <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = selectedValues.has(option.value)
                const Icon = option.icon
                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      if (singleSelect) {
                        // Toggle a single-item array: clicking the active
                        // option clears, clicking any other option replaces.
                        onChange(isSelected ? [] : [option.value])
                        return
                      }
                      const next = new Set(selectedValues)
                      if (isSelected) {
                        next.delete(option.value)
                      } else {
                        next.add(option.value)
                      }
                      onChange(Array.from(next))
                    }}
                  >
                    <div
                      className={cn(
                        "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50 [&_svg]:invisible"
                      )}
                    >
                      <HugeiconsIcon
                        className="size-4"
                        icon={Tick02Icon}
                      />
                    </div>
                    {Icon ? <Icon className="mr-2 size-4 text-muted-foreground" /> : null}
                    <span>{option.label}</span>
                  </CommandItem>
                )
              })}
            </CommandGroup>
            {selectedCount > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup>
                  <CommandItem
                    className="justify-center text-center"
                    onSelect={() => onChange([])}
                  >
                    <HugeiconsIcon
                      className="mr-2 size-4"
                      icon={Cancel01Icon}
                      strokeWidth={2}
                    />
                    Limpar filtros
                  </CommandItem>
                </CommandGroup>
              </>
            ) : null}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
