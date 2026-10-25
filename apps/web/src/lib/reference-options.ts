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

/** A circuit's category list travels through the string-only form values as JSON. */
export const parseCategoryList = (value: string | undefined): string[] => {
  try {
    const parsed: unknown = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === "string") : [];
  } catch {
    return [];
  }
};

export const stringifyCategoryList = (categories: readonly string[]) => JSON.stringify(categories);

/** The options a circuit offers: its own category list, or every category when it has none. */
export const circuitCategoryOptions = (options: readonly SelectOption[], circuitCategories: readonly { category: string }[]) => {
  if (circuitCategories.length === 0) return options;
  const allowed = new Set(circuitCategories.map((entry) => entry.category));
  return options.filter((option) => allowed.has(option.value));
};
