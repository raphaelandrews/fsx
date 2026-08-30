"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { toast } from "sonner";

import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@fsx/ui/components/alert-dialog";
import { Button } from "@fsx/ui/components/button";

import { useTRPC } from "@/utils/trpc";
import { RatingUpdateLogs } from "@/components/rating-update/rating-update-logs";
import { RatingUpdateMonitor } from "@/components/rating-update/rating-update-monitor";
import { RatingUpdateToolbar } from "@/components/rating-update/rating-update-toolbar";
import type { AnimationState } from "@/components/rating-update/motion-grid-states";
import type { RatingUpdateProps } from "@/components/rating-update/rating-update-types";

const ITEMS_PER_PAGE = 6;

export const Route = createFileRoute("/_auth/rating-update/")({
  ssr: false,
  component: RatingUpdatePage,
});

function RatingUpdatePage() {
  const trpc = useTRPC();
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef(false);

  const [file, setFile] = useState<File | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [totalUpdates, setTotalUpdates] = useState(0);
  const [successLog, setSuccessLog] = useState<RatingUpdateProps[]>([]);
  const [errorLog, setErrorLog] = useState<RatingUpdateProps[]>([]);
  const [successPage, setSuccessPage] = useState(1);
  const [errorPage, setErrorPage] = useState(1);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [statusText, setStatusText] = useState("Ready");
  const [animationState, setAnimationState] = useState<AnimationState>("ready");

  const linkMutation = useMutation(trpc.playersTournament.linkWithRating.mutationOptions());
  const createMutation = useMutation(trpc.players.create.mutationOptions());
  const updateMutation = useMutation(trpc.players.update.mutationOptions());

  const setMotionGridStatus = useCallback((text: string, animation: AnimationState) => {
    setStatusText(text);
    setAnimationState(animation);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("rating-update-log");
    if (saved) {
      try {
        const { success, errors } = JSON.parse(saved);
        if (success?.length) setSuccessLog(success);
        if (errors?.length) setErrorLog(errors);
      } catch {
        /* ignore */
      }
    }
  }, []);

  const persist = (s: RatingUpdateProps[], e: RatingUpdateProps[]) => {
    localStorage.setItem("rating-update-log", JSON.stringify({ success: s, errors: e }));
  };

  const validateExcel = (headerMap: Record<string, number>) => {
    const available = Object.keys(headerMap);
    const hasPlayerData = ["name", "sex", "birth", "locationid", "clubid"].some((c) => c in headerMap);
    const hasAllTournament = ["tournamentid", "variation", "ratingtype"].every((c) => c in headerMap);
    const hasPartialTournament = ["tournamentid", "variation", "ratingtype"].some((c) => c in headerMap);

    if (available.length === 1 && available[0] === "id") {
      setMotionGridStatus("Error: Only 'id' column present", "x");
      throw new Error("File contains only the 'id' column. Additional data columns are required.");
    }
    if (hasPartialTournament && !hasAllTournament) {
      setMotionGridStatus("Error: Incomplete tournament columns", "x");
      throw new Error("If any tournament-related column is present, all three (tournamentId, variation, ratingType) must be included.");
    }
    if (!hasPlayerData && !hasAllTournament) {
      setMotionGridStatus("Error: No valid data columns found", "x");
      throw new Error("File must contain either player data columns or complete tournament columns.");
    }
  };

  const handleProcess = async () => {
    if (!file) {
      toast.error("Please select a file to upload.");
      return;
    }
    abortRef.current = false;
    setIsRunning(true);
    setCurrentIndex(0);
    setSuccessLog([]);
    setErrorLog([]);
    setSuccessPage(1);
    setErrorPage(1);
    setMotionGridStatus("Reading Excel file", "searching");

    try {
      const data = new Uint8Array(await file.arrayBuffer());
      const workbook = XLSX.read(data, { type: "array" });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false, dateNF: "yyyy-mm-dd" }) as unknown[][];

      const headers = (rows[0] as string[]).map((h) => h.toLowerCase().trim());
      const headerMap: Record<string, number> = {};
      headers.forEach((h, i) => { headerMap[h] = i; });

      validateExcel(headerMap);

      if (headerMap["id"] === undefined) {
        setMotionGridStatus("Error: 'id' column missing", "x");
        toast.error("Mandatory column 'id' is missing in the Excel file.");
        return;
      }

      const dataRows = rows.slice(1).filter((r) => r.some((c) => c !== null && c !== undefined && c !== ""));
      if (dataRows.length === 0) {
        setMotionGridStatus("Error: No valid data rows found", "x");
        toast.error("File contains no data rows or all rows are empty.");
        return;
      }
      setTotalUpdates(dataRows.length);

      const newSuccess: RatingUpdateProps[] = [];
      const newErrors: RatingUpdateProps[] = [];

      for (let i = 0; i < dataRows.length; i++) {
        if (abortRef.current) break;
        setCurrentIndex(i + 1);
        setMotionGridStatus(`Processing row ${i + 1} of ${dataRows.length}`, "busy");

        const row = dataRows[i];
        const id = Number.parseInt(String(row[headerMap["id"]]), 10);
        const name = headerMap["name"] !== undefined ? String(row[headerMap["name"]] ?? "").trim() : undefined;
        const birth = headerMap["birth"] !== undefined ? String(row[headerMap["birth"]] ?? "").trim() : undefined;
        const sexRaw = headerMap["sex"] !== undefined ? String(row[headerMap["sex"]] ?? "").trim().toLowerCase() : undefined;
        const clubIdRaw = headerMap["clubid"] !== undefined ? String(row[headerMap["clubid"]] ?? "").trim() : undefined;
        const locationIdRaw = headerMap["locationid"] !== undefined ? String(row[headerMap["locationid"]] ?? "").trim() : undefined;
        const tournamentIdRaw = headerMap["tournamentid"] !== undefined ? String(row[headerMap["tournamentid"]] ?? "").trim() : undefined;
        const variationRaw = headerMap["variation"] !== undefined ? String(row[headerMap["variation"]] ?? "").trim() : undefined;
        const ratingTypeRaw = headerMap["ratingtype"] !== undefined ? String(row[headerMap["ratingtype"]] ?? "").trim().toLowerCase() : undefined;

        const sex = sexRaw === "true" || sexRaw === "1" || sexRaw === "t" ? "male" : sexRaw === "false" || sexRaw === "0" || sexRaw === "f" ? "female" : undefined;
        const clubId = clubIdRaw ? Number.parseInt(clubIdRaw, 10) : undefined;
        const locationId = locationIdRaw ? Number.parseInt(locationIdRaw, 10) : undefined;
        const tournamentId = tournamentIdRaw ? Number.parseInt(tournamentIdRaw, 10) : undefined;
        const variation = variationRaw ? Number.parseInt(variationRaw, 10) : undefined;
        const ratingType = ratingTypeRaw;

        const validRatingTypes = ["blitz", "rapid", "classic"] as const;
        const isTournamentUpdate = tournamentId !== undefined || variation !== undefined || ratingType !== undefined;
        const hasValidTournamentData = tournamentId !== undefined && variation !== undefined && ratingType && validRatingTypes.includes(ratingType as (typeof validRatingTypes)[number]);

        if (isTournamentUpdate && !hasValidTournamentData) {
          newErrors.push({ _uuid: crypto.randomUUID(), operation: `Row ${i + 1}`, status: 400, error: { message: "If any tournament-related column is present, all three (tournamentId, variation, ratingType) must be valid." } });
          continue;
        }
        if (Number.isNaN(id) || id < 0) {
          newErrors.push({ _uuid: crypto.randomUUID(), operation: `Row ${i + 1}`, status: 400, error: { message: "Invalid or missing 'id'. ID must be 0 or positive." } });
          continue;
        }
        if (id === 0 && !name) {
          newErrors.push({ _uuid: crypto.randomUUID(), operation: `Row ${i + 1}`, status: 400, error: { message: "Missing or empty 'name' for new player." } });
          continue;
        }

        try {
          if (isTournamentUpdate && id > 0) {
            await linkMutation.mutateAsync({ playerId: id, tournamentId: tournamentId!, variation: variation!, ratingType: ratingType as "blitz" | "rapid" | "classic" });
            if (name || birth || sex || clubId || locationId) {
              await updateMutation.mutateAsync({ id, name, birthDate: birth || undefined, sex, clubId, locationId });
            }
            newSuccess.push({ _uuid: crypto.randomUUID(), operation: `${name ?? `ID ${id}`} updated (${ratingType}: ${variation! > 0 ? "+" : ""}${variation})`, status: 200, success: { dataFields: { id, name: name ?? "", birth: birth ?? null, sex: sex === "female", clubId: clubId ?? null, locationId: locationId ?? null }, message: "Rating updated" } });
          } else if (isTournamentUpdate && id === 0 && name) {
            const result = await createMutation.mutateAsync({ name, birthDate: birth || null, sex: sex ?? "male", clubId, locationId, blitz: 1900, rapid: 1900, classic: 1900, active: true, verified: false });
            if (result?.[0]) {
              await linkMutation.mutateAsync({ playerId: result[0].id, tournamentId: tournamentId!, variation: variation!, ratingType: ratingType as "blitz" | "rapid" | "classic" });
              newSuccess.push({ _uuid: crypto.randomUUID(), operation: `${name} created + linked to tournament`, status: 200, success: { dataFields: { id: result[0].id, name, birth: birth ?? null, sex: sex === "female", clubId: clubId ?? null, locationId: locationId ?? null }, message: "Created with rating update" } });
            }
          } else if (id > 0 && (name || birth || sex || clubId || locationId)) {
            await updateMutation.mutateAsync({ id, name, birthDate: birth || undefined, sex, clubId, locationId });
            newSuccess.push({ _uuid: crypto.randomUUID(), operation: `${name ?? `ID ${id}`} updated`, status: 200, success: { dataFields: { id, name: name ?? "", birth: birth ?? null, sex: sex === "female", clubId: clubId ?? null, locationId: locationId ?? null }, message: "Updated" } });
          } else if (id === 0 && name) {
            const result = await createMutation.mutateAsync({ name, birthDate: birth || null, sex: sex ?? "male", clubId, locationId, blitz: 1900, rapid: 1900, classic: 1900, active: true, verified: false });
            if (result?.[0]) {
              newSuccess.push({ _uuid: crypto.randomUUID(), operation: `${name} created`, status: 200, success: { dataFields: { id: result[0].id, name, birth: birth ?? null, sex: sex === "female", clubId: clubId ?? null, locationId: locationId ?? null }, message: "Created" } });
            }
          } else {
            newErrors.push({ _uuid: crypto.randomUUID(), operation: `Row ${i + 1}`, status: 400, error: { message: "Invalid data: no valid operation." } });
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : "Unknown error";
          newErrors.push({ _uuid: crypto.randomUUID(), operation: name ?? `ID ${id}`, status: 500, error: { message: msg } });
        }
      }

      setSuccessLog(newSuccess);
      setErrorLog(newErrors);
      persist(newSuccess, newErrors);

      if (!abortRef.current) {
        toast.success(`Processed: ${newSuccess.length} success, ${newErrors.length} errors`);
        setMotionGridStatus("Update process completed successfully", "saving");
      } else {
        toast.info("Process stopped");
        setMotionGridStatus("Process stopped", "stop");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to process file");
      setMotionGridStatus("Error", "x");
    } finally {
      setIsRunning(false);
    }
  };

  const clearHistory = () => {
    localStorage.removeItem("rating-update-log");
    setSuccessLog([]);
    setErrorLog([]);
    setCurrentIndex(0);
    setTotalUpdates(0);
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setShowClearConfirm(false);
    setMotionGridStatus("History cleared. Ready to start", "ready");
  };

  const clearFile = () => {
    setFile(null);
    if (fileRef.current) fileRef.current.value = "";
    setMotionGridStatus("File input cleared", "ready");
    toast.info("File input cleared.");
  };

  const successTotalPages = Math.ceil(successLog.length / ITEMS_PER_PAGE);
  const errorTotalPages = Math.ceil(errorLog.length / ITEMS_PER_PAGE);
  const hasLogs = successLog.length > 0 || errorLog.length > 0;

  return (
    <div className="relative h-[calc(100dvh-4rem)] overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(var(--muted),transparent_1px)] [background-size:16px_16px]" />

      <RatingUpdateMonitor
        animationState={animationState}
        currentIndex={currentIndex}
        statusText={statusText}
        totalUpdates={totalUpdates}
      />

      {!isRunning && !hasLogs && (
        <div className="absolute top-[40%] left-1/2 w-full max-w-lg -translate-x-1/2 rounded-xl bg-background p-6 shadow-md">
          <h2 className="mb-2 font-medium">Select Excel File</h2>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => fileRef.current?.click()}>Choose File</Button>
            <span className="text-sm text-muted-foreground">{file?.name ?? "No file chosen"}</span>
            <input
              type="file"
              className="sr-only"
              accept=".xls,.xlsx"
              ref={fileRef}
              onChange={(e) => {
                const f = e.target.files?.[0] ?? null;
                if (f) {
                  const ext = f.name.substring(f.name.lastIndexOf(".")).toLowerCase();
                  if (![".xlsx", ".xls"].includes(ext)) {
                    toast.error("Only Excel files (.xlsx, .xls) are allowed.");
                    setFile(null);
                    return;
                  }
                }
                setFile(f);
                setMotionGridStatus(f ? `File loaded: ${f.name}` : "File input cleared", "add");
              }}
            />
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Columns: id, name, birth, sex, clubId, locationId, tournamentId, variation, ratingType
          </p>
        </div>
      )}

      {hasLogs && (
        <div className="absolute top-[18%] left-1/2 flex -translate-x-1/2 gap-6">
          <div className="flex flex-col items-center gap-3">
            <LogTitle title="Success log" length={successLog.length} success />
            <RatingUpdateLogs updates={successLog.slice((successPage - 1) * ITEMS_PER_PAGE, successPage * ITEMS_PER_PAGE)} />
            {successTotalPages > 1 && (
              <LogPagination currentPage={successPage} totalPages={successTotalPages} onPageChange={setSuccessPage} />
            )}
          </div>
          <div className="flex flex-col items-center gap-3">
            <LogTitle title="Error log" length={errorLog.length} success={false} />
            <RatingUpdateLogs updates={errorLog.slice((errorPage - 1) * ITEMS_PER_PAGE, errorPage * ITEMS_PER_PAGE)} />
            {errorTotalPages > 1 && (
              <LogPagination currentPage={errorPage} totalPages={errorTotalPages} onPageChange={setErrorPage} />
            )}
          </div>
        </div>
      )}

      <RatingUpdateToolbar
        hasLogs={hasLogs}
        isRunning={isRunning}
        onClearFile={clearFile}
        onClearHistory={() => setShowClearConfirm(true)}
        onRun={handleProcess}
        onStop={() => { abortRef.current = true; setIsRunning(false); setMotionGridStatus("Stopped", "stop"); }}
        selectedFileName={file?.name ?? null}
      />

      <AlertDialog open={showClearConfirm} onOpenChange={setShowClearConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your success and error history from local storage.
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

function LogTitle({ title, length, success }: { title: string; length: number; success: boolean }) {
  return (
    <div className="flex w-fit items-center gap-2 rounded-md border px-3 py-2">
      <p className={success ? "font-medium text-green-600" : "font-medium text-red-600"}>{title}</p>
      <span className={`text-xs rounded-sm px-1.5 py-0.5 ${success ? "bg-[#E8F5E9] text-[#388E3C] dark:bg-[#022C22] dark:text-[#1BC994]" : "bg-[#FFEBEE] text-[#D32F2F] dark:bg-[#4D0217] dark:text-[#FF6982]"}`}>
        {length}
      </span>
    </div>
  );
}

function LogPagination({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (p: number) => void }) {
  return (
    <div className="mt-2 flex items-center gap-2">
      <Button variant="outline" size="sm" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)}>Previous</Button>
      <span className="text-sm text-muted-foreground">Page {currentPage} of {totalPages}</span>
      <Button variant="outline" size="sm" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)}>Next</Button>
    </div>
  );
}
