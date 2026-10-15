import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { ExcelContent } from "./rating-update-types";

interface MockDataViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ExcelContent | null; // Use the imported ExcelContent type
  fileName: string | null;
}

export function MockDataViewerDialog({
  open,
  onOpenChange,
  data,
  fileName,
}: MockDataViewerDialogProps) {
  const headerRow = data ? data[0] : [];
  const dataRows = data ? data.slice(1) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-11/12 sm:max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Mock Data Viewer: {fileName}</DialogTitle>
        </DialogHeader>

        <Table>
          <TableHeader>
            <TableRow>
              {headerRow.map((header) => (
                <TableHead key={crypto.randomUUID()}>{header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataRows.map((row) => (
              <TableRow key={crypto.randomUUID()}>
                {row.map((cell) => (
                  <TableCell key={crypto.randomUUID()}>
                    {cell === undefined || cell === null ? "-" : String(cell)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </DialogContent>
    </Dialog>
  );
}
