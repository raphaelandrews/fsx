import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";

import type { RatingType } from "@fsx/api/rating-types";

import { useInvalidateAdmin } from "@/lib/admin-mutations";
import { getUserErrorMessage } from "@/lib/errors";
import { planImport, summarizePlan, type PlanRow } from "@/lib/rating-import";
import { readImportSheet } from "@/lib/rating-import-file";
import { describeError, reportMaintenance, type MaintenanceResult } from "@/lib/rating-import-feedback";
import type { ImportResult } from "@/lib/rating-import-report";
import { useTRPC } from "@/lib/trpc";

export type ImportPhase = "upload" | "review" | "importing" | "done";

const STORAGE_KEY = "rating-update-import-v2";
const STORED_RESULTS_LIMIT = 1_000;
const TYPE_LABELS: Record<RatingType, string> = { classic: "Classic", rapid: "Rapid", blitz: "Blitz" };
const signed = (value: number) => (value > 0 ? `+${value}` : String(value));

function readStored(): { fileName: string; results: ImportResult[] } | null {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    return saved && Array.isArray(saved.results) && saved.results.length > 0 ? saved : null;
  } catch {
    return null;
  }
}

function writeStored(value: { fileName: string; results: ImportResult[] } | null) {
  try {
    if (value) localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...value, results: value.results.slice(-STORED_RESULTS_LIMIT) }));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage blocked or full: the report only lives for this visit */
  }
}

/**
 * Drives a rating import in three steps: read and plan the file without writing
 * anything, apply the planned rows one at a time, then report. The plan stays in
 * memory so failed or unrun rows can be retried without redoing the rest.
 */
export function useRatingImport() {
  const trpc = useTRPC();
  const invalidateAdmin = useInvalidateAdmin();
  const link = useMutation(trpc.playersTournament.linkWithRating.mutationOptions());
  const createPlayer = useMutation(trpc.players.create.mutationOptions());
  const updatePlayer = useMutation(trpc.players.update.mutationOptions());
  const snapshot = useMutation(trpc.playersTournament.snapshotRankings.mutationOptions());

  const [phase, setPhase] = useState<ImportPhase>("upload");
  const [reading, setReading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [snapshotError, setSnapshotError] = useState<string | null>(null);
  const [fileName, setFileName] = useState("");
  const [plan, setPlan] = useState<PlanRow[]>([]);
  const [results, setResults] = useState<ImportResult[]>([]);
  const [progress, setProgress] = useState({ done: 0, total: 0, current: "" });
  const [maintenance, setMaintenance] = useState<MaintenanceResult | null>(null);
  const [restored, setRestored] = useState(false);

  const abortRef = useRef(false);
  const createdPlayers = useRef(new Map<number, number>());
  const ratedTypes = useRef(new Set<RatingType>());

  useEffect(() => {
    const stored = readStored();
    if (!stored) return;
    setFileName(stored.fileName);
    setResults(stored.results);
    setRestored(true);
    setPhase("done");
  }, []);

  useEffect(() => {
    if (phase !== "importing") return;
    const warn = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [phase]);

  const summary = useMemo(() => summarizePlan(plan), [plan]);
  // Rows the review already ruled out still belong in the report.
  const skipped = useMemo<ImportResult[]>(
    () =>
      plan
        .filter((entry) => entry.action === null)
        .map((entry) => ({
          sheetRow: entry.sheetRow,
          status: "skipped" as const,
          title: entry.row.name || (entry.row.id > 0 ? `Player ${entry.row.id}` : `Row ${entry.sheetRow}`),
          summary: entry.issue ?? "Skipped",
          input: entry.input,
        })),
    [plan],
  );
  const notRun = useMemo(
    () => plan.filter((entry) => entry.action !== null && !results.some((result) => result.sheetRow === entry.sheetRow)).length,
    [plan, results],
  );

  const loadFile = useCallback(async (file: File) => {
    setReading(true);
    setLoadError(null);
    try {
      const sheet = await readImportSheet(file);
      setPlan(planImport(sheet.rows, sheet.headerMap));
      setFileName(file.name);
      setResults([]);
      setMaintenance(null);
      setRestored(false);
      createdPlayers.current.clear();
      ratedTypes.current.clear();
      writeStored(null);
      setPhase("review");
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "This file could not be read.");
    } finally {
      setReading(false);
    }
  }, []);

  const applyRow = useCallback(
    async (entry: PlanRow): Promise<ImportResult> => {
      const { row, sheetRow, input } = entry;
      const base = { sheetRow, input, title: row.name || `Player ${row.id}` };
      const profile = { name: row.name, birthDate: row.birth || undefined, sex: row.sex, clubId: row.clubId, locationId: row.locationId };
      let playerId = row.id;
      let created = false;
      try {
        if (entry.action === "create" || entry.action === "create-and-rate") {
          const existing = createdPlayers.current.get(sheetRow);
          if (existing) {
            playerId = existing;
          } else {
            const [player] = await createPlayer.mutateAsync({
              name: row.name!,
              birthDate: row.birth || null,
              sex: row.sex ?? "male",
              clubId: row.clubId,
              locationId: row.locationId,
              blitz: 1900,
              rapid: 1900,
              classic: 1900,
              active: true,
              verified: false,
            });
            playerId = player!.id;
            created = true;
            createdPlayers.current.set(sheetRow, playerId);
          }
        }

        if (row.tournament) {
          const { tournamentId, variation, ratingType } = row.tournament;
          const [linked] = await link.mutateAsync({ playerId, tournamentId, variation, ratingType });
          ratedTypes.current.add(ratingType);
          const change = `${TYPE_LABELS[ratingType]} ${signed(variation)}${linked ? ` (${linked.oldRating} → ${linked.oldRating + variation})` : ""}`;
          let detail: string | undefined;
          if (entry.action === "rate" && (row.name || row.birth || row.sex || row.clubId || row.locationId)) {
            try {
              await updatePlayer.mutateAsync({ id: playerId, ...profile });
            } catch (error) {
              detail = `The rating was applied, but the profile data was not updated: ${describeError(error).message}`;
            }
          }
          createdPlayers.current.delete(sheetRow);
          return { ...base, status: "applied", summary: created || entry.action === "create-and-rate" ? `Created player ${playerId} · ${change}` : change, detail };
        }

        if (entry.action === "update") await updatePlayer.mutateAsync({ id: playerId, ...profile });
        createdPlayers.current.delete(sheetRow);
        return { ...base, status: "applied", summary: entry.action === "create" ? `Created player ${playerId}` : "Profile updated" };
      } catch (error) {
        const { message, detail } = describeError(error);
        const orphan = createdPlayers.current.get(sheetRow);
        return {
          ...base,
          status: "failed",
          summary: message,
          detail: orphan
            ? `${detail ? `${detail} · ` : ""}The player was created (ID ${orphan}) but the rating was not applied. Retrying will only apply the rating.`
            : detail,
        };
      }
    },
    [createPlayer, link, updatePlayer],
  );

  const run = useCallback(
    async (rows: PlanRow[]) => {
      abortRef.current = false;
      setPhase("importing");
      setMaintenance(null);
      setSnapshotError(null);
      setProgress({ done: 0, total: rows.length, current: "" });
      const finished: ImportResult[] = [];

      for (const [index, entry] of rows.entries()) {
        if (abortRef.current) break;
        setProgress({ done: index, total: rows.length, current: `Row ${entry.sheetRow}: ${entry.row.name || `player ${entry.row.id}`}` });
        const result = await applyRow(entry);
        finished.push(result);
        setResults((previous) => [...previous.filter((item) => item.sheetRow !== result.sheetRow), result]);
      }
      setProgress((current) => ({ ...current, done: finished.length, current: "" }));

      const applied = finished.filter((result) => result.status === "applied").length;
      if (applied > 0) {
        void invalidateAdmin(["players", "playersTournament"]);
      }
      if (ratedTypes.current.size > 0) {
        try {
          const maintenanceResult = await snapshot.mutateAsync({ ratingTypes: [...ratedTypes.current] });
          setMaintenance(maintenanceResult);
          reportMaintenance(maintenanceResult);
          if (maintenanceResult.deactivated > 0 || maintenanceResult.titlesRemoved > 0) void invalidateAdmin("players");
        } catch (error) {
          setSnapshotError(getUserErrorMessage(error, "Ratings were updated, but the ranking snapshot failed. Use “Update rankings now”.", "en"));
        }
        ratedTypes.current.clear();
      }
      setPhase("done");
    },
    [applyRow, invalidateAdmin, snapshot],
  );

  // Rows from the plan that still need to run: never started, or failed last time.
  const pending = useCallback(
    (all: ImportResult[]) =>
      plan.filter((entry) => entry.action !== null && !all.some((result) => result.sheetRow === entry.sheetRow && result.status === "applied")),
    [plan],
  );

  // Persist the report once a run is over, whatever way it ended.
  useEffect(() => {
    if (phase === "done" && !restored && results.length + skipped.length > 0) writeStored({ fileName, results: [...results, ...skipped] });
  }, [phase, restored, results, skipped, fileName]);

  const start = useCallback(() => run(plan.filter((entry) => entry.action !== null)), [plan, run]);
  const resume = useCallback(() => run(pending(results)), [pending, results, run]);
  const stop = useCallback(() => {
    abortRef.current = true;
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    setPhase("upload");
    setPlan([]);
    setResults([]);
    setFileName("");
    setLoadError(null);
    setSnapshotError(null);
    setMaintenance(null);
    setRestored(false);
    createdPlayers.current.clear();
    writeStored(null);
  }, []);

  return {
    phase,
    reading,
    loadError,
    fileName,
    plan,
    summary,
    results,
    skipped,
    progress,
    maintenance,
    snapshotError,
    restored,
    notRun,
    remaining: plan.length > 0 ? pending(results).length : 0,
    loadFile,
    start,
    resume,
    stop,
    reset,
  };
}
