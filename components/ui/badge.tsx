import type * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 overflow-hidden whitespace-nowrap rounded-md border px-2 py-0.5 font-medium text-xs transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&>svg]:pointer-events-none [&>svg]:size-3",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground [a&]:hover:bg-primary/90",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground [a&]:hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-white focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40 [a&]:hover:bg-destructive/90",
        outline:
          "text-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        ghost: "border-transparent text-muted-foreground [a&]:hover:bg-accent [a&]:hover:text-accent-foreground",
        noir: "border-transparent bg-noir text-noir-foreground [a&]:hover:bg-noir/90",
        raspberry: "border-transparent bg-raspberry text-raspberry-foreground [a&]:hover:bg-raspberry/90",
        strawberry: "border-transparent bg-strawberry text-strawberry-foreground [a&]:hover:bg-strawberry/90",
        sun: "border-transparent bg-sun text-sun-foreground [a&]:hover:bg-sun/90",
        honey: "border-transparent bg-honey text-honey-foreground [a&]:hover:bg-honey/90",
        sea: "border-transparent bg-sea text-sea-foreground [a&]:hover:bg-sea/90",
        bulbasaur: "border-transparent bg-bulbasaur text-bulbasaur-foreground [a&]:hover:bg-bulbasaur/90",
        ice: "border-transparent bg-ice text-ice-foreground [a&]:hover:bg-ice/90",
        blueberry: "border-transparent bg-blueberry text-blueberry-foreground [a&]:hover:bg-blueberry/90",
        jam: "border-transparent bg-jam text-jam-foreground [a&]:hover:bg-jam/90",
        mulberry: "border-transparent bg-mulberry text-mulberry-foreground [a&]:hover:bg-mulberry/90",
        mint: "border-transparent bg-mint text-mint-foreground [a&]:hover:bg-mint/90",
        peach: "border-transparent bg-peach text-peach-foreground [a&]:hover:bg-peach/90",
        lavender: "border-transparent bg-lavender text-lavender-foreground [a&]:hover:bg-lavender/90",
        slate: "border-transparent bg-slate text-slate-foreground [a&]:hover:bg-slate/90",
        emerald: "border-transparent bg-emerald text-emerald-foreground [a&]:hover:bg-emerald/90",
        indigo: "border-transparent bg-indigo text-indigo-foreground [a&]:hover:bg-indigo/90",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";

  return (
    <Comp
      className={cn(badgeVariants({ variant }), className)}
      data-slot="badge"
      {...props}
    />
  );
}

export { Badge, badgeVariants };
