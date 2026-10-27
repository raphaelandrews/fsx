import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { type RatingType, RATING_LABELS_EN } from "@fsx/api/rating-types";

import { useInvalidateAdmin } from "@/lib/admin-mutations";
import { getUserErrorMessage } from "@/lib/errors";
import { planImport, summarizePlan, type PlanRow } from "@/lib/rating-import";
import { readImportSheet, readWorkbook, toImportSheet } from "@/lib/rating-import-file";
import { columnsError } from "@/lib/rating-import";
import { parsePodium, parseTournamentMeta, PODIUM_SHEET, RESULTS_SHEET, TOURNAMENT_SHEET, withTournamentColumns, type PodiumDraft, type TournamentDraft } from "@/lib/tournament-import";
import { describeError, reportMaintenance, type MaintenanceResult } from "@/lib/rating-import-feedback";
import type { ImportResult } from "@/lib/rating-import-report";
import { useTRPC } from "@/lib/trpc";

export type ImportPhase = "upload" | "review" | "importing" | "done";

const STORAGE_KEY = "rating-update-import-v2";
const STORED_RESULTS_LIMIT = 1_000;
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

const RESUME_KEY = "rating-update-resume-v1";

type ResumeState = {
  fileName: string;
  draftName: string | null;
  tournamentId: number | null;
  podiumsDone: boolean;
  created: [number, number][];
  resultPlayers: [number, number][];
  results: ImportResult[];
};

function readResume(fileName: string, draftName: string | null): ResumeState | null {
  try {
    const saved = JSON.parse(localStorage.getItem(RESUME_KEY) ?? "null") as ResumeState | null;
    return saved && saved.fileName === fileName && saved.draftName === draftName ? saved : null;
  } catch {
    return null;
  }
}

function writeResume(value: ResumeState | null) {
  try {
    if (value) localStorage.setItem(RESUME_KEY, JSON.stringify({ ...value, results: value.results.slice(-STORED_RESULTS_LIMIT) }));
    else localStorage.removeItem(RESUME_KEY);
  } catch {
    /* storage blocked or full: a reload will start the file over */
  }
}

// Failed or unrun rows can be retried. The tournament, created players and finished rows are saved per file,
// so a reload resumes the same import.
export function useRatingImport() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const invalidateAdmin = useInvalidateAdmin();
  const link = useMutation(trpc.playersTournament.linkWithRating.mutationOptions());
  const createPlayer = useMutation(trpc.players.create.mutationOptions());
  const updatePlayer = useMutation(trpc.players.update.mutationOptions());
  const snapshot = useMutation(trpc.playersTournament.snapshotRankings.mutationOptions());
  const createTournament = useMutation(trpc.tournaments.create.mutationOptions());
  const createPodiums = useMutation(trpc.tournamentPodiums.createMany.mutationOptions());

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
  // A tournament file creates its tournament first and adds podiums last; the plan holds the results rows.
  const [draft, setDraft] = useState<TournamentDraft | null>(null);
  const [podium, setPodium] = useState<PodiumDraft[]>([]);

  const abortRef = useRef(false);
  const createdPlayers = useRef(new Map<number, number>());
  const ratedTypes = useRef(new Set<RatingType>());
  const tournamentId = useRef<number | null>(null);
  const podiumsDone = useRef(false);
  const resultPlayers = useRef(new Map<number, number>());
  // What a reload needs to continue the same file: the tournament and players already created, and the rows done.
  const resultsRef = useRef<ImportResult[]>([]);
  const fileNameRef = useRef("");
  const draftNameRef = useRef<string | null>(null);

  const persist = useCallback(() => {
    if (!fileNameRef.current) return;
    writeResume({
      fileName: fileNameRef.current,
      draftName: draftNameRef.current,
      tournamentId: tournamentId.current,
      podiumsDone: podiumsDone.current,
      created: [...createdPlayers.current],
      resultPlayers: [...resultPlayers.current],
      results: resultsRef.current,
    });
  }, []);

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
      const { sheets } = await readWorkbook(file);
      const meta = sheets.get(TOURNAMENT_SHEET);
      let planned: PlanRow[];
      let nextDraft: TournamentDraft | null = null;
      let nextPodium: PodiumDraft[] = [];
      if (meta) {
        const parsed = parseTournamentMeta(meta);
        if ("error" in parsed) throw new Error(parsed.error);
        nextDraft = parsed.draft;
        const results = sheets.get(RESULTS_SHEET);
        if (!results) throw new Error("A tournament file needs a 'Results' sheet next to the 'Tournament' sheet.");
        const resultSheet = withTournamentColumns(toImportSheet(results, { checkColumns: false }), nextDraft.ratingType);
        if (resultSheet.headerMap["variation"] === undefined) throw new Error("The Results sheet needs a 'variation' column.");
        const problem = columnsError(resultSheet.headerMap);
        if (problem) throw new Error(problem);
        planned = planImport(resultSheet.rows, resultSheet.headerMap);
        const categories = await queryClient.ensureQueryData(trpc.categories.list.queryOptions());
        nextPodium = parsePodium(sheets.get(PODIUM_SHEET) ?? [], categories.map((category) => category.name));
      } else {
        const sheet = await readImportSheet(file);
        planned = planImport(sheet.rows, sheet.headerMap);
      }
      setPlan(planned);
      setDraft(nextDraft);
      setPodium(nextPodium);
      setFileName(file.name);
      setMaintenance(null);
      setRestored(false);
      createdPlayers.current.clear();
      ratedTypes.current.clear();
      resultPlayers.current.clear();
      fileNameRef.current = file.name;
      draftNameRef.current = nextDraft?.name ?? null;
      // The same file after a closed tab or a reload continues where it stopped instead of creating everything twice.
      const saved = readResume(file.name, draftNameRef.current);
      tournamentId.current = saved?.tournamentId ?? null;
      podiumsDone.current = saved?.podiumsDone ?? false;
      for (const [sheetRow, id] of saved?.created ?? []) createdPlayers.current.set(sheetRow, id);
      for (const [sheetRow, id] of saved?.resultPlayers ?? []) resultPlayers.current.set(sheetRow, id);
      resultsRef.current = saved?.results ?? [];
      setResults(resultsRef.current);
      if (!saved) writeResume(null);
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
      const profile = { name: row.name, birthYear: row.birthYear, sex: row.sex, clubId: row.clubId, locationId: row.locationId };
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
              birthYear: row.birthYear ?? null,
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
          const change = `${RATING_LABELS_EN[ratingType]} ${signed(variation)}${linked ? ` (${linked.oldRating} → ${linked.oldRating + variation})` : ""}`;
          let detail: string | undefined;
          if (entry.action === "rate" && (row.name || row.birthYear || row.sex || row.clubId || row.locationId)) {
            try {
              await updatePlayer.mutateAsync({ id: playerId, ...profile });
            } catch (error) {
              detail = `The rating was applied, but the profile data was not updated: ${describeError(error).message}`;
            }
          }
          createdPlayers.current.delete(sheetRow);
          resultPlayers.current.set(sheetRow, playerId);
          return { ...base, status: "applied", summary: created || entry.action === "create-and-rate" ? `Created player ${playerId} · ${change}` : change, detail };
        }

        if (entry.action === "update") await updatePlayer.mutateAsync({ id: playerId, ...profile });
        createdPlayers.current.delete(sheetRow);
        resultPlayers.current.set(sheetRow, playerId);
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
      const record = (result: ImportResult) => {
        finished.push(result);
        resultsRef.current = [...resultsRef.current.filter((item) => item.sheetRow !== result.sheetRow), result];
        setResults(resultsRef.current);
        persist();
      };

      if (draft && tournamentId.current === null) {
        setProgress({ done: 0, total: rows.length, current: `Creating the tournament “${draft.name}”` });
        try {
          const [created] = await createTournament.mutateAsync({
            name: draft.name,
            date: draft.date,
            ratingType: draft.ratingType,
            tier: draft.tier,
            championshipId: draft.championshipId,
            chessResults: draft.chessResults,
          });
          tournamentId.current = created!.id;
          record({ sheetRow: 0, where: "Tournament", status: "applied", title: draft.name, summary: `Tournament created (ID ${created!.id})` });
        } catch (error) {
          const { message, detail } = describeError(error);
          record({ sheetRow: 0, where: "Tournament", status: "failed", title: draft.name, summary: message, detail: `${detail ? `${detail} · ` : ""}No result or podium was applied.` });
          setPhase("done");
          return;
        }
      }

      for (const [index, planned] of rows.entries()) {
        if (abortRef.current) break;
        const entry =
          tournamentId.current !== null && planned.row.tournament
            ? { ...planned, row: { ...planned.row, tournament: { ...planned.row.tournament, tournamentId: tournamentId.current } } }
            : planned;
        setProgress({ done: index, total: rows.length, current: `Row ${entry.sheetRow}: ${entry.row.name || `player ${entry.row.id}`}` });
        record(await applyRow(entry));
      }
      setProgress((current) => ({ ...current, done: finished.length, current: "" }));

      if (draft && tournamentId.current !== null && !podiumsDone.current && !abortRef.current) {
        podiumsDone.current = true;
        const valid = podium.filter((item) => !item.error);
        for (const item of podium.filter((entry) => entry.error)) {
          record({ sheetRow: 10_000 + item.sheetRow, where: `Podium row ${item.sheetRow}`, status: "skipped", title: `Place ${item.place}`, summary: item.error! });
        }
        const resolved = valid.map((item) => ({ item, playerId: item.playerId ?? resultPlayers.current.get(item.resultRow!) }));
        for (const { item, playerId } of resolved) {
          if (playerId === undefined) {
            record({ sheetRow: 10_000 + item.sheetRow, where: `Podium row ${item.sheetRow}`, status: "failed", title: `Place ${item.place}`, summary: `The player of Results row ${item.resultRow} was not imported.` });
          }
        }
        const ready = resolved.filter((entry): entry is { item: PodiumDraft; playerId: number } => entry.playerId !== undefined);
        for (let start = 0; start < ready.length; start += 50) {
          const chunk = ready.slice(start, start + 50);
          try {
            await createPodiums.mutateAsync({
              tournamentId: tournamentId.current,
              podiums: chunk.map(({ item, playerId }) => ({ playerId, place: item.place, category: item.category })),
            });
            for (const { item, playerId } of chunk) {
              record({ sheetRow: 10_000 + item.sheetRow, where: `Podium row ${item.sheetRow}`, status: "applied", title: `Player ${playerId}`, summary: `${item.place}º place${item.category ? ` · ${item.category}` : ""}` });
            }
          } catch (error) {
            const { message, detail } = describeError(error);
            for (const { item } of chunk) {
              record({ sheetRow: 10_000 + item.sheetRow, where: `Podium row ${item.sheetRow}`, status: "failed", title: `Place ${item.place}`, summary: message, detail: `${detail ? `${detail} · ` : ""}Add this podium on the Podiums page.` });
            }
          }
        }
        void invalidateAdmin(["tournaments", "tournamentPodiums"]);
      } else if (draft && tournamentId.current !== null) {
        void invalidateAdmin("tournaments");
      }

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
      persist();
      setPhase("done");
    },
    [applyRow, createPodiums, createTournament, draft, invalidateAdmin, persist, podium, snapshot],
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

  const start = useCallback(() => run(pending(resultsRef.current)), [pending, run]);
  const resume = useCallback(() => run(pending(results)), [pending, results, run]);
  const stop = useCallback(() => {
    abortRef.current = true;
  }, []);

  const reset = useCallback(() => {
    abortRef.current = true;
    setPhase("upload");
    setPlan([]);
    resultsRef.current = [];
    fileNameRef.current = "";
    writeResume(null);
    setResults([]);
    setFileName("");
    setLoadError(null);
    setSnapshotError(null);
    setMaintenance(null);
    setRestored(false);
    createdPlayers.current.clear();
    resultPlayers.current.clear();
    tournamentId.current = null;
    podiumsDone.current = false;
    setDraft(null);
    setPodium([]);
    writeStored(null);
  }, []);

  return {
    phase,
    reading,
    loadError,
    fileName,
    plan,
    draft,
    podium,
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
