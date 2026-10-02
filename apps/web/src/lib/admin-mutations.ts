import type { QueryClient, QueryFilters } from "@tanstack/react-query";

export async function invalidateAdminQueries(
  queryClient: QueryClient,
  filters: QueryFilters[],
): Promise<void> {
  await Promise.all(filters.map((filters) => queryClient.invalidateQueries(filters)));
}
