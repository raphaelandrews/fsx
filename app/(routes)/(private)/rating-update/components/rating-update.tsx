"use client";

import React, { useCallback } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as XLSX from "xlsx";
import type z from "zod";

import type {
  RatingUpdateProps,
  PlayerAPIResponse,
  PlayerDataFields,
  PlayerTournamentDataFields,
} from "./rating-update-types";

import { formSchema } from "../utils/form-schema";
import { useRatingUpdateStatusStore } from "@/app/(routes)/(private)/rating-update/hooks/rating-update-status-store";
import { useNotificationStore } from "@/app/(routes)/(private)/rating-update/hooks/notification-store";
import { useRatingUpdateStore } from "@/app/(routes)/(private)/rating-update/hooks/rating-update-store";

import { RatingUpdateAlertDialog } from "./rating-update-alert-dialog";
import { RatingUpdateDeveloperTool } from "./rating-update-developer-tool";
import { RatingUpdateMonitor } from "./rating-update-monitor";
import { RatingUpdateNotificationList } from "./rating-update-notification-list";
import { RatingUpdateNotificationsDialog } from "./rating-update-notifications-dialog";
import { RatingUpdatePagination } from "./rating-update-pagination";
import { RatingUpdateStackTitle } from "./rating-update-stack-title";
import { RatingUpdateStackTrace } from "./rating-update-stack-trace";

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
    setErrorStackLength,
    setIsRunning,
    setSelectedFileName,
    setSuccessStackLength,
    setTotalUpdates,
  } = useRatingUpdateStore();
  const { setMotionGridStatus } = useRatingUpdateStatusStore();

  const addNotification = useNotificationStore(
    (state) => state.addNotification
  );

  const [successStack, setSuccessStack] = React.useState<RatingUpdateProps[]>(
    []
  );
  const [errorStack, setErrorStack] = React.useState<RatingUpdateProps[]>([]);
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
        const storedSuccess = localStorage.getItem("successStack");
        const storedError = localStorage.getItem("errorStack");

        if (storedSuccess) {
          const parsedSuccess = JSON.parse(storedSuccess);
          setSuccessStack(parsedSuccess);
          setSuccessStackLength(parsedSuccess.length);
        }
        if (storedError) {
          const parsedError = JSON.parse(storedError);
          setErrorStack(parsedError);
          setErrorStackLength(parsedError.length);
        }
      } catch (e) {
        console.error("Failed to load data from localStorage", e);
        localStorage.removeItem("successStack");
        localStorage.removeItem("errorStack");
        setSuccessStackLength(0);
        setErrorStackLength(0);
      } finally {
        setHasLoadedInitialData(true);
      }
    }
  }, [hasLoadedInitialData, setSuccessStackLength, setErrorStackLength]);

  React.useEffect(() => {
    localStorage.setItem("successStack", JSON.stringify(successStack));
    setSuccessStackLength(successStack.length);
  }, [successStack, setSuccessStackLength]);

  React.useEffect(() => {
    localStorage.setItem("errorStack", JSON.stringify(errorStack));
    setErrorStackLength(errorStack.length);
  }, [errorStack, setErrorStackLength]);

  const handleClearFileClick = useCallback(() => {
    form.resetField("file");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setMotionGridStatus("File removed", "x");
    setSelectedFileName(null);
    addNotification({
      title: "Info",
      subtitle: "File input cleared.",
      type: "info",
    });
  }, [form, setSelectedFileName, addNotification, setMotionGridStatus]);

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = useCallback(
    async (values) => {
      setIsRunning(true);
      setCurrentUpdate(null);
      setSuccessStack([]);
      setErrorStack([]);
      setCurrentIndex(0);
      setSuccessCurrentPage(1);
      setErrorCurrentPage(1);
      setSuccessStackLength(0);
      setErrorStackLength(0);
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
                addNotification({
                  title: "Error",
                  subtitle: "File contains no data rows or all rows are empty.",
                  type: "error",
                });
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
                addNotification({
                  title: "Error",
                  subtitle:
                    "File contains only the 'id' column. Additional data columns are required.",
                  type: "error",
                });
                setIsRunning(false);
                setMotionGridStatus("Error: Only 'id' column present", "busy");
                return;
              }

              if (hasPartialTournamentColumns && !hasTournamentColumns) {
                handleClearFileClick();
                addNotification({
                  title: "Error",
                  subtitle:
                    "If any tournament-related column is present, all three (tournamentId, variation, ratingType) must be included.",
                  type: "error",
                });
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
                addNotification({
                  title: "Error",
                  subtitle:
                    "File must contain either player data columns or complete tournament columns.",
                  type: "error",
                });
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
                addNotification({
                  title: "Error",
                  subtitle:
                    "If any tournament-related column (tournamentId, variation, ratingType) is present, all three must be included.",
                  type: "error",
                });
                setIsRunning(false);
                setMotionGridStatus(
                  "Error: Incomplete tournament columns",
                  "busy"
                );
                return;
              }

              if (headerMap.id === undefined) {
                handleClearFileClick();
                addNotification({
                  title: "Error",
                  subtitle:
                    "Mandatory column 'id' is missing in the Excel file.",
                  type: "error",
                });
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
                    addNotification({
                      title: "Error",
                      subtitle: `Row ${
                        i + 1
                      }: Tournament columns present but some values are empty or invalid.`,
                      type: "error",
                    });
                    setErrorStack((prev) => [
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
                  addNotification({
                    title: "Error",
                    subtitle: `Row ${
                      i + 1
                    }: Invalid rating type. Must be one of: blitz, rapid, classic.`,
                    type: "error",
                  });
                  setErrorStack((prev) => [
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
                  addNotification({
                    title: "Error",
                    subtitle: `Row ${
                      i + 1
                    }: Tournament ID must be a positive integer.`,
                    type: "error",
                  });
                  setErrorStack((prev) => [
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
                  addNotification({
                    title: "Error",
                    subtitle: `Row ${
                      i + 1
                    }: Variation must be an integer between -100 and 100.`,
                    type: "error",
                  });
                  setErrorStack((prev) => [
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
                  addNotification({
                    title: "Error",
                    subtitle: `Row ${
                      i + 1
                    }: Invalid or missing 'id' value. ID must be 0 or positive.`,
                    type: "error",
                  });
                  setErrorStack((prev) => [
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
                    addNotification({
                      title: "Error",
                      subtitle: `Row ${
                        i + 1
                      }: If any of 'tournamentId', 'variation', 'ratingType' are present, all three must be valid.`,
                      type: "error",
                    });
                    setErrorStack((prev) => [
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
                    addNotification({
                      title: "Error",
                      subtitle: `Row ${
                        i + 1
                      }: Missing or empty 'name' for new player.`,
                      type: "error",
                    });
                    setErrorStack((prev) => [
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
                        addNotification({
                          title: "Error",
                          subtitle: `Row ${
                            i + 1
                          }: Missing name for new player with tournament data.`,
                          type: "error",
                        });
                        setErrorStack((prev) => [
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
                        addNotification({
                          title: "Error",
                          subtitle: `Row ${
                            i + 1
                          }: Missing name for new player.`,
                          type: "error",
                        });
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
                      addNotification({
                        title: "Error",
                        subtitle: `Row ${i + 1}: Missing name for new player.`,
                        type: "error",
                      });
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
                setMotionGridStatus(
                  `${operationText}`,
                  "busy"
                );

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

                  setSuccessStack((prev) => [
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
                  const errorStack =
                    error instanceof Error
                      ? error.stack
                      : "No stack trace available.";
                  console.error("Error processing player:", error, id);
                  id === 0
                    ? addNotification({
                        title: "Error",
                        subtitle: `Row ${i + 1} failed to process row.`,
                        type: "error",
                      })
                    : addNotification({
                        title: "Error",
                        subtitle: `Failed to process player ID: ${id}.`,
                        type: "error",
                      });

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

                  setErrorStack((prev) => [
                    {
                      _uuid: crypto.randomUUID(),
                      operation:
                        id === 0
                          ? "Player Creation Failed"
                          : `Player with ID ${id} update failed`,
                      status: statusCode,
                      error: {
                        message: displayMessage,
                        stack: errorStack,
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
              addNotification({
                title: "Success",
                subtitle: "Database update process completed!",
                type: "success",
              });
              setMotionGridStatus(
                "Update process completed successfully",
                "saving"
              );
            } else {
              addNotification({
                title: "Info",
                subtitle: "Database update process stopped by user.",
                type: "info",
              });
              setMotionGridStatus("Process stopped by user", "stop");
            }

            setIsRunning(false);
          };

          fileReader.onerror = () => {
            setIsRunning(false);
            setMotionGridStatus("Error reading file", "busy");
            addNotification({
              title: "Error",
              subtitle: "Failed to read the Excel file.",
              type: "error",
            });
          };

          fileReader.readAsArrayBuffer(file);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          addNotification({
            title: "Error",
            subtitle: `Oops, there was an error processing the file: ${errorMessage}`,
            type: "error",
          });
          setIsRunning(false);
          setMotionGridStatus(`File processing error: ${errorMessage}`, "busy");
        }
      } else {
        addNotification({
          title: "Error",
          subtitle: "Please select a file to upload.",
          type: "error",
        });
        setIsRunning(false);
        setSelectedFileName(null);
        setMotionGridStatus("No file selected", "busy");
      }
    },
    [
      setIsRunning,
      setSelectedFileName,
      setSuccessStackLength,
      setErrorStackLength,
      handleClearFileClick,
      addNotification,
      setMotionGridStatus,
      setCurrentUpdate,
      setCurrentIndex,
      setTotalUpdates,
    ]
  );

  const performClearHistory = useCallback(() => {
    localStorage.removeItem("successStack");
    localStorage.removeItem("errorStack");
    form.reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setCurrentUpdate(null);
    setSuccessStack([]);
    setErrorStack([]);
    setCurrentIndex(0);
    setTotalUpdates(0);
    setIsRunning(false);
    setSuccessCurrentPage(1);
    setErrorCurrentPage(1);
    setSelectedFileName(null);
    setSuccessStackLength(0);
    setErrorStackLength(0);
    addNotification({
      title: "Info",
      subtitle: "Database update history cleared from local storage.",
      type: "info",
    });
    setShowClearHistoryConfirm(false);
    setMotionGridStatus("History cleared. Ready to start", "ready");
  }, [
    setSuccessStackLength,
    setErrorStackLength,
    form.reset,
    setIsRunning,
    setSelectedFileName,
    addNotification,
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

  const successTotalPages = Math.ceil(successStack.length / ITEMS_PER_PAGE);
  const errorTotalPages = Math.ceil(errorStack.length / ITEMS_PER_PAGE);

  const paginatedSuccessStack = React.useMemo(() => {
    const startIndex = (successCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return successStack.slice(startIndex, endIndex);
  }, [successStack, successCurrentPage]);

  const paginatedErrorStack = React.useMemo(() => {
    const startIndex = (errorCurrentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return errorStack.slice(startIndex, endIndex);
  }, [errorStack, errorCurrentPage]);

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
      <RatingUpdateNotificationList />
      <RatingUpdateNotificationsDialog />

      <RatingUpdateAlertDialog
        open={showClearHistoryConfirm}
        onOpenChange={setShowClearHistoryConfirm}
        onClick={performClearHistory}
      />

      <RatingUpdateMonitor />

      {!isRunning && successStack.length === 0 && errorStack.length === 0 && (
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

      {(successStack.length || errorStack.length) > 0 && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 flex gap-12 mt-4">
          <div className="flex flex-col items-center gap-4">
            <RatingUpdateStackTitle
              title="Success stack trace"
              length={successStack.length}
              stack={true}
            />

            <RatingUpdateStackTrace updates={paginatedSuccessStack} />

            {successStack.length > ITEMS_PER_PAGE && (
              <RatingUpdatePagination
                currentPage={successCurrentPage}
                totalPages={successTotalPages}
                nextPage={() => handleSuccessPageChange("next")}
                previousPage={() => handleSuccessPageChange("prev")}
              />
            )}
          </div>

          <div className="flex flex-col items-center gap-4">
            <RatingUpdateStackTitle
              title="Error stack trace"
              length={errorStack.length}
              stack={false}
            />

            <RatingUpdateStackTrace updates={paginatedErrorStack} />

            {errorStack.length > ITEMS_PER_PAGE && (
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
