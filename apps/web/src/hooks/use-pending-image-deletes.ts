import { useCallback, useRef } from "react";

import { useTRPCClient } from "@/utils/trpc";

// Tracks image URLs that were replaced/removed in the editor and only deletes
// them from R2 *after* the record is actually saved. Deleting on replace would
// break the current image if the admin cancels the edit without saving — the DB
// row would keep pointing at an already-deleted object. Deferring to save means
// the new reference is committed first, then the old object is cleaned up.
export function usePendingImageDeletes() {
  const trpc = useTRPCClient();
  const pending = useRef<Set<string>>(new Set());

  const track = useCallback((url: string | null | undefined) => {
    if (url) pending.current.add(url);
  }, []);

  const flush = useCallback(async () => {
    const urls = Array.from(pending.current);
    if (urls.length === 0) return;
    const results = await Promise.allSettled(
      urls.map((url) => trpc.images.delete.mutate({ url })),
    );
    // Keep any that failed so a later save can retry; images.delete is idempotent.
    pending.current = new Set(
      urls.filter((_, i) => results[i]?.status === "rejected"),
    );
  }, [trpc]);

  return { track, flush };
}
