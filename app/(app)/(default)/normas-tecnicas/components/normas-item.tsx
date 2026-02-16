"use client"

import { ArrowUpRight, BookIcon } from "lucide-react"

import { DottedSeparator } from "@/components/dotted-separator"
import {
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

interface NormasItemProps {
  value: string
  title: string
  description?: string
  children: React.ReactNode
  isLast: boolean
}

export function NormasItem({
  value,
  title,
  description,
  children,
  isLast,
}: NormasItemProps) {
  return (
    <>
      <AccordionItem value={value} className="border-b-0">
        <div className="m-1">
          <AccordionTrigger className="flex items-center justify-between group rounded-none hover:bg-muted/50 hover:no-underline transition-all duration-300 p-3 select-none cursor-pointer [&[data-state=open]>div>div>svg]:rotate-90">
            <div className="flex flex-col gap-2 w-full text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <BookIcon size={14} className="text-muted-foreground" />
                  <h3 className="text-sm font-bold leading-tight">
                    {title}
                  </h3>
                </div>
              </div>
              {description && (
                <p className="text-muted-foreground text-xs line-clamp-2 font-normal">
                  {description}
                </p>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent className="p-0">
            <div className="text-sm text-foreground">
              {children}
            </div>
          </AccordionContent>
        </div>
      </AccordionItem>
      {!isLast && <DottedSeparator className="w-full" />}
    </>
  )
}
