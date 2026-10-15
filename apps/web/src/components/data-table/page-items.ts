export type PageItem =
  | { type: "page"; page: number; isCurrent: boolean }
  | { type: "ellipsis"; key: "start" | "end" };

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => from + i);

// First, last, current, its siblings, and up to two ellipses, always the same count
// (siblingCount * 2 + 5) so the bar keeps its width while paging. Near either end
// the slots an ellipsis would take go to pages: 1 2 3 4 5 … 119, 1 … 4 5 6 … 119.
export function buildPageItems(currentPage: number, totalPages: number, siblingCount = 1): PageItem[] {
  const slots = siblingCount * 2 + 5;
  const page = (n: number): PageItem => ({ type: "page", page: n, isCurrent: n === currentPage });
  if (totalPages <= slots) return range(1, totalPages).map(page);

  const leftSibling = Math.max(currentPage - siblingCount, 1);
  const rightSibling = Math.min(currentPage + siblingCount, totalPages);
  const edgeCount = slots - 2;
  // An ellipsis appears only once the current page leaves the leading (or trailing)
  // block, so it always hides at least two pages, never just one.
  const showStartEllipsis = rightSibling > edgeCount;
  const showEndEllipsis = leftSibling < totalPages - edgeCount + 1;

  if (!showStartEllipsis) {
    return [...range(1, edgeCount).map(page), { type: "ellipsis", key: "end" }, page(totalPages)];
  }
  if (!showEndEllipsis) {
    return [page(1), { type: "ellipsis", key: "start" }, ...range(totalPages - edgeCount + 1, totalPages).map(page)];
  }
  return [
    page(1),
    { type: "ellipsis", key: "start" },
    ...range(leftSibling, rightSibling).map(page),
    { type: "ellipsis", key: "end" },
    page(totalPages),
  ];
}
