import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@fsx/ui/components/input-group"

import { cn } from "@fsx/ui/lib/utils"

import { useTableText } from "@/hooks/use-table-text"

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
  { placeholder, widthClass = "w-full sm:w-[250px]", wrapperClassName, ...props },
  ref
) {
  const text = useTableText()
  return (
    <InputGroup
      className={cn(
        "h-8 rounded-full border-border bg-secondary shadow-none has-[[data-slot=input-group-control]:focus-visible]:border-primary has-[[data-slot=input-group-control]:focus-visible]:ring-4 has-[[data-slot=input-group-control]:focus-visible]:ring-primary/20",
        widthClass,
        wrapperClassName,
      )}
    >
      <InputGroupAddon>
        <HugeiconsIcon
          aria-hidden="true"
          className="size-4"
          icon={Search01Icon}
          strokeWidth={2}
        />
      </InputGroupAddon>
      <InputGroupInput
        ref={ref}
        placeholder={placeholder ?? text.search}
        aria-label={placeholder ?? text.search}
        type="search"
        className="h-full"
        {...props}
      />
    </InputGroup>
  )
})
