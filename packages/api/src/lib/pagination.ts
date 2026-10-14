export function paginate({
  page,
  perPage,
  totalItems,
}: {
  page: number;
  perPage: number;
  totalItems: number;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
  return {
    currentPage: page,
    totalPages,
    totalItems,
    itemsPerPage: perPage,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
}
