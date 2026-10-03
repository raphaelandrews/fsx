import { useCallback, useEffect, useMemo, useRef } from "react";

import { useTRPCClient } from "@/utils/trpc";

// Coordinates R2 object lifecycle with a form's save:
//
// - `replaced`: the image(s) the record pointed at before the edit. Deleting on
//   replace would break the record if the admin cancels, so they are only
//   removed after a successful save.
// - `created`: images uploaded during the edit that are not yet referenced by a
//   saved record. If the save fails (or the form is abandoned), superseded
//   uploads are deleted — otherwise a failed create leaves them in R2 forever.
//
// On failure the upload currently held by the form is *kept* so a retry still
// references a live object; it is only deleted when it is superseded or the
// form unmounts without saving.
export function usePendingImageDeletes() {
  const trpc = useTRPCClient();
  const replaced = useRef<Set<string>>(new Set());
  const created = useRef<Set<string>>(new Set());

  const trackReplaced = useCallback((url: string | null | undefined) => {
    if (url) replaced.current.add(url);
  }, []);

  const trackCreated = useCallback((url: string | null | undefined) => {
    if (url) created.current.add(url);
  }, []);

  const deleteUrls = useCallback(
    async (urls: string[]) => {
      if (urls.length === 0) return;
      const results = await Promise.allSettled(
        urls.map((url) => trpc.images.delete.mutate({ url })),
      );
      return urls.filter((_, i) => results[i]?.status === "rejected");
    },
    [trpc],
  );

  // Save succeeded: the record now references the new image. Delete the replaced
  // objects and forget the uploads (they are committed).
  const commit = useCallback(async () => {
    const urls = Array.from(replaced.current);
    replaced.current.clear();
    created.current.clear();
    await deleteUrls(urls);
  }, [deleteUrls]);

  // Save failed or the form was abandoned: delete uploads that are no longer
  // referenced by the form (`keepUrl` stays for a retry; on unmount there is no
  // keep). `replaced` is left intact — the record still points at it.
  const discard = useCallback(
    async (keepUrl?: string | null) => {
      const toDelete = Array.from(created.current).filter((url) => url !== keepUrl);
      for (const url of toDelete) created.current.delete(url);
      await deleteUrls(toDelete);
    },
    [deleteUrls],
  );

  // Clean up uncommitted uploads when the form unmounts without saving. Safe
  // after a successful save because `commit` has already emptied the set.
  useEffect(() => {
    return () => {
      void discard();
    };
  }, [discard]);

  // The shape `EntityForm` takes for its `image` fields.
  const tracking = useMemo(
    () => ({ onImageReplaced: trackReplaced, onImageUploaded: trackCreated }),
    [trackReplaced, trackCreated],
  );

  return { trackReplaced, trackCreated, tracking, commit, discard };
}
