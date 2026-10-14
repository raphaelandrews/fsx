import { Button } from "@fsx/ui/components/button";

export function LogTitle({ title, length, success }: { title: string; length: number; success: boolean }) {
  return (
    <div className="flex w-fit items-center gap-2 rounded-md border px-3 py-2">
      <p className={success ? "font-medium text-success" : "font-medium text-destructive"}>{title}</p>
      <span
        className={`text-xs rounded-sm px-1.5 py-0.5 ${success ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive"}`}
      >
        {length}
      </span>
    </div>
  );
}

export function LogPagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (p: number) => void;
}) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </Button>
    </div>
  );
}
