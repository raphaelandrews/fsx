import { Button } from "@/components/ui/button";

export function RatingUpdatePagination({
  currentPage,
  totalPages,
  nextPage,
  previousPage,
}: {
  currentPage: number;
  totalPages: number;
  nextPage: () => void;
  previousPage: () => void;
}) {
  return (
    <div className="flex items-center gap-2 mt-2">
      <Button
        variant="outline"
        size="sm"
        onClick={previousPage}
        disabled={currentPage === 1}
      >
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={nextPage}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
    </div>
  );
}
