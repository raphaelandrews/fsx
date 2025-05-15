import { useNavigate, useSearch } from "@tanstack/react-router";
import type { Table } from "@tanstack/react-table";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronsLeftIcon,
  ChevronsRightIcon,
} from "lucide-react";

import { Button } from "~/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

interface DataTablePaginationProps<TData> {
  table: Table<TData>;
  totalPages: number;
}

export function DataTablePagination<TData>({
  table,
  totalPages,
}: DataTablePaginationProps<TData>) {
  const search = useSearch({ from: "/_default/ratings/" });
  const navigate = useNavigate();

  const currentPage = search.page || 1;
  const currentPageSize = search.limit || 20;

  const handlePageChange = (page: number) => {
    navigate({
      to: "/ratings",
      search: (prev) => ({
        ...prev,
        page: page,
      }),
    });
  };

  const handlePageSizeChange = (size: number) => {
    table.setPageSize(size);
    navigate({
      to: "/ratings",
      search: (prev) => ({
        ...prev,
        limit: size,
        page: 1,
      }),
    });
  };

  return (
    <div className="flex items-center justify-end px-2">
      <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-3 sm:space-y-0 sm:space-x-6 lg:space-x-8">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium">Jogadores por página</p>
          <Select
            value={`${currentPageSize}`}
            onValueChange={(value) => {
              handlePageSizeChange(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue
                placeholder={
                  search.limit || table.getState().pagination.pageSize
                }
              />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 20, 30, 40, 50].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center lg:space-x-4">
          <div className="flex items-center justify-center text-sm font-medium">
            Página {currentPage} de {totalPages || table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => handlePageChange(1)}
              disabled={currentPage <= 1}
            >
              <span className="sr-only">Go to first page</span>
              <ChevronsLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
            >
              <span className="sr-only">Go to previous page</span>
              <ChevronLeftIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="h-8 w-8 p-0"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage >= totalPages}
            >
              <span className="sr-only">Go to next page</span>
              <ChevronRightIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              onClick={() => handlePageChange(totalPages)}
              disabled={currentPage >= totalPages}
            >
              <span className="sr-only">Go to last page</span>
              <ChevronsRightIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
