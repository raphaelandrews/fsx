"use client";

import React, { useCallback } from "react";
import { toast } from "sonner";

import type {
  RatingUpdateProps,
  PlayerDataFields,
} from "./rating-update-types";

import { useRatingUpdateStatusStore } from "../hooks/rating-update-status-store";
import { useRatingUpdateStore } from "../hooks/rating-update-store";

import { RatingUpdateAlertDialog } from "./rating-update-alert-dialog";
import { RatingUpdateDeveloperTool } from "./rating-update-developer-tool";
import { RatingUpdateMonitor } from "./rating-update-monitor";
import { RatingUpdatePagination } from "./rating-update-pagination";
import { RatingUpdateStackTitle } from "./rating-update-stack-title";
import { RatingUpdateStackTrace } from "./rating-update-stack-trace";

import { Button } from "@/components/ui/button";
import { mockData, mockFileNames } from "./mock-data";
import { MockDataViewerDialog } from "./mock-data-viewer-dialog";

type ExcelContent = [string[], ...(string | number | boolean)[][]];

const excelHeader = [
  "id",
  "name",
  "birth",
  "sex",
  "clubId",
  "locationId",
  "tournamentId",
  "variation",
  "ratingType",
];

export function RatingUpdate() {
  const {
    isRunning,
    setCurrentIndex,
    setCurrentUpdate,
    setErrorStackLength,
    setIsRunning,
    setSuccessStackLength,
    setTotalUpdates,
    setGeneratedFilesCount,
  } = useRatingUpdateStore();
  const { setMotionGridStatus } = useRatingUpdateStatusStore();

  const [successStack, setSuccessStack] = React.useState<RatingUpdateProps[]>(
    []
  );
  const [errorStack, setErrorStack] = React.useState<RatingUpdateProps[]>([]);
  const [successCurrentPage, setSuccessCurrentPage] = React.useState(1);
  const [errorCurrentPage, setErrorCurrentPage] = React.useState(1);
  const [hasLoadedInitialData, setHasLoadedInitialData] = React.useState(false);
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] =
    React.useState(false);

  const [generatedMockFiles, setGeneratedMockFiles] = React.useState<
    Array<{ name: string; displayName: string; data: ExcelContent }>
  >([]);
  const [selectedMockFileContent, setSelectedMockFileContent] =
    React.useState<ExcelContent | null>(null);
  const [selectedMockFileName, setSelectedMockFileName] = React.useState<
    string | null
  >(null);

  const [showMockDataViewer, setShowMockDataViewer] = React.useState(false);
  const [mockDataToView, setMockDataToView] =
    React.useState<ExcelContent | null>(null);
  const [mockDataFileName, setMockDataFileName] = React.useState<string | null>(
    null
  );

  const ITEMS_PER_PAGE = 6;

  React.useEffect(() => {
    setGeneratedFilesCount(generatedMockFiles.length);
  }, [generatedMockFiles, setGeneratedFilesCount]);

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

  const processMockData = useCallback(
    async (fileContent: ExcelContent) => {
      const DB_READ_DELAY_MS = 1000;

      setIsRunning(true);
      setCurrentUpdate(null);
      setSuccessStack([]);
      setErrorStack([]);
      setCurrentIndex(0);
      setSuccessCurrentPage(1);
      setErrorCurrentPage(1);
      setSuccessStackLength(0);
      setErrorStackLength(0);
      setMotionGridStatus("Initializing mock data process", "busy");
      setMotionGridStatus(`Processing ${selectedMockFileName}`, "busy");

      const headerRow = fileContent[0];
      const nonEmptyRows = fileContent.slice(1).filter((row) =>
        row.some((cell) => {
          if (cell === null || cell === undefined) {
            return false;
          }
          if (typeof cell === "string") {
            return cell.trim() !== "";
          }
          return true;
        })
      );

      if (nonEmptyRows.length === 0) {
        toast.error(
          "Selected mock file contains no data rows or all rows are empty."
        );
        setIsRunning(false);
        setMotionGridStatus(
          "Error: No valid data rows found in mock file",
          "busy"
        );
        return;
      }

      setTotalUpdates(nonEmptyRows.length);

      const headerMap = headerRow.reduce(
        (acc: { [key: string]: number }, header: string, index: number) => {
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

      if (availableColumns.length === 1 && availableColumns[0] === "id") {
        toast.error(
          "Mock file contains only the 'id' column. Additional data columns are required."
        );
        setIsRunning(false);
        setMotionGridStatus(
          "Error: Only 'id' column present in mock file",
          "busy"
        );
        return;
      }

      if (hasPartialTournamentColumns && !hasTournamentColumns) {
        toast.error(
          "If any tournament-related column is present, all three (tournamentId, variation, ratingType) must be included."
        );
        setTotalUpdates(0);
        setIsRunning(false);
        setMotionGridStatus(
          "Error: Incomplete tournament columns in mock file",
          "busy"
        );
        return;
      }

      if (!hasPlayerDataColumns && !hasTournamentColumns) {
        toast.error(
          "Mock file must contain either player data columns or complete tournament columns."
        );
        setIsRunning(false);
        setMotionGridStatus(
          "Error: Missing player or tournament data in mock file",
          "busy"
        );
        return;
      }

      for (let i = 0; i < nonEmptyRows.length; i++) {
        if (!useRatingUpdateStore.getState().isRunning) {
          break;
        }

        setCurrentIndex(useRatingUpdateStore.getState().currentIndex + 1);
        setMotionGridStatus(
          `Processing row ${i + 1} from ${selectedMockFileName}`,
          "busy"
        );

        await new Promise((resolve) => setTimeout(resolve, DB_READ_DELAY_MS));

        const row = nonEmptyRows[i];
        const id =
          headerMap.id !== undefined ? Number(row[headerMap.id]) : undefined;
        const name =
          headerMap.name !== undefined
            ? String(row[headerMap.name])
            : undefined;

        const rawBirthValue =
          headerMap.birth !== undefined ? row[headerMap.birth] : undefined;
        let birth: string | null = null;

        if (
          rawBirthValue !== undefined &&
          rawBirthValue !== null &&
          String(rawBirthValue).trim() !== ""
        ) {
          const birthString = String(rawBirthValue).trim();
          birth = birthString;
        }

        const sex =
          headerMap.sex !== undefined
            ? String(row[headerMap.sex]).toLowerCase() === "true"
            : undefined;
        const clubId =
          headerMap.clubid !== undefined
            ? Number(row[headerMap.clubid])
            : undefined;
        const locationId =
          headerMap.locationid !== undefined
            ? Number(row[headerMap.locationid])
            : undefined;
        const tournamentId =
          headerMap.tournamentid !== undefined
            ? Number(row[headerMap.tournamentid])
            : undefined;
        const variation =
          headerMap.variation !== undefined
            ? Number(row[headerMap.variation])
            : undefined;
        const ratingType =
          headerMap.ratingtype !== undefined
            ? String(row[headerMap.ratingtype]).toLowerCase()
            : undefined;

        let isError = false;
        let errorMessage = "";
        let operation = "";

        if (
          ratingType !== undefined &&
          !["blitz", "rapid", "classic"].includes(ratingType)
        ) {
          isError = true;
          errorMessage = `Row ${
            i + 1
          }: Invalid rating type. Must be one of: blitz, rapid, classic.`;
          operation = "Player Tournament Update Failed";
        } else if (
          tournamentId !== undefined &&
          (tournamentId <= 0 || !Number.isInteger(tournamentId))
        ) {
          isError = true;
          errorMessage = `Row ${
            i + 1
          }: Invalid tournament ID '${tournamentId}'.`;
          operation = "Player Tournament Update Failed";
        } else if (
          variation !== undefined &&
          (variation < -100 || variation > 100 || !Number.isInteger(variation))
        ) {
          isError = true;
          errorMessage = `Row ${
            i + 1
          }: Invalid variation value '${variation}'.`;
          operation = "Player Tournament Update Failed";
        } else if (id === undefined || Number.isNaN(id) || id < 0) {
          isError = true;
          errorMessage = `Row ${
            i + 1
          }: Invalid or missing 'id'. ID must be 0 or positive.`;
          operation = "Player Creation Failed";
        } else if (id === 0 && name === "") {
          isError = true;
          errorMessage = `Row ${
            i + 1
          }: Missing or empty 'name' for new player.`;
          operation = "Player Creation Failed";
        } else if (
          tournamentId !== undefined &&
          (variation === undefined ||
            ratingType === undefined ||
            ratingType === "")
        ) {
          isError = true;
          errorMessage = `Row ${i + 1}: Missing or invalid tournament fields.`;
          operation = "Player Tournament Update Failed";
        }

        if (isError) {
          setErrorStack((prev) => [
            {
              _uuid: crypto.randomUUID(),
              operation: operation,
              status: 400,
              error: { message: errorMessage },
            },
            ...prev,
          ]);
          if (useRatingUpdateStore.getState().isRunning) {
            toast.error(errorMessage);
          }
        } else {
          const successMessage =
            id === 0
              ? "Player created successfully."
              : "Player updated successfully.";
          const dataFields: PlayerDataFields = {
            id:
              id === 0 ? Math.floor(Math.random() * 10000) + 1 : (id as number),
            name: name || `Player ${id}`,
            birth: birth || null,
            sex: sex || null,
            clubId: clubId || null,
            locationId: locationId || null,
          };

          setSuccessStack((prev) => [
            {
              _uuid: crypto.randomUUID(),
              operation: id === 0 ? "Player Creation" : "Player Update",
              status: 200,
              success: {
                message: successMessage,
                dataFields: dataFields,
              },
            },
            ...prev,
          ]);
          if (useRatingUpdateStore.getState().isRunning) {
            toast.success(`Row ${i + 1}: ${successMessage}`);
          }
        }
      }

      if (useRatingUpdateStore.getState().isRunning) {
        setMotionGridStatus("Mock data processing complete", "ready");
        toast.success("Mock data processing finished!");
      }

      setIsRunning(false);
      setSelectedMockFileContent(null);
      setSelectedMockFileName(null);
      useRatingUpdateStore.getState().setSelectedFileName(null);
    },
    [
      setIsRunning,
      setSuccessStackLength,
      setErrorStackLength,
      setMotionGridStatus,
      setCurrentUpdate,
      setCurrentIndex,
      setTotalUpdates,
      selectedMockFileName,
    ]
  );

  const performClearHistory = useCallback(() => {
    localStorage.removeItem("successStack");
    localStorage.removeItem("errorStack");
    setCurrentUpdate(null);
    setSuccessStack([]);
    setErrorStack([]);
    setCurrentIndex(0);
    setTotalUpdates(0);
    setIsRunning(false);
    setSuccessCurrentPage(1);
    setErrorCurrentPage(1);
    setSuccessStackLength(0);
    setErrorStackLength(0);
    setShowClearHistoryConfirm(false);
    setSelectedMockFileContent(null);
    setSelectedMockFileName(null);
    setGeneratedMockFiles([]);
    toast.info("Database update history cleared from local storage.");
    setMotionGridStatus("History cleared. Ready to start", "ready");
  }, [
    setSuccessStackLength,
    setErrorStackLength,
    setIsRunning,
    setMotionGridStatus,
    setCurrentUpdate,
    setCurrentIndex,
    setTotalUpdates,
  ]);

  const clearHistory = useCallback(() => {
    setShowClearHistoryConfirm(true);
  }, []);

  const clearGeneratedFiles = useCallback(() => {
    setGeneratedMockFiles([]);
    setSelectedMockFileContent(null);
    setSelectedMockFileName(null);
    useRatingUpdateStore.getState().setSelectedFileName(null);
    toast.info("Generated mock files cleared.");
    setMotionGridStatus("Ready to generate new files", "ready");
  }, [setMotionGridStatus]);

  const getRandomSubset = useCallback((arr: any, count: number) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }, []);

  const generateRandomMockFiles = useCallback(() => {
    setSelectedMockFileContent(null);
    setSelectedMockFileName(null);
    const newGeneratedFiles = [];
    const timestamp = Date.now();

    const numberOfFilesToGenerate = 4;
    const selectedDisplayNames = getRandomSubset(
      mockFileNames,
      numberOfFilesToGenerate
    );

    for (let i = 0; i < numberOfFilesToGenerate; i++) {
      const numRows = Math.floor(Math.random() * (mockData.length / 2)) + 5;
      const randomData = getRandomSubset(mockData, numRows);
      const displayName = selectedDisplayNames[i];

      const uniqueInternalName = `${displayName.replace(
        ".xlsx",
        ""
      )}_${timestamp}_${i + 1}.xlsx`;

      newGeneratedFiles.push({
        name: uniqueInternalName,
        displayName: displayName,
        data: [excelHeader, ...randomData] as ExcelContent,
      });
    }
    setGeneratedMockFiles(newGeneratedFiles);
    toast.success("New random Excel files generated!");
    setMotionGridStatus("Select a generated file to process", "ready");
  }, [getRandomSubset, setMotionGridStatus]);

  const handleSelectMockFile = useCallback(
    (file: { name: string; displayName: string; data: ExcelContent }) => {
      if (selectedMockFileName === file.name) {
        setSelectedMockFileContent(null);
        setSelectedMockFileName(null);
        useRatingUpdateStore.getState().setSelectedFileName(null);
        toast.info(`Deselected mock file: ${file.displayName}`);
        setMotionGridStatus("Ready to select a file", "ready");
      } else {
        setSelectedMockFileContent(file.data);
        setSelectedMockFileName(file.name);
        useRatingUpdateStore.getState().setSelectedFileName(file.name);
        toast.info(`Selected mock file: ${file.displayName}`);
        setMotionGridStatus(`Ready to process ${file.displayName}`, "ready");
      }
    },
    [selectedMockFileName, setMotionGridStatus]
  );

  const handleRunClick = useCallback(() => {
    if (selectedMockFileContent) {
      processMockData(selectedMockFileContent);
    } else {
      toast.error("Please select a mock Excel file first.");
    }
  }, [processMockData, selectedMockFileContent]);

  const handleStopClick = useCallback(() => {
    setIsRunning(false);
    setMotionGridStatus("Process stopped by user", "stop");
    toast.info("Update process stopped.");
  }, [setIsRunning, setMotionGridStatus]);

  React.useEffect(() => {
    const {
      setRunAction,
      setStopAction,
      setClearHistoryAction,
      setClearFileAction,
    } = useRatingUpdateStore.getState();
    setRunAction(handleRunClick);
    setStopAction(handleStopClick);
    setClearHistoryAction(clearHistory);
    setClearFileAction(clearGeneratedFiles);
  }, [handleRunClick, clearHistory, handleStopClick, clearGeneratedFiles]);

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

  const handleViewMockData = useCallback(
    (file: { name: string; displayName: string; data: ExcelContent }) => {
      setMockDataToView(file.data);
      setMockDataFileName(file.name);
      setShowMockDataViewer(true);
    },
    []
  );

  return (
    <>
      <RatingUpdateDeveloperTool />

      <RatingUpdateAlertDialog
        open={showClearHistoryConfirm}
        onOpenChange={setShowClearHistoryConfirm}
        onClick={performClearHistory}
      />

      <RatingUpdateMonitor />

      {!isRunning && successStack.length === 0 && errorStack.length === 0 && (
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 p-6 w-full max-w-xl bg-background dark:bg-[#0F0F0F] rounded-xl shadow-md">
          <h2 className="text-xl font-bold">Simulate Rating Update</h2>
          <p className="text-muted-foreground text-center">
            {generatedMockFiles.length === 0
              ? "Generate random Excel files to simulate the rating update process."
              : "Select a generated Excel file to simulate the rating update process."}
          </p>

          {generatedMockFiles.length === 0 ? (
            <Button
              type="button"
              onClick={generateRandomMockFiles}
              className="w-full"
            >
              Generate Random Excel Files
            </Button>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2 w-full">
                {generatedMockFiles.map((file) => (
                  <div
                    key={file.name}
                    className="flex flex-col gap-2 w-full sm:w-auto flex-grow"
                  >
                    <Button
                      variant={
                        selectedMockFileName === file.name
                          ? "default"
                          : "outline"
                      }
                      onClick={() => handleSelectMockFile(file)}
                      className="flex-grow"
                    >
                      {file.displayName}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => handleViewMockData(file)}
                      className="flex-grow"
                    >
                      View Data
                    </Button>
                  </div>
                ))}
              </div>
              {selectedMockFileName && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected:{" "}
                  <span className="font-medium text-foreground">
                    {generatedMockFiles.find(
                      (f) => f.name === selectedMockFileName
                    )?.displayName || selectedMockFileName}
                  </span>
                </p>
              )}
              <Button
                type="button"
                variant="ghost"
                onClick={generateRandomMockFiles}
                className="w-full mt-2"
              >
                Generate New Files
              </Button>
            </>
          )}
        </div>
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

      <MockDataViewerDialog
        open={showMockDataViewer}
        onOpenChange={setShowMockDataViewer}
        data={mockDataToView}
        fileName={
          generatedMockFiles.find((f) => f.name === mockDataFileName)
            ?.displayName || mockDataFileName
        }
      />
    </>
  );
}
