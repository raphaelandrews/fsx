
import { useState, useCallback, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import z from "zod";

import { Button } from "@fsx/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@fsx/ui/components/card";
import { Input } from "@fsx/ui/components/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@fsx/ui/components/alert-dialog";

import { useTRPC } from "@/utils/trpc";

const fileSchema = z
  .instanceof(File, { message: "Please select a file." })
  .refine(
    (file) => {
      if (!file) return false;
      const ext = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
      return [".xlsx", ".xls"].includes(ext);
    },
    { message: "Only Excel files (.xlsx, .xls) are allowed." },
  );

interface LogEntry {
  _uuid: string;
  operation: string;
  status: number;
  success?: { id: number; name: string; message: string };
  error?: { message: string };
}

const ITEMS_PER_PAGE = 6;

export const Route = createFileRoute("/_auth/rating-update/")({
  ssr: false,
  component: RatingUpdatePage,
});

function RatingUpdatePage() {
  const [file, setFile] = useState<File | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalUpdates, setTotalUpdates] = useState(0);
  const [successLog, setSuccessLog] = useState<LogEntry[]>([]);
  const [errorLog, setErrorLog] = useState<LogEntry[]>([]);
  const [successPage, setSuccessPage] = useState(1);
  const [errorPage, setErrorPage] = useState(1);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [statusText, setStatusText] = useState("Ready");
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  const trpc = useTRPC();

  const linkMutation = useMutation(trpc.playersTournament.linkWithRating.mutationOptions());
  const createMutation = useMutation(trpc.players.create.mutationOptions());
  const updateMutation = useMutation(trpc.players.update.mutationOptions());

  useEffect(() => {
    const saved = localStorage.getItem("rating-update-log");
    if (saved) {
      try {
        const { success, errors } = JSON.parse(saved);
        if (success?.length) setSuccessLog(success);
        if (errors?.length) setErrorLog(errors);
      } catch { /* ignore */ }
    }
  }, []);

  const persist = (s: LogEntry[], e: LogEntry[]) => {
    localStorage.setItem("rating-update-log", JSON.stringify({ success: s, errors: e }));
  };

  const handleProcess = useCallback(async () => {
    if (!file) return;
    abortRef.current = false;
    setIsRunning(true);
    setCurrentIndex(0);
    setSuccessLog([]);
    setErrorLog([]);
    setStatusText("Reading file...");

    try {
      const data = new Uint8Array(await file.arrayBuffer());
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: "yyyy-mm-dd" }) as unknown[][];

      const headers = (rows[0] as string[]).map((h) => h.toLowerCase().trim());
      const headerMap: Record<string, number> = {};
      headers.forEach((h, i) => { headerMap[h] = i; });

      if (headerMap["id"] === undefined) {
        toast.error("Missing 'id' column");
        setIsRunning(false);
        return;
      }

      const dataRows = rows.slice(1).filter((r) => r.some((c) => c !== null && c !== undefined && c !== ""));
      setTotalUpdates(dataRows.length);

      const newSuccess: LogEntry[] = [];
      const newErrors: LogEntry[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        if (abortRef.current) break;

        const row = dataRows[i];
        const id = Number(row[headerMap["id"]]);
        const name = headerMap["name"] !== undefined ? String(row[headerMap["name"]] ?? "").trim() : undefined;
        const birth = headerMap["birth"] !== undefined ? String(row[headerMap["birth"]] ?? "").trim() : undefined;
        const sex = headerMap["sex"] !== undefined ? String(row[headerMap["sex"]] ?? "").trim().toLowerCase() : undefined;
        const clubId = headerMap["clubid"] !== undefined ? Number(row[headerMap["clubid"]]) || undefined : undefined;
        const locationId = headerMap["locationid"] !== undefined ? Number(row[headerMap["locationid"]]) || undefined : undefined;
        const tournamentId = headerMap["tournamentid"] !== undefined ? Number(row[headerMap["tournamentid"]]) : undefined;
        const variation = headerMap["variation"] !== undefined ? Number(row[headerMap["variation"]]) : undefined;
        const ratingType = headerMap["ratingtype"] !== undefined ? String(row[headerMap["ratingtype"]] ?? "").trim().toLowerCase() : undefined;

        setCurrentIndex(i + 1);
        setStatusText(`Processing row ${i + 1} of ${dataRows.length}`);

        if (Number.isNaN(id) || id < 0) {
          newErrors.push({ _uuid: crypto.randomUUID(), operation: `Row ${i + 1}`, status: 400, error: { message: "Invalid ID" } });
          continue;
        }

        const validRatingTypes = ["blitz", "rapid", "classic"];
        const hasTournamentData = tournamentId !== undefined && !Number.isNaN(tournamentId) &&
          variation !== undefined && !Number.isNaN(variation) && ratingType &&
          validRatingTypes.includes(ratingType);

        try {
          if (hasTournamentData && id > 0) {
            await linkMutation.mutateAsync({
              playerId: id,
              tournamentId,
              variation,
              ratingType: ratingType as "blitz" | "rapid" | "classic",
            });
            if (name) {
              await updateMutation.mutateAsync({
                id,
                name,
                birth: birth || undefined,
                sex: sex === "male" || sex === "female" ? sex : undefined,
                clubId,
                locationId,
              });
            }
            newSuccess.push({ _uuid: crypto.randomUUID(), operation: `${name ?? `ID ${id}`} rating updated (${ratingType}: ${variation > 0 ? "+" : ""}${variation})`, status: 200, success: { id, name: name ?? "", message: `Rating updated` } });
          } else if (hasTournamentData && id === 0 && name) {
            const result = await createMutation.mutateAsync({
              name,
              birth: birth || null,
              sex: sex === "male" || sex === "female" ? sex : "male",
              clubId,
              locationId,
              blitz: 1900,
              rapid: 1900,
              classic: 1900,
              active: true,
              verified: false,
            });
            if (result?.[0]) {
              await linkMutation.mutateAsync({
                playerId: result[0].id,
                tournamentId,
                variation,
                ratingType: ratingType as "blitz" | "rapid" | "classic",
              });
              newSuccess.push({ _uuid: crypto.randomUUID(), operation: `${name} created + linked to tournament`, status: 200, success: { id: result[0].id, name, message: `Created with rating update` } });
            }
          } else if (id > 0 && name) {
            await updateMutation.mutateAsync({
              id,
              name,
              birth: birth || undefined,
              sex: sex === "male" || sex === "female" ? sex : undefined,
              clubId,
              locationId,
            });
            newSuccess.push({ _uuid: crypto.randomUUID(), operation: `${name} updated`, status: 200, success: { id, name, message: "Updated" } });
          } else if (id === 0 && name) {
            const result = await createMutation.mutateAsync({
              name,
              birth: birth || null,
              sex: sex === "male" || sex === "female" ? sex : "male",
              clubId,
              locationId,
              blitz: 1900,
              rapid: 1900,
              classic: 1900,
              active: true,
              verified: false,
            });
            if (result?.[0]) {
              newSuccess.push({ _uuid: crypto.randomUUID(), operation: `${name} created`, status: 200, success: { id: result[0].id, name, message: "Created" } });
            }
          } else {
            newErrors.push({ _uuid: crypto.randomUUID(), operation: `Row ${i + 1}`, status: 400, error: { message: "Invalid data" } });
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          newErrors.push({ _uuid: crypto.randomUUID(), operation: name ?? `ID ${id}`, status: 500, error: { message: msg } });
        }
      }

      setSuccessLog(newSuccess);
      setErrorLog(newErrors);
      persist(newSuccess, newErrors);

      if (!abortRef.current) {
        toast.success(`Processed: ${newSuccess.length} success, ${newErrors.length} errors`);
        setStatusText("Complete");
      } else {
        toast.info("Process stopped");
        setStatusText("Stopped");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to process file");
      setStatusText("Error");
    } finally {
      setIsRunning(false);
    }
  }, [file, linkMutation, createMutation, updateMutation]);

  const clearHistory = () => {
    localStorage.removeItem("rating-update-log");
    setSuccessLog([]);
    setErrorLog([]);
    setCurrentIndex(0);
    setTotalUpdates(0);
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setShowClearConfirm(false);
    setStatusText("Ready");
    toast.info("History cleared");
  };

  const successTotalPages = Math.ceil(successLog.length / ITEMS_PER_PAGE);
  const errorTotalPages = Math.ceil(errorLog.length / ITEMS_PER_PAGE);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Rating Update</h1>
          <p className="text-muted-foreground text-sm">{statusText}</p>
        </div>
        <div className="flex gap-2">
          {isRunning ? (
            <Button variant="destructive" onClick={() => { abortRef.current = true; setIsRunning(false); }}>
              Stop
            </Button>
          ) : (
            <Button onClick={handleProcess} disabled={!file}>
              Run
            </Button>
          )}
          <Button variant="outline" onClick={clearHistory} disabled={isRunning}>
            Clear
          </Button>
        </div>
      </div>

      {!isRunning && successLog.length === 0 && errorLog.length === 0 && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Upload Excel File</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => fileRef.current?.click()}>
                Choose File
              </Button>
              <span className="text-muted-foreground text-sm">
                {file?.name ?? "No file chosen"}
              </span>
              <Input
                type="file"
                className="sr-only"
                ref={fileRef}
                accept=".xls,.xlsx"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  try {
                    fileSchema.parse(f);
                    setFile(f ?? null);
                    setStatusText(`File loaded: ${f?.name}`);
                  } catch {
                    toast.error("Invalid file. Only .xlsx and .xls allowed.");
                  }
                }}
              />
            </div>
            <p className="text-muted-foreground text-xs mt-2">
              Columns: id, name, birth, sex, clubId, locationId, tournamentId, variation, ratingType
            </p>
          </CardContent>
        </Card>
      )}

      {isRunning && (
        <div className="mb-4">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${totalUpdates ? (currentIndex / totalUpdates) * 100 : 0}%` }}
            />
          </div>
          <p className="text-muted-foreground text-xs mt-1">
            {currentIndex} / {totalUpdates}
          </p>
        </div>
      )}

      {(successLog.length > 0 || errorLog.length > 0) && (
        <div className="grid grid-cols-2 gap-8">
          <div>
            <h2 className="mb-2 font-medium text-green-600">Success ({successLog.length})</h2>
            <div className="space-y-2">
              {successLog.slice((successPage - 1) * ITEMS_PER_PAGE, successPage * ITEMS_PER_PAGE).map((e) => (
                <Card key={e._uuid}>
                  <CardContent className="p-3 text-sm">{e.operation}</CardContent>
                </Card>
              ))}
            </div>
            {successTotalPages > 1 && (
              <div className="mt-2 flex gap-2">
                <Button variant="outline" size="sm" disabled={successPage === 1} onClick={() => setSuccessPage((p) => p - 1)}>Prev</Button>
                <span className="text-sm self-center">{successPage}/{successTotalPages}</span>
                <Button variant="outline" size="sm" disabled={successPage === successTotalPages} onClick={() => setSuccessPage((p) => p + 1)}>Next</Button>
              </div>
            )}
          </div>
          <div>
            <h2 className="mb-2 font-medium text-red-600">Errors ({errorLog.length})</h2>
            <div className="space-y-2">
              {errorLog.slice((errorPage - 1) * ITEMS_PER_PAGE, errorPage * ITEMS_PER_PAGE).map((e) => (
                <Card key={e._uuid}>
                  <CardContent className="p-3 text-sm">
                    <p className="font-medium">{e.operation}</p>
                    <p className="text-muted-foreground text-xs">{e.error?.message}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
            {errorTotalPages > 1 && (
              <div className="mt-2 flex gap-2">
                <Button variant="outline" size="sm" disabled={errorPage === 1} onClick={() => setErrorPage((p) => p - 1)}>Prev</Button>
                <span className="text-sm self-center">{errorPage}/{errorTotalPages}</span>
                <Button variant="outline" size="sm" disabled={errorPage === errorTotalPages} onClick={() => setErrorPage((p) => p + 1)}>Next</Button>
              </div>
            )}
          </div>
        </div>
      )}

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear history?</AlertDialogTitle>
            <AlertDialogDescription>
              This will delete all success and error logs from local storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={clearHistory}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
