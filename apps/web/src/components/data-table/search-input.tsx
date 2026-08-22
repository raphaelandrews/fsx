// NOTE: project-customized — canonical search-input pattern for FSX tables.
// Wraps `@fsx/ui/components/input-group` with a `Search01Icon` prefix so the
// toolbar (URL-driven or TanStack) presents a consistent "type to filter"
// affordance. Use this anywhere a data-table search field is needed.
// Fill + border use grey-scale palette tokens (`bg-muted` + `border-border`)
// to read as a soft elevated surface against the page background.

import * as React from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Search01Icon } from "@hugeicons/core-free-icons"

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@fsx/ui/components/input-group"

interface SearchInputProps
  extends Omit<React.ComponentProps<typeof InputGroupInput>, "type"> {
  /** Placeholder shown when empty. */
  placeholder?: string
  /** Optional explicit width (defaults to `w-full sm:w-[250px]`). */
  widthClass?: string
  /** Wrapper class. */
  wrapperClassName?: string
}

export const SearchInput = React.forwardRef<
  React.ComponentRef<typeof InputGroupInput>,
  SearchInputProps
>(function SearchInput(
  { placeholder = "Buscar...", widthClass = "w-full sm:w-[250px]", wrapperClassName, ...props },
  ref
) {
  return (
    <InputGroup className={`h-8 border-border bg-muted ${widthClass} ${wrapperClassName ?? ""}`.trim()}>
      <InputGroupAddon>
        <HugeiconsIcon
          className="size-4"
          icon={Search01Icon}
          strokeWidth={2}
        />
      </InputGroupAddon>
      <InputGroupInput
        ref={ref}
        placeholder={placeholder}
        type="search"
        {...props}
      />
    </InputGroup>
  )
})
