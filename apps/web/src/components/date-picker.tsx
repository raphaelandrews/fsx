import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { Calendar01Icon } from "@hugeicons/core-free-icons"

import { Button } from "@fsx/ui/components/button"
import { Calendar } from "@fsx/ui/components/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@fsx/ui/components/popover"
import { cn } from "@fsx/ui/lib/utils"

interface DatePickerProps {
  id?: string
  // ISO date string ("YYYY-MM-DD") or "" for no value, matching the DB format.
  value: string
  onChange: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

// Parse/format via local date components so the calendar highlights the exact
// stored day and the label never shifts across timezones (server runs in UTC).
function parseIso(value: string): Date | undefined {
  const [year, month, day] = value.split("-").map(Number)
  if (!year || !month || !day) return undefined
  return new Date(year, month - 1, day)
}

function toIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDisplay(value: string): string {
  const [year, month, day] = value.split("-")
  if (!year || !month || !day) return value
  return `${day}/${month}/${year}`
}

export function DatePicker({
  id,
  value,
  onChange,
  placeholder = "Selecione uma data",
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false)
  const selected = parseIso(value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start gap-2 text-left font-normal",
              !value && "text-muted-foreground",
              className,
            )}
          />
        }
      >
        <HugeiconsIcon className="size-4 shrink-0" icon={Calendar01Icon} strokeWidth={2} />
        {value ? formatDisplay(value) : placeholder}
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar
          autoFocus
          mode="single"
          selected={selected}
          defaultMonth={selected}
          onSelect={(date) => {
            onChange(date ? toIso(date) : "")
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
