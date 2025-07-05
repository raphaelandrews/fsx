"use client";

import React, { useCallback } from "react";
import { toast } from "sonner";

import type {
  RatingUpdateProps,
  PlayerDataFields,
  ExcelContent,
  SuccessDataFields, 
} from "./rating-update-types"; 

import { useRatingUpdateStatusStore } from "../hooks/rating-update-status-store";
import { useRatingUpdateStore } from "../hooks/rating-update-store";

import { RatingUpdateAlertDialog } from "./rating-update-alert-dialog";
import { RatingUpdateDeveloperTool } from "./rating-update-developer-tool";
import { RatingUpdateMonitor } from "./rating-update-monitor";
import { RatingUpdatePagination } from "./rating-update-pagination";
import { RatingUpdateLogTitle } from "./rating-update-log-title";
import { RatingUpdateLogs } from "./rating-update-logs";

import { Button } from "@/components/ui/button";
import { mockPlayers, mockFileNames, tournamentTypes } from "./mock-data";
import { MockDataViewerDialog } from "./mock-data-viewer-dialog";

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
    setErrorLogLength,
    setIsRunning,
    setSuccessLogLength,
    setTotalUpdates,
    setGeneratedFilesCount,
  } = useRatingUpdateStore();
  const { setMotionGridStatus } = useRatingUpdateStatusStore();

  const [successLog, setSuccessLog] = React.useState<RatingUpdateProps[]>(
    []
  );
  const [errorLog, setErrorLog] = React.useState<RatingUpdateProps[]>([]);
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

  const processMockData = useCallback(
    async (fileData: ExcelContent) => {
      setIsRunning(true);
      setGeneratedFilesCount(0);
      setMotionGridStatus("Processing mock data...", "busy");
      setSuccessLog([]);
      setErrorLog([]);
      setCurrentIndex(0);

      const dataRows = fileData.slice(1); 
      setTotalUpdates(dataRows.length);

      for (let i = 0; i < dataRows.length; i++) {
        if (!useRatingUpdateStore.getState().isRunning) {
          break; 
        }

        await new Promise((resolve) => setTimeout(resolve, 700));

        setCurrentIndex(i + 1);
        const row = dataRows[i];

        const id = row[0];
        const name = row[1];
        const birth = row[2];
        const sex = row[3];
        const clubId = row[4];
        const locationId = row[5];
        const tournamentId = row[6];
        const variation = row[7];
        const ratingType = row[8];

        let errorMessage: string | null = null;

        if (
          id === undefined ||
          id === null ||
          (typeof id !== "number" && typeof id !== "string") ||
          (typeof id === "number" && id < 0)
        ) {
          errorMessage = "Invalid Player ID.";
        }
        else if (
          sex !== undefined &&
          sex !== null &&
          typeof sex !== "boolean"
        ) {
          errorMessage =
            "Invalid Sex value. Must be boolean or undefined/null.";
        }
        else if (
          tournamentId !== undefined &&
          tournamentId !== null &&
          typeof tournamentId !== "number"
        ) {
          errorMessage =
            "Invalid Tournament ID. Must be a number or undefined/null.";
        }
        else if (
          variation !== undefined &&
          variation !== null &&
          typeof variation !== "number"
        ) {
          errorMessage =
            "Invalid Variation value. Must be a number or undefined/null.";
        }
        else if (
          ratingType !== undefined &&
          ratingType !== null &&
          (typeof ratingType !== "string" ||
            !tournamentTypes.includes(ratingType)) 
        ) {
          errorMessage = `Invalid Rating Type value. Must be one of ${tournamentTypes.join(
            ", "
          )} or undefined/null.`;
        }

        if (errorMessage) {
          const operation =
            id === 0 ? "Player Creation" : "Player Update/Tournament";
          setErrorLog((prev) => [
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
          let successMessage: string;
          let operationType: string;
          let dataFields: SuccessDataFields; 

          const basePlayerData: PlayerDataFields = {
            id:
              id === 0 ? Math.floor(Math.random() * 10000) + 1 : (id as number),
            name: name || `Player ${id}`,
            birth: birth || null,
            sex: typeof sex === "boolean" ? sex : null,
            clubId: typeof clubId === "number" ? clubId : null,
            locationId: typeof locationId === "number" ? locationId : null,
          };

          if (id === 0) {
            successMessage = "Player created successfully.";
            operationType = "Player Creation";
            dataFields = basePlayerData;
          } else if (
            tournamentId !== undefined &&
            tournamentId !== null &&
            typeof tournamentId === "number" &&
            variation !== undefined &&
            variation !== null &&
            typeof variation === "number"
          ) {
            successMessage = "Player and Tournament updated successfully.";
            operationType = "Player Update/Tournament";
            dataFields = {
              player: basePlayerData,
              playerTournament: {
                tournamentId: tournamentId,
                variation: variation,
                oldRating: Math.floor(Math.random() * 2000) + 1000,
              },
            };
          } else {
            successMessage = "Player updated successfully.";
            operationType = "Player Update";
            dataFields = basePlayerData;
          }

          setSuccessLog((prev) => [
            {
              _uuid: crypto.randomUUID(),
              operation: operationType, 
              status: id === 0 ? 201 : 200,
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
    [setIsRunning, setMotionGridStatus, setCurrentIndex, setTotalUpdates]
  );

  const performClearHistory = useCallback(() => {
    localStorage.removeItem("successLog");
    localStorage.removeItem("errorLog");
    setCurrentUpdate(null);
    setSuccessLog([]);
    setErrorLog([]);
    setCurrentIndex(0);
    setTotalUpdates(0);
    setIsRunning(false);
    setSuccessCurrentPage(1);
    setErrorCurrentPage(1);
    setSuccessLogLength(0);
    setErrorLogLength(0);
    setShowClearHistoryConfirm(false);
    setSelectedMockFileContent(null);
    setSelectedMockFileName(null);
    setGeneratedMockFiles([]);
    toast.info("Database update history cleared from local storage.");
    setMotionGridStatus("History cleared. Ready to start", "ready");
  }, [
    setSuccessLogLength,
    setErrorLogLength,
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
      const numRows = Math.floor(Math.random() * (mockPlayers.length / 2)) + 5;
      const randomData = getRandomSubset(mockPlayers, numRows); 
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

      {!isRunning && successLog.length === 0 && errorLog.length === 0 && (
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
              <div className="grid grid-cols-2 gap-4 w-full">
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
                variant="outline"
                onClick={generateRandomMockFiles}
              >
                Generate New Files
              </Button>
            </>
          )}
        </div>
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
