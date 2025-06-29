"use client";

import React, { useCallback } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import * as XLSX from "xlsx";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  CheckCircleIcon,
  DatabaseZapIcon,
  LoaderCircleIcon,
  AlertCircleIcon,
  CircleCheckIcon,
} from "lucide-react";
import z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { type DatabaseUpdateProps, mockResponses } from "./data";
import { MotionGridShowcase } from "./motion-grid-showcase";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Announcement,
  AnnouncementTag,
  AnnouncementTitle,
} from "@/components/ui/announcement";
import { Badge } from "@/components/ui/badge";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DeveloperTool } from "./developer-tool";
import { useDatabaseUpdateStore } from "@/lib/stores/database-update-store";

const createFormSchema = () => {
  const fileSchema = z
    .instanceof(File, { message: "Please select a file." })
    .refine(
      (file) => {
        if (!file) return false;
        const allowedExtensions = [".xlsx", ".xls"];
        const fileExtension = file.name
          .substring(file.name.lastIndexOf("."))
          .toLowerCase();
        return allowedExtensions.includes(fileExtension);
      },
      {
        message: "Only Excel files (.xlsx, .xls) are allowed.",
      }
    );

  return z.object({
    file: fileSchema,
  });
};

const formSchema = createFormSchema();

export default function DatabaseUpdate() {
  const { isRunning, setIsRunning } = useDatabaseUpdateStore();

  const [currentUpdate, setCurrentUpdate] =
    React.useState<DatabaseUpdateProps | null>(null);
  const [successStack, setSuccessStack] = React.useState<DatabaseUpdateProps[]>(
    []
  );
  const [errorStack, setErrorStack] = React.useState<DatabaseUpdateProps[]>([]);
  const [successCount, setSuccessCount] = React.useState(0);
  const [errorCount, setErrorCount] = React.useState(0);
  const [currentIndex, setCurrentIndex] = React.useState(0);
  const [totalUpdates, setTotalUpdates] = React.useState(0);

  const [successCurrentPage, setSuccessCurrentPage] = React.useState(1);
  const [errorCurrentPage, setErrorCurrentPage] = React.useState(1);

  const [hasLoadedInitialData, setHasLoadedInitialData] = React.useState(false);
  const [selectedFileName, setSelectedFileName] = React.useState<string | null>(
    null
  ); 

  const ITEMS_PER_PAGE = 3;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      file: undefined,
    },
  });

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (!hasLoadedInitialData) {
      try {
        const storedSuccess = localStorage.getItem("successStack");
        const storedError = localStorage.getItem("errorStack");

        if (storedSuccess) {
          const parsedSuccess = JSON.parse(storedSuccess);
          setSuccessStack(parsedSuccess);
          setSuccessCount(parsedSuccess.length);
        }
        if (storedError) {
          const parsedError = JSON.parse(storedError);
          setErrorStack(parsedError);
          setErrorCount(parsedError.length);
        }
      } catch (e) {
        console.error("Failed to load data from localStorage", e);
        localStorage.removeItem("successStack");
        localStorage.removeItem("errorStack");
      } finally {
        setHasLoadedInitialData(true);
      }
    }
  }, [hasLoadedInitialData]);

  React.useEffect(() => {
    localStorage.setItem("successStack", JSON.stringify(successStack));
  }, [successStack]);

  React.useEffect(() => {
    localStorage.setItem("errorStack", JSON.stringify(errorStack));
  }, [errorStack]);

  const onSubmit: SubmitHandler<z.infer<typeof formSchema>> = useCallback(
    async (values) => {
      setIsRunning(true);
      setCurrentUpdate(null);
      setSuccessStack([]);
      setErrorStack([]);
      setSuccessCount(0);
      setErrorCount(0);
      setCurrentIndex(0);
      setSuccessCurrentPage(1);
      setErrorCurrentPage(1);

      const file = values.file;

      if (file) {
        try {
          const fileReader = new FileReader();
          fileReader.onload = async (e) => {
            if (e.target?.result) {
              const data = new Uint8Array(e.target.result as ArrayBuffer);
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

              setTotalUpdates(jsonData.length > 1 ? jsonData.length - 1 : 0);

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

              if (headerMap.id === undefined) {
                toast.error(
                  "Mandatory column 'id' is missing in the Excel file."
                );
                setIsRunning(false);
                return;
              }

              for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i] as (string | number | null)[];

                const id =
                  headerMap.id !== undefined
                    ? Number.parseInt(String(row[headerMap.id]))
                    : null;

                const name =
                  headerMap.name !== undefined
                    ? String(row[headerMap.name])
                    : undefined;

                const birth =
                  headerMap.birth !== undefined
                    ? String(row[headerMap.birth])
                    : undefined;

                const sex =
                  headerMap.sex !== undefined
                    ? String(row[headerMap.sex])
                    : undefined;

                const clubId =
                  headerMap.clubid !== undefined
                    ? Number.parseInt(String(row[headerMap.clubid]))
                    : undefined;

                const locationId =
                  headerMap.locationid !== undefined
                    ? Number.parseInt(String(row[headerMap.locationid]))
                    : undefined;

                if (id === null || Number.isNaN(id)) {
                  toast.error(`Row ${i + 1}: Invalid or missing 'id' value.`);
                  setErrorStack((prev) => [
                    {
                      id: i,
                      operation: "Data processing error",
                      description: `Row ${i + 1}: Invalid or missing 'id'.`,
                      table: "N/A",
                      status: 400,
                      error: {
                        message: `Invalid 'id' at row ${i + 1}.`,
                        stack: "Missing ID for update/creation.",
                      },
                    },
                    ...prev,
                  ]);
                  setErrorCount((prev) => prev + 1);
                  setCurrentIndex((prev) => prev + 1);
                  continue;
                }

                const playerData = {
                  ...(name !== undefined && { name }),
                  ...(birth !== undefined && {
                    birth: birth.split("T")[0],
                  }),
                  ...(sex !== undefined && { sex }),
                  ...(clubId !== undefined && { clubId }),
                  ...(locationId !== undefined && { locationId }),
                };

                setCurrentUpdate({
                  id: id,
                  operation: id === 0 ? "Creating Player" : "Updating Player",
                  description: `Processing player ID: ${id}`,
                  table: "Players",
                  updateStatus: "pending",
                });

                try {
                  await new Promise((resolve) =>
                    setTimeout(resolve, Math.random() * 500 + 100)
                  );

                  let res: Response;
                  let jsonRes: { message?: string } = {};
                  let rawBodyText: string | null = null;

                  if (id === 0) {
                    res = await fetch("/api/players-data", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(playerData),
                    });
                  } else {
                    res = await fetch(`/api/players-data/${id}`, {
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify(playerData),
                    });
                  }

                  try {
                    jsonRes = await res.json();
                  } catch {
                    rawBodyText = await res.text();
                    console.warn(
                      "Failed to parse response as JSON, reading as text:",
                      rawBodyText
                    );
                  }

                  console.log(
                    id === 0
                      ? "Jogador criado: "
                      : `Jogador ${id} atualizado: `,
                    jsonRes || rawBodyText
                  );

                  if (!res.ok) {
                    const errorDetail =
                      jsonRes.message ||
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

                  setSuccessStack((prev) => [
                    {
                      id: id,
                      operation: id === 0 ? "Player Created" : "Player Updated",
                      description: `Player ID ${id} processed successfully.`,
                      message: jsonRes.message,
                      table: "Players",
                      status: res.status,
                      success:
                        mockResponses.success[
                          Math.floor(
                            Math.random() * mockResponses.success.length
                          )
                        ],
                    },
                    ...prev,
                  ]);
                  setSuccessCount((prev) => prev + 1);
                } catch (error: unknown) {
                  const errorMessage =
                    error instanceof Error ? error.message : "Unknown error";
                  const errorStack =
                    error instanceof Error
                      ? error.stack
                      : "No stack trace available.";
                  console.error("Error processing player:", error, id);
                  toast.error(`Failed to process player ID: ${id}.`);

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

                  setErrorStack((prev) => [
                    {
                      id: id,
                      operation:
                        id === 0
                          ? "Player Creation Failed"
                          : "Player Update Failed",
                      description: `Error processing player ID: ${id}.`,
                      table: "Players",
                      status: statusCode,
                      error: {
                        message: displayMessage,
                        stack: errorStack,
                      },
                    },
                    ...prev,
                  ]);
                  setErrorCount((prev) => prev + 1);
                } finally {
                  setCurrentIndex((prev) => prev + 1);
                  setCurrentUpdate(null);
                }
              }
            }
            toast.success("Database update process completed!");
            setIsRunning(false);
          };
          fileReader.readAsArrayBuffer(file);
        } catch (error: unknown) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          toast.error(
            `Oops, there was an error processing the file: ${errorMessage}`
          );
          setIsRunning(false);
        }
      } else {
        toast.error("Please select a file to upload.");
        setIsRunning(false);
      }
    },
    [setIsRunning]
  );

  const reset = useCallback(() => {
    form.reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setCurrentUpdate(null);
    setSuccessStack([]);
    setErrorStack([]);
    setSuccessCount(0);
    setErrorCount(0);
    setCurrentIndex(0);
    setTotalUpdates(0);
    setIsRunning(false);
    setSuccessCurrentPage(1);
    setErrorCurrentPage(1);
    setSelectedFileName(null); 
  }, [form, setIsRunning]);

  const clearHistory = useCallback(() => {
    localStorage.removeItem("successStack");
    localStorage.removeItem("errorStack");
    setSuccessStack([]);
    setErrorStack([]);
    setSuccessCount(0);
    setErrorCount(0);
    setSuccessCurrentPage(1);
    setErrorCurrentPage(1);
    toast.info("Database update history cleared from local storage.");
  }, []);

  const handleRunClick = useCallback(() => {
    form.handleSubmit(onSubmit)();
  }, [form, onSubmit]);

  const handleClearFileClick = useCallback(() => {
    form.resetField("file");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setSelectedFileName(null); 
    toast.info("File input cleared.");
  }, [form]);

  React.useEffect(() => {
    const {
      setRunAction,
      setResetAction,
      setClearHistoryAction,
      setClearFileAction,
    } = useDatabaseUpdateStore.getState();
    setRunAction(handleRunClick);
    setResetAction(reset);
    setClearHistoryAction(clearHistory);
    setClearFileAction(handleClearFileClick);
  }, [handleRunClick, reset, clearHistory, handleClearFileClick]);

  const handleSuccessPageChange = (direction: "next" | "prev") => {
    setSuccessCurrentPage((prev) => {
      const totalPages = Math.ceil(successStack.length / ITEMS_PER_PAGE);
      if (direction === "next") {
        return Math.min(prev + 1, totalPages);
      }
      return Math.max(prev - 1, 1);
    });
  };

  const handleErrorPageChange = (direction: "next" | "prev") => {
    setErrorCurrentPage((prev) => {
      const totalPages = Math.ceil(errorStack.length / ITEMS_PER_PAGE);
      if (direction === "next") {
        return Math.min(prev + 1, totalPages);
      }
      return Math.max(prev - 1, 1);
    });
  };

  const successStartIndex = (successCurrentPage - 1) * ITEMS_PER_PAGE;
  const successEndIndex = successStartIndex + ITEMS_PER_PAGE;
  const paginatedSuccessStack = successStack.slice(
    successStartIndex,
    successEndIndex
  );
  const successTotalPages = Math.ceil(successStack.length / ITEMS_PER_PAGE);
  const errorStartIndex = (errorCurrentPage - 1) * ITEMS_PER_PAGE;
  const errorEndIndex = errorStartIndex + ITEMS_PER_PAGE;
  const paginatedErrorStack = errorStack.slice(errorStartIndex, errorEndIndex);
  const errorTotalPages = Math.ceil(errorStack.length / ITEMS_PER_PAGE);

  return (
    <>
      <DeveloperTool />

      {totalUpdates === 0 &&
        !isRunning &&
        successStack.length === 0 &&
        errorStack.length === 0 && (
          <Alert className="absolute top-4 left-4 flex flex-col items-center justify-center gap-3 w-fit text-center">
            <DatabaseZapIcon className="h-8 w-8 text-blue-500" />
            <AlertTitle>Ready to begin database operations</AlertTitle>
            <AlertDescription>
              Select an Excel file and click "Start Database Update" to begin.
            </AlertDescription>
          </Alert>
        )}

      <div className="absolute top-4 right-4 flex flex-col items-end gap-4">
        <div className="flex flex-col items-end gap-4">
          <Announcement>
            <AnnouncementTag className="flex items-center gap-2">
              <span>Success</span>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-green-600" />
              </span>
            </AnnouncementTag>
            <AnnouncementTitle>{successCount}</AnnouncementTitle>
          </Announcement>
          <Announcement>
            <AnnouncementTag className="flex items-center gap-2">
              <span>Errors</span>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-600" />
              </span>
            </AnnouncementTag>
            <AnnouncementTitle>{errorCount}</AnnouncementTitle>
          </Announcement>
          <Announcement>
            <AnnouncementTag className="flex items-center gap-2">
              <span>Progress</span>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-600" />
              </span>
            </AnnouncementTag>
            <AnnouncementTitle>
              {currentIndex}/{totalUpdates}
            </AnnouncementTitle>
          </Announcement>
        </div>
      </div>

      <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="flex flex-col items-center gap-4 p-6 w-full max-w-lg bg-background dark:bg-[#0F0F0F] rounded-xl shadow-md"
          >
            <FormField
              control={form.control}
              name="file"
              render={({ field }) => (
                <FormItem className="w-full">
                  <FormLabel>Select Excel File</FormLabel>
                  <FormControl>
                    <div className="flex items-center gap-2 my-1">
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
      </div>

      {isRunning && <MotionGridShowcase />}

      {!currentUpdate && !isRunning && totalUpdates > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex justify-center mt-4">
          <Alert className="w-fit flex items-center gap-2">
            <CheckCircleIcon className="text-green-500" />
            <AlertTitle>Completed</AlertTitle>
            <AlertDescription>
              All file operations have finished.
            </AlertDescription>
          </Alert>
        </div>
      )}

      <AnimatePresence mode="wait">
        {currentUpdate && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 flex justify-center">
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              key={currentUpdate.id}
              transition={{ duration: 0.4 }}
            >
              <Alert>
                <LoaderCircleIcon className="animate-spin" />
                <AlertTitle>{currentUpdate.operation}</AlertTitle>
                <AlertDescription>
                  {currentUpdate.description}

                  <div className="flex items-center justify-center gap-2 mt-2">
                    <Badge
                      className="bg-gray-100 text-gray-700"
                      variant="secondary"
                    >
                      {currentUpdate.table}
                    </Badge>
                    <Badge className="bg-blue-100 text-blue-700">
                      Processing
                    </Badge>
                  </div>
                </AlertDescription>
              </Alert>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {(successStack.length || errorStack.length) > 0 && (
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 flex gap-12 mt-4">
          <div className="flex flex-col items-center gap-4">
            <Alert variant="success" className="flex items-center gap-2 w-fit">
              <AlertTitle>Success stack trace</AlertTitle>
              <Badge className="bg-[#E8F5E9] text-[#388E3C] dark:bg-[#022C22] dark:text-[#1BC994] rounded-sm">
                {successStack.length}
              </Badge>
            </Alert>

            <div className="h-auto w-[450px] p-2 overflow-hidden">
              <AnimatePresence mode="popLayout">
                <div className="grid gap-4">
                  {paginatedSuccessStack.map((update, index) => (
                    <motion.div
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      initial={{ opacity: 0, x: 20 }}
                      key={`${update.id}-success-${successCurrentPage}-${index}`}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Alert>
                        <CircleCheckIcon className="text-green-500" />
                        <AlertTitle>{update.operation}</AlertTitle>
                        <AlertDescription>
                          <p>{update.description}</p>

                          {update.success && (
                            <div className="rounded-lg border border-green-200 bg-green-100 p-3 mt-2">
                              <div className="mb-2 font-medium text-green-800 text-sm">
                                Player ID: {update.success.playerId}
                              </div>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button>View details</Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto max-w-96 overflow-auto bg-green-200 p-2 text-green-600 text-xs">
                                  {update.success.oldRating}
                                </PopoverContent>
                              </Popover>
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            </div>

            {successStack.length > ITEMS_PER_PAGE && (
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuccessPageChange("prev")}
                  disabled={successCurrentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {successCurrentPage} of {successTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleSuccessPageChange("next")}
                  disabled={successCurrentPage === successTotalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center gap-4">
            <Alert
              variant="destructive"
              className="flex items-center gap-2 w-fit"
            >
              <AlertTitle>Error stack trace</AlertTitle>
              <Badge className="bg-[#FFEBEE] text-[#D32F2F] dark:bg-[#4D0217] dark:text-[#FF6982] rounded-sm">
                {errorStack.length}
              </Badge>
            </Alert>

            <div className="h-auto w-[450px] p-2 overflow-hidden">
              <AnimatePresence mode="popLayout">
                <div className="grid gap-4">
                  {paginatedErrorStack.map((update, index) => (
                    <motion.div
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      initial={{ opacity: 0, x: 20 }}
                      key={`${update.id}-error-${errorCurrentPage}-${index}`}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Alert variant="destructive">
                        <AlertCircleIcon />
                        <AlertTitle>{update.operation}</AlertTitle>
                        <AlertDescription>
                          <p>{update.description}</p>
                          {update.error && (
                            <div className="rounded-lg border border-red-200 bg-red-100 p-3 mt-2">
                              <div className="mb-2 font-medium text-red-800 text-sm">
                                Error Message: {update.error.message}
                              </div>
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="destructive">
                                    View Details
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto max-w-96 overflow-auto bg-red-200 p-2 text-red-600 text-xs">
                                  <pre className="whitespace-pre-wrap break-words">
                                    {update.error.stack}
                                  </pre>
                                </PopoverContent>
                              </Popover>
                            </div>
                          )}
                        </AlertDescription>
                      </Alert>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            </div>

            {errorStack.length > ITEMS_PER_PAGE && (
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleErrorPageChange("prev")}
                  disabled={errorCurrentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {errorCurrentPage} of {errorTotalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleErrorPageChange("next")}
                  disabled={errorCurrentPage === errorTotalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
