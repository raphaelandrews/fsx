import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ExcelContent = (string | number | boolean | undefined)[][];

interface MockDataViewerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: ExcelContent | null;
  fileName: string | null;
}

export function MockDataViewerDialog({
  open,
  onOpenChange,
  data,
  fileName,
}: MockDataViewerDialogProps) {
  if (!data || !fileName) {
    return null;
  }

  const headers = data.length > 0 ? data[0] : [];
  const rows = data.length > 1 ? data.slice(1) : [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-11/12 sm:max-w-5xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Mock Data for: {fileName}</DialogTitle>
          <DialogDescription>
            Displaying the content of the selected mock Excel file.
          </DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {headers.map((header) => (
                  <TableHead
                    key={crypto.randomUUID()}
                    className="whitespace-nowrap"
                  >
                    {String(header)}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={crypto.randomUUID()}>
                  {row.map((cell) => (
                    <TableCell
                      key={crypto.randomUUID()}
                      className="whitespace-nowrap"
                    >
                      {String(cell)}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
