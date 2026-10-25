import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { useTRPC } from "@/lib/trpc";

export type SelectOption = { value: string; label: string };

const STALE_MS = 5 * 60 * 1000;

/** Category names for a select, from the `categories` table, in its sort order. */
export function useCategoryOptions(): SelectOption[] {
  const trpc = useTRPC();
  const { data = [] } = useQuery({ ...trpc.categories.list.queryOptions(), staleTime: STALE_MS });
  return useMemo(() => data.map((category) => ({ value: category.name, label: category.name })), [data]);
}

/** Scoring schemes for a select (admin only). */
export function useScoringSchemeOptions(): SelectOption[] {
  const trpc = useTRPC();
  const { data = [] } = useQuery({ ...trpc.scoringSchemes.list.queryOptions(), staleTime: STALE_MS });
  return useMemo(() => data.map((scheme) => ({ value: String(scheme.id), label: scheme.name })), [data]);
}
