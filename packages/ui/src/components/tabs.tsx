// NOTE: project-customized — do NOT run `shadcn add tabs` to regenerate.
// Variants:
//   default — full pill-on-pill hierarchy: `rounded-full` outer strip
//             (`bg-muted`) wrapping `rounded-full` triggers inside. The strip
//             IS a pill containing pills. Sized to content (`w-fit`); consumers
//             center with `<div className="flex justify-center">` wrapper
//             (matches the section-button.tsx pattern).
//             Triggers are `h-11` (44px, WCAG 2.5.5 44×44 target size) with
//             `px-5` padding — matches `buttonVariants({ size: "lg" })`.
//             Responsive: strip uses native scroll-snap (`overflow-x-auto
//             snap-x snap-mandatory`) so 5+ tabs overflow gracefully on
//             mobile; triggers are `shrink-0 snap-start` so each tab keeps
//             its natural size and snaps to the scroll viewport.
//             Inactive: `text-muted-foreground`. Active: `bg-primary` +
//             `text-primary-foreground` + `shadow-sm` for depth. Contrast
//             verified: primary-foreground on primary ≈ 7.9:1 (WCAG AAA).
//   line    — underline indicator. Kept for forward compatibility; no current
//             consumer uses it. Underline pseudo (`after:`) is scoped to the
//             line variant only, so it never paints on the default pill.

import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@fsx/ui/lib/utils"

function Tabs({
  className,
  orientation = "horizontal",
  ...props
}: TabsPrimitive.Root.Props) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      data-orientation={orientation}
      className={cn(
        "group/tabs flex gap-2 data-horizontal:flex-col",
        className
      )}
      {...props}
    />
  )
}

const tabsListVariants = cva(
  "group/tabs-list inline-flex w-fit max-w-full items-center justify-center overflow-x-auto rounded-full p-1.5 text-muted-foreground snap-x snap-mandatory group-data-vertical/tabs:h-fit group-data-vertical/tabs:flex-col data-[variant=line]:rounded-none",
  {
    variants: {
      variant: {
        default: "bg-muted",
        line: "gap-1 bg-transparent border-b border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

function TabsList({
  className,
  variant = "default",
  ...props
}: TabsPrimitive.List.Props & VariantProps<typeof tabsListVariants>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      data-variant={variant}
      className={cn(tabsListVariants({ variant }), className)}
      {...props}
    />
  )
}

function TabsTrigger({ className, ...props }: TabsPrimitive.Tab.Props) {
  return (
    <TabsPrimitive.Tab
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex h-11 shrink-0 snap-start items-center justify-center gap-1.5 rounded-full border border-transparent px-5 text-sm font-medium whitespace-nowrap text-muted-foreground transition-all group-data-vertical/tabs:w-full group-data-vertical/tabs:justify-start hover:text-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-1 focus-visible:outline-ring disabled:pointer-events-none disabled:opacity-50 has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 aria-disabled:pointer-events-none aria-disabled:opacity-50 group-data-[variant=default]/tabs-list:data-active:shadow-sm group-data-[variant=line]/tabs-list:data-active:shadow-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        "group-data-[variant=line]/tabs-list:bg-transparent group-data-[variant=line]/tabs-list:data-active:bg-transparent",
        "data-active:bg-primary data-active:text-primary-foreground data-active:hover:text-primary-foreground",
        "after:absolute after:bg-foreground after:opacity-0 after:transition-opacity group-data-horizontal/tabs:after:inset-x-0 group-data-horizontal/tabs:after:bottom-[-1px] group-data-horizontal/tabs:after:h-0.5 group-data-vertical/tabs:after:inset-y-0 group-data-vertical/tabs:after:-right-1 group-data-vertical/tabs:after:w-0.5 group-data-[variant=line]/tabs-list:data-active:after:opacity-100",
        className
      )}
      {...props}
    />
  )
}

function TabsContent({ className, ...props }: TabsPrimitive.Panel.Props) {
  return (
    <TabsPrimitive.Panel
      data-slot="tabs-content"
      className={cn("flex-1 text-sm outline-none", className)}
      {...props}
    />
  )
}

export { Tabs, TabsList, TabsTrigger, TabsContent, tabsListVariants }
