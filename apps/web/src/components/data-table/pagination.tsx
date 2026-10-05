import { useEffect, useRef, type MouseEvent, type ReactNode } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ArrowLeft01Icon,
  ArrowLeftDoubleIcon,
  ArrowRight01Icon,
  ArrowRightDoubleIcon,
  MoreHorizontalCircle01Icon,
} from "@hugeicons/core-free-icons";

import { Button, buttonVariants } from "@fsx/ui/components/button";
import { cn } from "@fsx/ui/lib/utils";

import { buildPageItems } from "./page-items";

import { useTableText } from "@/lib/table-text";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
  /** Warm the target page's loader on hover/focus, like intent preloading on links. */
  onPagePreload?: (page: number) => void;
  /** Render pages as real links: crawlable, and usable before hydration. */
  getPageHref?: (page: number) => string;
  showLabel?: boolean;
  showEdges?: boolean;
  siblingCount?: number;
  className?: string;
}

// Module scope: the route's pending state can unmount this bar while the next
// page loads, so the request to restore focus must outlive the instance.
let restoreFocusAfterPageChange = false;

type ControlStyle = { variant: "default" | "outline" | "ghost"; size: "default" | "sm" | "icon" };

function PageControl({
  page,
  disabled,
  label,
  className,
  style,
  current,
  getPageHref,
  onSelect,
  onPagePreload,
  children,
}: {
  page: number;
  disabled?: boolean;
  label: string;
  className?: string;
  style: ControlStyle;
  current?: boolean;
  getPageHref?: (page: number) => string;
  onSelect: (page: number) => void;
  onPagePreload?: (page: number) => void;
  children: ReactNode;
}) {
  const preload =
    onPagePreload && !disabled && !current
      ? { onMouseEnter: () => onPagePreload(page), onFocus: () => onPagePreload(page) }
      : {};

  if (getPageHref && !disabled) {
    return (
      <a
        {...preload}
        aria-current={current ? "page" : undefined}
        aria-label={label}
        className={cn(buttonVariants(style), className)}
        href={getPageHref(page)}
        onClick={(event: MouseEvent<HTMLAnchorElement>) => {
          if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
          event.preventDefault();
          if (!current) onSelect(page);
        }}
      >
        {children}
      </a>
    );
  }

  return (
    <Button
      {...preload}
      aria-current={current ? "page" : undefined}
      aria-label={label}
      className={className}
      disabled={disabled}
      onClick={() => onSelect(page)}
      size={style.size}
      variant={style.variant}
    >
      {children}
    </Button>
  );
}

function Ellipsis({ keyId }: { keyId: "start" | "end" }) {
  const text = useTableText();
  return (
    <span
      aria-hidden
      className="flex h-8 w-8 items-center justify-center text-muted-foreground"
      data-ellipsis={keyId}
    >
      <HugeiconsIcon className="size-4" icon={MoreHorizontalCircle01Icon} strokeWidth={2} />
      <span className="sr-only">{text.morePages}</span>
    </span>
  );
}

export function Pagination({
  currentPage,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPageChange,
  onPagePreload,
  getPageHref,
  showLabel = false,
  showEdges = true,
  siblingCount = 1,
  className,
}: PaginationProps) {
  const text = useTableText();
  const navRef = useRef<HTMLElement>(null);

  // The control the user activated can disappear or become disabled (e.g. "next"
  // on the last page), dropping focus to <body>; keep keyboard users in the bar.
  useEffect(() => {
    if (!restoreFocusAfterPageChange) return;
    restoreFocusAfterPageChange = false;
    const nav = navRef.current;
    const active = document.activeElement as HTMLButtonElement | null;
    if (!nav || (active && nav.contains(active) && !active.disabled)) return;
    const visible = (element: HTMLElement) => element.offsetParent !== null;
    const target =
      [...nav.querySelectorAll<HTMLElement>('[aria-current="page"]')].find(visible) ??
      [...nav.querySelectorAll<HTMLElement>("a[href], button:not([disabled])")].find(visible);
    target?.focus();
  }, [currentPage]);

  if (totalPages <= 1) return null;

  const items = buildPageItems(currentPage, totalPages, siblingCount);
  const changePage = (page: number) => {
    restoreFocusAfterPageChange = navRef.current?.contains(document.activeElement) ?? false;
    onPageChange(page);
  };
  const shared = { getPageHref, onSelect: changePage, onPagePreload };
  const renderItems = (list: typeof items, size: string) =>
    list.map((item) =>
      item.type === "ellipsis" ? (
        <Ellipsis key={`ellipsis-${item.key}`} keyId={item.key} />
      ) : (
        <PageControl
          {...shared}
          key={item.page}
          className={cn(size, "p-0 text-base tabular-nums", item.isCurrent && "pointer-events-none")}
          current={item.isCurrent}
          label={`Ir para a página ${item.page}`}
          page={item.page}
          style={{ variant: item.isCurrent ? "default" : "outline", size: "sm" }}
        >
          {item.page}
        </PageControl>
      ),
    );

  return (
    <nav
      ref={navRef}
      aria-label={text.pagination}
      className={cn(
        "flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3",
        className,
      )}
    >
      <div className="flex items-center gap-1">
        {showEdges ? (
          <PageControl
            {...shared}
            className="hidden sm:inline-flex"
            disabled={!hasPreviousPage}
            label={text.firstPage}
            page={1}
            style={{ variant: "ghost", size: "icon" }}
          >
            <HugeiconsIcon className="size-4" icon={ArrowLeftDoubleIcon} strokeWidth={2} />
          </PageControl>
        ) : null}

        <PageControl
          {...shared}
          className="gap-1.5 px-2.5"
          disabled={!hasPreviousPage}
          label={text.previousPage}
          page={Math.max(1, currentPage - 1)}
          style={{ variant: "outline", size: "default" }}
        >
          <HugeiconsIcon className="size-4" icon={ArrowLeft01Icon} strokeWidth={2} />
          <span className="hidden sm:inline">{text.previous}</span>
        </PageControl>

        <div className="hidden items-center gap-1 sm:flex">{renderItems(items, "size-8")}</div>

        <PageControl
          {...shared}
          className="gap-1.5 px-2.5"
          disabled={!hasNextPage}
          label={text.nextPage}
          page={Math.min(totalPages, currentPage + 1)}
          style={{ variant: "outline", size: "default" }}
        >
          <span className="hidden sm:inline">{text.next}</span>
          <HugeiconsIcon className="size-4" icon={ArrowRight01Icon} strokeWidth={2} />
        </PageControl>

        {showEdges ? (
          <PageControl
            {...shared}
            className="hidden sm:inline-flex"
            disabled={!hasNextPage}
            label={text.lastPage}
            page={totalPages}
            style={{ variant: "ghost", size: "icon" }}
          >
            <HugeiconsIcon className="size-4" icon={ArrowRightDoubleIcon} strokeWidth={2} />
          </PageControl>
        ) : null}
      </div>

      {showLabel ? (
        <p aria-live="polite" aria-atomic="true" className="text-sm text-muted-foreground">
          {text.pageOf(currentPage, totalPages)}
        </p>
      ) : (
        <span className="sr-only" aria-live="polite" aria-atomic="true">
          {text.pageOf(currentPage, totalPages)}
        </span>
      )}
    </nav>
  );
}
