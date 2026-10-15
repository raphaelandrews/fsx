import { useEffect, useRef, useState } from "react";
import { useRouterState } from "@tanstack/react-router";
import { useIsFetching, useIsMutating } from "@tanstack/react-query";

import { cn } from "@fsx/ui/lib/utils";

import { isAdminPath } from "@/lib/errors";

// Short work finishes before the bar would show, so it never flickers.
const SHOW_AFTER_MS = 150;
const FADE_MS = 300;

/**
 * A thin bar for work the visitor is waiting on: a page navigation, a save, or (in the
 * dashboard) the refetch an edit triggers. Background prefetches and search-as-you-type
 * on the public site stay silent.
 */
export function NavigationProgress() {
  const { navigating, pathname } = useRouterState({
    select: (state) => ({ navigating: state.isLoading || state.status === "pending", pathname: state.location.pathname }),
  });
  const mutating = useIsMutating() > 0;
  const fetching = useIsFetching() > 0 && isAdminPath(pathname);
  const busy = navigating || mutating || fetching;

  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const running = useRef(false);

  useEffect(() => {
    if (busy) {
      const show = setTimeout(() => {
        running.current = true;
        setPhase("running");
      }, SHOW_AFTER_MS);
      return () => clearTimeout(show);
    }
    if (!running.current) return;
    running.current = false;
    setPhase("done");
    const hide = setTimeout(() => setPhase("idle"), FADE_MS);
    return () => clearTimeout(hide);
  }, [busy]);

  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-[60] h-0.5 origin-left bg-primary",
        phase === "idle" && "scale-x-0 opacity-0 transition-none",
        phase === "running" && "scale-x-[0.85] opacity-100 transition-[scale] duration-[6000ms] ease-out",
        phase === "done" && "scale-x-100 opacity-0 transition-[scale,opacity] duration-300 ease-out",
      )}
    />
  );
}
