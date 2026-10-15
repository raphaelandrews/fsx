"use client"

import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Clock } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"

interface DateTimePickerProps {
  date?: Date
  setDate: (date?: Date) => void
  disabled?: boolean
}

export function DateTimePicker({ date, setDate, disabled }: DateTimePickerProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(date)

  React.useEffect(() => {
    setSelectedDate(date)
  }, [date])

  const handleDateSelect = (newDate: Date | undefined) => {
    if (newDate) {
      const currentTime = selectedDate
        ? {
          hours: selectedDate.getHours(),
          minutes: selectedDate.getMinutes(),
        }
        : { hours: 12, minutes: 0 }

      newDate.setHours(currentTime.hours)
      newDate.setMinutes(currentTime.minutes)
    }
    setSelectedDate(newDate)
    setDate(newDate)
  }

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value
    if (!selectedDate) return

    const [hours, minutes] = time.split(":").map(Number)
    const newDate = new Date(selectedDate)
    newDate.setHours(hours)
    newDate.setMinutes(minutes)
    setSelectedDate(newDate)
    setDate(newDate)
  }

  return (
    <Popover modal={true}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? (
            <span className="truncate">{format(date, "PPP p")}</span>
          ) : (
            <span>Pick a date</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={selectedDate}
          onSelect={handleDateSelect}
          initialFocus
        />
        <div className="border-t p-3">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Input
              type="time"
              value={selectedDate ? format(selectedDate, "HH:mm") : ""}
              onChange={handleTimeChange}
              className="h-8 w-full"
              disabled={!selectedDate}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
