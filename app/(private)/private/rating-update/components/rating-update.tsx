"use client";

import React, { useCallback } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import type z from "zod";

import type {
  RatingUpdateProps,
  PlayerAPIResponse,
  PlayerDataFields,
  PlayerTournamentDataFields,
} from "./rating-update-types";

import { formSchema } from "../utils/form-schema";
import { useRatingUpdateStatusStore } from "@/app/(private)/private/rating-update/hooks/rating-update-status-store";
import { useRatingUpdateStore } from "@/app/(private)/private/rating-update/hooks/rating-update-store";

import { RatingUpdateAlertDialog } from "./rating-update-alert-dialog";
import { RatingUpdateDeveloperTool } from "./rating-update-developer-tool";
import { RatingUpdateMonitor } from "./rating-update-monitor";
import { RatingUpdatePagination } from "./rating-update-pagination";
import { RatingUpdateLogTitle } from "./rating-update-log-title";
import { RatingUpdateLogs } from "./rating-update-logs";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

export function RatingUpdate() {
  const {
    isRunning,
    selectedFileName,
    stopProcess,
    setCurrentIndex,
    setCurrentUpdate,
    setErrorLogLength,
    setIsRunning,
    setSelectedFileName,
    setSuccessLogLength,
    setTotalUpdates,
  } = useRatingUpdateStore();
  const { setMotionGridStatus } = useRatingUpdateStatusStore();

  const [successLog, setSuccessLog] = React.useState<RatingUpdateProps[]>([]);
  const [errorLog, setErrorLog] = React.useState<RatingUpdateProps[]>([]);
  const [successCurrentPage, setSuccessCurrentPage] = React.useState(1);
  const [errorCurrentPage, setErrorCurrentPage] = React.useState(1);
  const [hasLoadedInitialData, setHasLoadedInitialData] = React.useState(false);
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] =
    React.useState(false);

  const ITEMS_PER_PAGE = 6;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      file: undefined,
    },
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const fileReaderRef = React.useRef<FileReader | null>(null);

  React.useEffect(() => {
    if (!hasLoadedInitialData) {
      try {
        const storedSuccess = localStorage.getItem("successLog");
        const storedError = localStorage.getItem("errorLog");

        if (storedSuccess) {
          const parsedSuccess = JSON.parse(storedSuccess);
          setSuccessLog(parsedSuccess);
          setSuccessLogLength(parsedSuccess.length);
        }
        if (storedError) {
          const parsedError = JSON.parse(storedError);
          setErrorLog(parsedError);
          setErrorLogLength(parsedError.length);
        }
      } catch (e) {
        console.error("Failed to load data from localStorage", e);
        localStorage.removeItem("successLog");
        localStorage.removeItem("errorLog");
        setSuccessLogLength(0);
        setErrorLogLength(0);
      } finally {
        setHasLoadedInitialData(true);
      }
    }
  }, [hasLoadedInitialData, setSuccessLogLength, setErrorLogLength]);

  React.useEffect(() => {
    localStorage.setItem("successLog", JSON.stringify(successLog));
    setSuccessLogLength(successLog.length);
  }, [successLog, setSuccessLogLength]);

  React.useEffect(() => {
    localStorage.setItem("errorLog", JSON.stringify(errorLog));
    setErrorLogLength(errorLog.length);
  }, [errorLog, setErrorLogLength]);

  const handleClearFileClick = useCallback(() => {
    form.resetField("file");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setMotionGridStatus("File removed", "x");
    setSelectedFileName(null);
    toast.info("File input cleared.");
  }, [form, setSelectedFileName, setMotionGridStatus]);

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = useCallback(
    async (values) => {
      setIsRunning(true);
      setCurrentUpdate(null);
      setSuccessLog([]);
      setErrorLog([]);
      setCurrentIndex(0);
      setSuccessCurrentPage(1);
      setErrorCurrentPage(1);
      setSuccessLogLength(0);
      setErrorLogLength(0);
      setMotionGridStatus("Initializing update process", "busy");

      const file = values.file;
      setSelectedFileName(file.name);

      if (file) {
        try {
          setMotionGridStatus("Reading Excel file", "busy");
          const fileReader = new FileReader();
          fileReaderRef.current = fileReader;
          fileReader.onload = async (e) => {
            if (!useRatingUpdateStore.getState().isRunning) {
              setMotionGridStatus("Process stopped by user", "busy");
              return;
            }

            if (e.target?.result) {
              const data = new Uint8Array(e.target.result as ArrayBuffer);
              setMotionGridStatus("Parsing Excel data", "busy");
              const workbook = XLSX.read(data, { type: "array" });
              const worksheet = workbook.Sheets[workbook.SheetNames[0]];
              const jsonData: unknown[][] = XLSX.utils.sheet_to_json(
                worksheet,
                {
                  header: 1,
                  raw: false,
                  dateNF: "yyyy-mm-dd",
                }
              );

              const nonEmptyRows = jsonData
                .slice(1)
                .filter((row) =>
                  row.some(
                    (cell) => cell !== null && cell !== undefined && cell !== ""
                  )
                );

              if (nonEmptyRows.length === 0) {
                handleClearFileClick();
                toast.error(
                  "File contains no data rows or all rows are empty."
                );
                setIsRunning(false);
                setMotionGridStatus("Error: No valid data rows found", "busy");
                return;
              }

              setTotalUpdates(nonEmptyRows.length);

              const headerRow = jsonData[0] as string[];
              const headerMap = headerRow.reduce(
                (
                  acc: { [key: string]: number },
                  header: string,
                  index: number
                ) => {
                  acc[header.toLowerCase().trim()] = index;
                  return acc;
                },
                {}
              );

              const availableColumns = Object.keys(headerMap);
              const hasPlayerDataColumns = [
                "name",
                "sex",
                "birth",
                "locationid",
                "clubid",
              ].some((col) => col in headerMap);
              const hasTournamentColumns = [
                "tournamentid",
                "variation",
                "ratingtype",
              ].every((col) => col in headerMap);
              const hasPartialTournamentColumns = [
                "tournamentid",
                "variation",
                "ratingtype",
              ].some((col) => col in headerMap);

              if (
                availableColumns.length === 1 &&
                availableColumns[0] === "id"
              ) {
                handleClearFileClick();
                toast.error(
                  "File contains only the 'id' column. Additional data columns are required."
                );
                setIsRunning(false);
                setMotionGridStatus("Error: Only 'id' column present", "busy");
                return;
              }

              if (hasPartialTournamentColumns && !hasTournamentColumns) {
                handleClearFileClick();
                toast.error(
                  "If any tournament-related column is present, all three (tournamentId, variation, ratingType) must be included."
                );
                setTotalUpdates(0);
                setIsRunning(false);
                setMotionGridStatus(
                  "Error: Incomplete tournament columns",
                  "busy"
                );
                return;
              }

              if (!hasPlayerDataColumns && !hasTournamentColumns) {
                handleClearFileClick();
                toast.error(
                  "File must contain either player data columns or complete tournament columns."
                );
                setIsRunning(false);
                setMotionGridStatus(
                  "Error: No valid data columns found",
                  "busy"
                );
                return;
              }

              const hasTournamentId = "tournamentid" in headerMap;
              const hasVariation = "variation" in headerMap;
              const hasRatingType = "ratingtype" in headerMap;
              const tournamentColumnsCount = [
                hasTournamentId,
                hasVariation,
                hasRatingType,
              ].filter(Boolean).length;

              if (tournamentColumnsCount > 0 && tournamentColumnsCount < 3) {
                handleClearFileClick();
                toast.error(
                  "If any tournament-related column (tournamentId, variation, ratingType) is present, all three must be included."
                );
                setIsRunning(false);
                setMotionGridStatus(
                  "Error: Incomplete tournament columns",
                  "busy"
                );
                return;
              }

              if (headerMap.id === undefined) {
                handleClearFileClick();
                toast.error(
                  "Mandatory column 'id' is missing in the Excel file."
                );
                setTotalUpdates(0);
                setIsRunning(false);
                setMotionGridStatus("Error: 'id' column missing", "busy");
                return;
              }

              setMotionGridStatus(
                `Processing ${jsonData.length - 1} records`,
                "busy"
              );

              for (let i = 1; i < jsonData.length; i++) {
                if (!useRatingUpdateStore.getState().isRunning) {
                  setMotionGridStatus("Process stopped by user", "busy");
                  break;
                }

                const row = jsonData[i] as (string | number | null)[];

                if (
                  row.every(
                    (cell) => cell === null || cell === undefined || cell === ""
                  )
                ) {
                  setMotionGridStatus(
                    `Row ${i + 1}: Skipping empty row`,
                    "busy"
                  );
                  setCurrentIndex((prev) => prev + 1);
                  continue;
                }

                const id =
                  headerMap.id !== undefined
                    ? Number.parseInt(String(row[headerMap.id]))
                    : null;

                const nameRaw =
                  headerMap.name !== undefined
                    ? row[headerMap.name]
                    : undefined;

                const name =
                  nameRaw !== undefined && nameRaw !== null
                    ? String(nameRaw).trim()
                    : undefined;

                const birth =
                  headerMap.birth !== undefined
                    ? String(row[headerMap.birth])
                    : undefined;

                const sexRaw =
                  headerMap.sex !== undefined ? row[headerMap.sex] : undefined;

                let sex: boolean | undefined;
                if (sexRaw !== undefined && sexRaw !== null) {
                  const sexString = String(sexRaw).trim().toLowerCase();
                  if (
                    sexString === "true" ||
                    sexString === "1" ||
                    sexString === "t"
                  ) {
                    sex = true;
                  } else if (
                    sexString === "false" ||
                    sexString === "0" ||
                    sexString === "f"
                  ) {
                    sex = false;
                  }
                }

                const clubId =
                  headerMap.clubid !== undefined
                    ? Number.parseInt(String(row[headerMap.clubid]))
                    : undefined;

                const locationId =
                  headerMap.locationid !== undefined
                    ? Number.parseInt(String(row[headerMap.locationid]))
                    : undefined;

                const tournamentIdRaw =
                  headerMap.tournamentid !== undefined
                    ? row[headerMap.tournamentid]
                    : undefined;

                const tournamentId =
                  tournamentIdRaw !== undefined && tournamentIdRaw !== null
                    ? Number.parseInt(String(tournamentIdRaw))
                    : undefined;

                const variationRaw =
                  headerMap.variation !== undefined
                    ? row[headerMap.variation]
                    : undefined;

                const variation =
                  variationRaw !== undefined && variationRaw !== null
                    ? Number.parseInt(String(variationRaw))
                    : undefined;

                const ratingTypeRaw =
                  headerMap.ratingtype !== undefined
                    ? row[headerMap.ratingtype]
                    : undefined;

                const ratingType =
                  ratingTypeRaw !== undefined && ratingTypeRaw !== null
                    ? String(ratingTypeRaw).trim()
                    : undefined;

                if (hasTournamentColumns) {
                  if (
                    tournamentId === undefined ||
                    tournamentId === null ||
                    variation === undefined ||
                    variation === null ||
                    !ratingType
                  ) {
                    toast.error(
                      `Row ${
                        i + 1
                      }: Tournament columns present but some values are empty or invalid.`
                    );
                    setErrorLog((prev) => [
                      {
                        _uuid: crypto.randomUUID(),
                        operation: "Player Tournament Update Failed",
                        status: 400,
                        error: {
                          message: `Row ${
                            i + 1
                          }: Empty or invalid tournament data. All fields required when columns tournamentId, variation and ratingType present.`,
                        },
                      },
                      ...prev,
                    ]);
                    setCurrentIndex((prev) => prev + 1);
                    setMotionGridStatus(
                      `Row ${i + 1}: Skipping due to empty tournament data`,
                      "busy"
                    );
                    continue;
                  }
                }

                if (
                  ratingType !== undefined &&
                  !["blitz", "rapid", "classic"].includes(ratingType)
                ) {
                  toast.error(
                    `Row ${
                      i + 1
                    }: Invalid rating type. Must be one of: blitz, rapid, classic.`
                  );
                  setErrorLog((prev) => [
                    {
                      _uuid: crypto.randomUUID(),
                      operation: "Player Tournament Update Failed",
                      status: 400,
                      error: {
                        message: `Row ${
                          i + 1
                        }: Invalid rating type '${ratingType}'.`,
                      },
                    },
                    ...prev,
                  ]);
                  setCurrentIndex((prev) => prev + 1);
                  setMotionGridStatus(
                    `Row ${i + 1}: Skipping due to invalid rating type`,
                    "busy"
                  );
                  continue;
                }

                if (
                  tournamentId !== undefined &&
                  (tournamentId <= 0 || !Number.isInteger(tournamentId))
                ) {
                  toast.error(
                    `Row ${i + 1}: Tournament ID must be a positive integer.`
                  );
                  setErrorLog((prev) => [
                    {
                      _uuid: crypto.randomUUID(),
                      operation: "Player Tournament Update Failed",
                      status: 400,
                      error: {
                        message: `Row ${
                          i + 1
                        }: Invalid tournament ID '${tournamentId}'.`,
                      },
                    },
                    ...prev,
                  ]);
                  setCurrentIndex((prev) => prev + 1);
                  setMotionGridStatus(
                    `Row ${i + 1}: Skipping due to invalid tournament ID`,
                    "busy"
                  );
                  continue;
                }

                if (
                  variation !== undefined &&
                  (variation < -100 ||
                    variation > 100 ||
                    !Number.isInteger(variation))
                ) {
                  toast.error(
                    `Row ${
                      i + 1
                    }: Variation must be an integer between -100 and 100.`
                  );
                  setErrorLog((prev) => [
                    {
                      _uuid: crypto.randomUUID(),
                      operation: "Player Tournament Update Failed",
                      status: 400,
                      error: {
                        message: `Row ${
                          i + 1
                        }: Invalid variation value '${variation}'.`,
                      },
                    },
                    ...prev,
                  ]);
                  setCurrentIndex((prev) => prev + 1);
                  setMotionGridStatus(
                    `Row ${i + 1}: Skipping due to invalid variation value`,
                    "busy"
                  );
                  continue;
                }

                if (id === null || Number.isNaN(id) || id < 0) {
                  toast.error(
                    `Row ${
                      i + 1
                    }: Invalid or missing 'id' value. ID must be 0 or positive.`
                  );
                  setErrorLog((prev) => [
                    {
                      _uuid: crypto.randomUUID(),
                      operation: "Player Creation Failed",
                      status: 400,
                      error: {
                        message: `Row ${
                          i + 1
                        }: Invalid or missing 'id'. ID must be 0 or positive.`,
                      },
                    },
                    ...prev,
                  ]);
                  setCurrentIndex((prev) => prev + 1);
                  setMotionGridStatus(
                    `Row ${i + 1}: Skipping due to invalid ID`,
                    "busy"
                  );
                  continue;
                }

                const hasAnyTournamentField =
                  tournamentId !== undefined ||
                  variation !== undefined ||
                  ratingType !== undefined;

                let isTournamentUpdate = false;

                if (hasAnyTournamentField) {
                  if (
                    tournamentId === undefined ||
                    Number.isNaN(tournamentId) ||
                    variation === undefined ||
                    Number.isNaN(variation) ||
                    ratingType === undefined ||
                    ratingType === ""
                  ) {
                    toast.error(
                      `Row ${
                        i + 1
                      }: If any of 'tournamentId', 'variation', 'ratingType' are present, all three must be valid.`
                    );
                    setErrorLog((prev) => [
                      {
                        _uuid: crypto.randomUUID(),
                        operation: "Player Tournament Update Failed",
                        status: 400,
                        error: {
                          message: `Row ${
                            i + 1
                          }: Missing or invalid tournament fields.`,
                        },
                      },
                      ...prev,
                    ]);
                    setCurrentIndex((prev) => prev + 1);
                    setMotionGridStatus(
                      `Row ${
                        i + 1
                      }: Skipping due to incomplete tournament data`,
                      "busy"
                    );
                    continue;
                  }
                  isTournamentUpdate = true;
                }

                if (id === 0 && !isTournamentUpdate) {
                  if (name === undefined || name === "") {
                    toast.error(
                      `Row ${i + 1}: Missing or empty 'name' for new player.`
                    );
                    setErrorLog((prev) => [
                      {
                        _uuid: crypto.randomUUID(),
                        operation: "Player Creation Failed",
                        status: 400,
                        error: {
                          message: `Row ${
                            i + 1
                          }: Missing or empty 'name' for new player.`,
                        },
                      },
                      ...prev,
                    ]);
                    setCurrentIndex((prev) => prev + 1);
                    setMotionGridStatus(
                      `Row ${
                        i + 1
                      }: Skipping due to missing name for new player`,
                      "busy"
                    );
                    continue;
                  }
                }

                let requestBody: {
                  name?: string;
                  birth?: string;
                  sex?: boolean;
                  clubId?: number;
                  locationId?: number;
                  tournamentId?: number;
                  variation?: number;
                  ratingType?: string;
                } = {
                  ...(name !== undefined && name !== "" && { name }),
                  ...(birth !== undefined && {
                    birth: birth.split("T")[0],
                  }),
                  ...(sex !== undefined && { sex }),
                  ...(clubId !== undefined && { clubId }),
                  ...(locationId !== undefined && { locationId }),
                };

                let operationText: string;
                let apiUrl: string;
                let httpMethod: "POST" | "PUT";

                const hasPlayerData =
                  name !== undefined ||
                  birth !== undefined ||
                  sex !== undefined ||
                  clubId !== undefined ||
                  locationId !== undefined;

                if (isTournamentUpdate) {
                  requestBody = {
                    ...requestBody,
                    tournamentId: tournamentId as number,
                    variation: variation as number,
                    ratingType: ratingType as string,
                  };

                  if (hasPlayerData) {
                    if (id === 0) {
                      if (!name) {
                        toast.error(
                          `Row ${
                            i + 1
                          }: Missing name for new player with tournament data.`
                        );
                        setErrorLog((prev) => [
                          {
                            _uuid: crypto.randomUUID(),
                            operation: "Player Creation Failed",
                            status: 400,
                            error: {
                              message: `Row ${
                                i + 1
                              }: Missing name for new player.`,
                            },
                          },
                          ...prev,
                        ]);
                        continue;
                      }
                      operationText = "Creating Player and Tournament Relation";
                      apiUrl = "/api/players-tournament";
                      httpMethod = "POST";
                    } else {
                      operationText = `Updating Player ID ${id} and Tournament Relation`;
                      apiUrl = `/api/players-tournament/${id}`;
                      httpMethod = "PUT";
                    }
                  } else {
                    if (id === 0) {
                      if (!name) {
                        toast.error(
                          `Row ${i + 1}: Missing name for new player.`
                        );
                        continue;
                      }
                      operationText = "Creating Player and Tournament Relation";
                      apiUrl = "/api/players-tournament";
                      httpMethod = "POST";
                    } else {
                      operationText = `Updating Tournament Relation for Player ID ${id}`;
                      apiUrl = `/api/players-tournament/${id}`;
                      httpMethod = "PUT";
                    }
                  }
                } else {
                  if (id === 0) {
                    if (!name) {
                      toast.error(`Row ${i + 1}: Missing name for new player.`);
                      continue;
                    }
                    operationText = "Creating Player";
                    apiUrl = "/api/players-data";
                    httpMethod = "POST";
                  } else {
                    operationText = `Updating Player with ID ${id}`;
                    apiUrl = `/api/players-data/${id}`;
                    httpMethod = "PUT";
                  }
                }

                setCurrentUpdate({
                  operation: operationText,
                });
                setMotionGridStatus(`${operationText}`, "busy");

                try {
                  await new Promise((resolve) =>
                    setTimeout(resolve, Math.random() * 500 + 100)
                  );

                  let res: Response;
                  let jsonRes: PlayerAPIResponse;
                  let rawBodyText: string | null = null;

                  res = await fetch(apiUrl, {
                    method: httpMethod,
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestBody),
                  });

                  try {
                    jsonRes = await res.json();
                  } catch {
                    rawBodyText = await res.text();
                    console.warn(
                      "Failed to parse response as JSON, reading as text:",
                      rawBodyText
                    );
                    throw new Error("Failed to parse API response as JSON.");
                  }

                  if (!res.ok) {
                    const errorDetail =
                      (jsonRes as { message?: string }).message ||
                      rawBodyText ||
                      `Server responded with status ${res.status} but no specific error message.`;
                    const customError = new Error(
                      `API Error: ${errorDetail}`
                    ) as Error & {
                      statusCode?: number;
                      backendMessage?: string;
                    };
                    customError.statusCode = res.status;
                    customError.backendMessage = errorDetail;
                    throw customError;
                  }

                  let successPayloadDataFields: PlayerDataFields;
                  let successMessage: string;
                  if (isTournamentUpdate) {
                    const data = jsonRes.dataFields as {
                      player: PlayerDataFields;
                      playerTournament: PlayerTournamentDataFields;
                    };
                    successPayloadDataFields = data.player;
                    successMessage = `Player ${data.player.name} (ID: ${data.player.id}) updated. Tournament relation ID: ${data.playerTournament.id}.`;
                  } else {
                    successPayloadDataFields =
                      jsonRes.dataFields as PlayerDataFields;
                    successMessage = jsonRes.message;
                  }

                  setSuccessLog((prev) => [
                    {
                      _uuid: crypto.randomUUID(),
                      operation:
                        id === 0
                          ? `${successPayloadDataFields.name} Created`
                          : `${successPayloadDataFields.name} - ID ${successPayloadDataFields.id} - Updated`,
                      status: res.status,
                      success: {
                        dataFields: jsonRes.dataFields,
                        message: successMessage,
                      },
                    },
                    ...prev,
                  ]);
                  setMotionGridStatus(
                    `Successfully processed ID ${id}`,
                    "busy"
                  );
                } catch (error: unknown) {
                  const errorMessage =
                    error instanceof Error ? error.message : "Unknown error";
                  const errorLog =
                    error instanceof Error ? error.stack : "No log available.";
                  console.error("Error processing player:", error, id);
                  id === 0
                    ? toast.error(`Row ${i + 1} failed to process row.`)
                    : toast.error(`Failed to process player ID: ${id}.`);

                  let statusCode = 500;
                  let displayMessage = errorMessage;

                  if (error instanceof Error) {
                    const customError = error as {
                      statusCode?: number;
                      backendMessage?: string;
                    };
                    if (typeof customError.statusCode === "number") {
                      statusCode = customError.statusCode;
                    }
                    if (typeof customError.backendMessage === "string") {
                      displayMessage = customError.backendMessage;
                    } else {
                      const httpErrorMatch = errorMessage.match(
                        /HTTP error! status: (\d+)/
                      );
                      if (httpErrorMatch?.[1]) {
                        statusCode = Number.parseInt(httpErrorMatch[1], 10);
                        displayMessage = `HTTP Error ${statusCode}: ${errorMessage}`;
                      }
                    }
                  }

                  displayMessage = `Row ${i + 1}: ${displayMessage}`;

                  setErrorLog((prev) => [
                    {
                      _uuid: crypto.randomUUID(),
                      operation:
                        id === 0
                          ? "Player Creation Failed"
                          : `Player with ID ${id} update failed`,
                      status: statusCode,
                      error: {
                        message: displayMessage,
                        stack: errorLog,
                      },
                    },
                    ...prev,
                  ]);
                  setMotionGridStatus(`Failed to process ID ${id}`, "busy");
                } finally {
                  setCurrentIndex((prev) => prev + 1);
                  setCurrentUpdate(null);
                }
              }
            }

            if (useRatingUpdateStore.getState().isRunning) {
              toast.success("Database update process completed!");
              setMotionGridStatus(
                "Update process completed successfully",
                "saving"
              );
            } else {
              toast.info("Database update process stopped by user.");
              setMotionGridStatus("Process stopped by user", "stop");
            }

            setIsRunning(false);
          };

          fileReader.onerror = () => {
            setIsRunning(false);
            toast.error("Failed to read the Excel file.");
            setMotionGridStatus("Error reading file", "busy");
          };

          fileReader.readAsArrayBuffer(file);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          toast.error(
            `Oops, there was an error processing the file: ${errorMessage}`
          );
          setIsRunning(false);
          setMotionGridStatus(`File processing error: ${errorMessage}`, "busy");
        }
      } else {
        toast.error("Please select a file to upload.");
        setIsRunning(false);
        setSelectedFileName(null);
        setMotionGridStatus("No file selected", "busy");
      }
    },
    [
      setIsRunning,
      setSelectedFileName,
      setSuccessLogLength,
      setErrorLogLength,
      handleClearFileClick,
      setMotionGridStatus,
      setCurrentUpdate,
      setCurrentIndex,
      setTotalUpdates,
    ]
  );

  const performClearHistory = useCallback(() => {
    localStorage.removeItem("successLog");
    localStorage.removeItem("errorLog");
    form.reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setCurrentUpdate(null);
    setSuccessLog([]);
    setErrorLog([]);
    setCurrentIndex(0);
    setTotalUpdates(0);
    setIsRunning(false);
    setSuccessCurrentPage(1);
    setErrorCurrentPage(1);
    setSelectedFileName(null);
    setSuccessLogLength(0);
    setErrorLogLength(0);
    setShowClearHistoryConfirm(false);
    toast.info("Database update history cleared from local storage.");
    setMotionGridStatus("History cleared. Ready to start", "ready");
  }, [
    setSuccessLogLength,
    setErrorLogLength,
    form.reset,
    setIsRunning,
    setSelectedFileName,
    setMotionGridStatus,
    setCurrentUpdate,
    setCurrentIndex,
    setTotalUpdates,
  ]);

  const clearHistory = useCallback(() => {
    setShowClearHistoryConfirm(true);
  }, []);

  const handleRunClick = useCallback(() => {
    form.handleSubmit(onSubmit)();
  }, [form, onSubmit]);

  React.useEffect(() => {
    const {
      setRunAction,
      setStopAction,
      setClearHistoryAction,
      setClearFileAction,
    } = useRatingUpdateStore.getState();
    setRunAction(handleRunClick);
    setStopAction(stopProcess);
    setClearHistoryAction(clearHistory);
    setClearFileAction(handleClearFileClick);
  }, [handleRunClick, clearHistory, handleClearFileClick, stopProcess]);

  const successTotalPages = Math.ceil(successLog.length / ITEMS_PER_PAGE);
  const errorTotalPages = Math.ceil(errorLog.length / ITEMS_PER_PAGE);

  const paginatedSuccessLog = React.useMemo(() => {
    const startIndex = (successCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return successLog.slice(startIndex, endIndex);
  }, [successLog, successCurrentPage]);

  const paginatedErrorLog = React.useMemo(() => {
    const startIndex = (errorCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return errorLog.slice(startIndex, endIndex);
  }, [errorLog, errorCurrentPage]);

  const handleSuccessPageChange = useCallback(
    (direction: "prev" | "next") => {
      if (direction === "prev" && successCurrentPage > 1) {
        setSuccessCurrentPage((prev) => prev - 1);
      } else if (
        direction === "next" &&
        successCurrentPage < successTotalPages
      ) {
        setSuccessCurrentPage((prev) => prev + 1);
      }
    },
    [successCurrentPage, successTotalPages]
  );

  const handleErrorPageChange = useCallback(
    (direction: "prev" | "next") => {
      if (direction === "prev" && errorCurrentPage > 1) {
        setErrorCurrentPage((prev) => prev - 1);
      } else if (direction === "next" && errorCurrentPage < errorTotalPages) {
        setErrorCurrentPage((prev) => prev + 1);
      }
    },
    [errorCurrentPage, errorTotalPages]
  );

  React.useEffect(() => {
    if (!isRunning && fileReaderRef.current) {
      fileReaderRef.current.abort();
      fileReaderRef.current = null;

      if (fileReaderRef.current) {
        setMotionGridStatus("Process stopped by user", "stop");
      }
    }
  }, [isRunning, setMotionGridStatus]);

  return (
    <>
      <RatingUpdateDeveloperTool />

      <RatingUpdateAlertDialog
        open={showClearHistoryConfirm}
        onOpenChange={setShowClearHistoryConfirm}
        onClick={performClearHistory}
      />

      <RatingUpdateMonitor />

      {!isRunning && successLog.length === 0 && errorLog.length === 0 && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="absolute top-1/3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 p-6 w-full max-w-lg bg-background dark:bg-[#0F0F0F] rounded-xl shadow-md"
          >
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Select Excel File</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Choose File
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {selectedFileName || "No file chosen"}
                      </span>
                      <Input
                        type="file"
                        className="sr-only"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          field.onChange(file);
                          setSelectedFileName(file ? file.name : null);
                          setMotionGridStatus("File updated", "add");
                        }}
                        accept=".xls,.xlsx"
                        ref={fileInputRef}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Upload an Excel file (.xlsx, .xls) containing player data.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </form>
        </Form>
      )}

      {(successLog.length || errorLog.length) > 0 && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 flex gap-12 mt-4">
          <div className="flex flex-col items-center gap-4">
            <RatingUpdateLogTitle
              title="Success log"
              length={successLog.length}
              log={true}
            />

            <RatingUpdateLogs updates={paginatedSuccessLog} />

            {successLog.length > ITEMS_PER_PAGE && (
              <RatingUpdatePagination
                currentPage={successCurrentPage}
                totalPages={successTotalPages}
                nextPage={() => handleSuccessPageChange("next")}
                previousPage={() => handleSuccessPageChange("prev")}
              />
            )}
          </div>

          <div className="flex flex-col items-center gap-4">
            <RatingUpdateLogTitle
              title="Error log"
              length={errorLog.length}
              log={false}
            />

            <RatingUpdateLogs updates={paginatedErrorLog} />

            {errorLog.length > ITEMS_PER_PAGE && (
              <RatingUpdatePagination
                currentPage={errorCurrentPage}
                totalPages={errorTotalPages}
                nextPage={() => handleErrorPageChange("next")}
                previousPage={() => handleErrorPageChange("prev")}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}
