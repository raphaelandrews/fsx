import * as React from "react";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
  MoreHorizontalIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { type ButtonProps, buttonVariants } from "@/components/ui/button";

const Pagination = ({ className, ...props }: React.ComponentProps<"nav">) => (
  <nav
    role="navigation"
    aria-label="pagination"
    className={cn("mx-auto flex w-full justify-center", className)}
    {...props}
  />
);
Pagination.displayName = "Pagination";

const PaginationContent = React.forwardRef<
  HTMLUListElement,
  React.ComponentProps<"ul">
>(({ className, ...props }, ref) => (
  <ul
    ref={ref}
    className={cn("flex flex-row items-center gap-1", className)}
    {...props}
  />
));
PaginationContent.displayName = "PaginationContent";

const PaginationItem = React.forwardRef<
  HTMLLIElement,
  React.ComponentProps<"li"> & { disabled?: boolean }
>(({ className, disabled, ...props }, ref) => (
  <li
    ref={ref}
    className={cn(
      className,
      { disabled },
      `hover:cursor-pointer ${disabled && "opacity-40 hover:cursor-default"}`
    )}
    {...props}
  />
));
PaginationItem.displayName = "PaginationItem";

type PaginationLinkProps = {
  isActive?: boolean;
} & Pick<ButtonProps, "size"> &
  React.ComponentProps<"a">;

const PaginationLink = ({
  className,
  isActive,
  size = "icon",
  ...props
}: PaginationLinkProps) => (
  <a
    aria-current={isActive ? "page" : undefined}
    className={cn(
      buttonVariants({
        variant: isActive ? "outline" : "ghost",
        size,
      }),
      className
    )}
    {...props}
  />
);
PaginationLink.displayName = "PaginationLink";

const PaginationFirst = ({
  className,
  disabled,
  ...props
}: React.ComponentProps<typeof PaginationLink> & { disabled?: boolean }) => {
  const handleClick: React.MouseEventHandler<HTMLAnchorElement> | undefined =
    disabled ? undefined : props.onClick;

  return (
    <PaginationLink
      aria-label="Go to first page"
      size="default"
      className={cn("gap-1 px-3", className)}
      onClick={handleClick}
      {...props}
    >
      <span className="sr-only">Go to first page</span>
      <ChevronsLeftIcon className="h-4 w-4" />
    </PaginationLink>
  );
};

PaginationFirst.displayName = "PaginationFirst";

const PaginationPrevious = ({
  className,
  disabled,
  ...props
}: React.ComponentProps<typeof PaginationLink> & { disabled?: boolean }) => {
  const handleClick: React.MouseEventHandler<HTMLAnchorElement> | undefined =
    disabled ? undefined : props.onClick;

  return (
    <PaginationLink
      aria-label="Go to previous page"
      size="default"
      className={cn("gap-1 px-3", className)}
      onClick={handleClick}
      {...props}
    >
      <ChevronLeftIcon className="h-4 w-4" />
      <span className="sr-only">Previous</span>
    </PaginationLink>
  );
};
PaginationPrevious.displayName = "PaginationPrevious";

const PaginationNext = ({
  className,
  disabled,
  ...props
}: React.ComponentProps<typeof PaginationLink> & { disabled?: boolean }) => {
  const handleClick: React.MouseEventHandler<HTMLAnchorElement> | undefined =
    disabled ? undefined : props.onClick;

  return (
    <PaginationLink
      aria-label="Go to next page"
      size="default"
      className={cn("gap-1 px-3", className)}
      onClick={handleClick}
      {...props}
    >
      <span className="sr-only">Next</span>
      <ChevronRightIcon className="h-4 w-4" />
    </PaginationLink>
  );
};
PaginationNext.displayName = "PaginationNext";

const PaginationLast = ({
  className,
  disabled,
  ...props
}: React.ComponentProps<typeof PaginationLink> & { disabled?: boolean }) => {
  const handleClick: React.MouseEventHandler<HTMLAnchorElement> | undefined =
    disabled ? undefined : props.onClick;

  return (
    <PaginationLink
      aria-label="Go to last page"
      size="default"
      className={cn("gap-1 px-3", className)}
      onClick={handleClick}
      {...props}
    >
      <span className="sr-only">Last</span>
      <ChevronsRightIcon className="h-4 w-4" />
    </PaginationLink>
  );
};
PaginationLast.displayName = "PaginationLast";

const PaginationEllipsis = ({
  className,
  ...props
}: React.ComponentProps<"span">) => (
  <span
    aria-hidden
    className={cn("flex h-9 w-9 items-center justify-center", className)}
    {...props}
  >
    <MoreHorizontalIcon className="h-4 w-4" />
    <span className="sr-only">More pages</span>
  </span>
);
PaginationEllipsis.displayName = "PaginationEllipsis";

export {
  Pagination,
  PaginationContent,
  PaginationLink,
  PaginationFirst,
  PaginationLast,
  PaginationItem,
  PaginationPrevious,
  PaginationNext,
  PaginationEllipsis,
};
