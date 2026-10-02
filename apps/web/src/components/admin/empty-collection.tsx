import { Link, type LinkProps } from "@tanstack/react-router";

import { buttonVariants } from "@fsx/ui/components/button";

export function EmptyCollection({ noun, createTo }: { noun: string; createTo: LinkProps["to"] }) {
  return (
    <div className="flex flex-col items-center gap-3 py-6 text-center">
      <p className="text-muted-foreground text-sm">No {noun} yet.</p>
      <Link to={createTo} className={buttonVariants({ size: "sm" })}>
        Create the first one
      </Link>
    </div>
  );
}
