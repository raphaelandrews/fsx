"use client";

import React, { useCallback } from "react";
import { useForm, type SubmitHandler } from "react-hook-form";
import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import {
  CheckCircleIcon,
  LoaderCircleIcon,
  AlertCircleIcon,
  CircleCheckIcon,
  UserIcon,
  CakeIcon,
  VenusAndMarsIcon,
  StoreIcon,
  MapPinnedIcon,
  InfoIcon,
  MessageSquareIcon,
  CodeIcon,
} from "lucide-react";
import { zodResolver } from "@hookform/resolvers/zod";
import * as XLSX from "xlsx";
import z from "zod";

import type {
  DatabaseUpdateProps,
  PlayerAPIResponse,
  PlayerDataFields,
} from "./database-update-types";
import { DatabaseUpdateDeveloperTool } from "./database-update-developer-tool";
import { DatabaseUpdateMotionGrid } from "./database-update-motion-grid";

import { useDatabaseUpdateStore } from "@/lib/stores/database-update-store";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  const {
    isRunning,
    stopProcess,
    setIsRunning,
    selectedFileName,
    setSelectedFileName,
    setSuccessStackLength,
    setErrorStackLength,
  } = useDatabaseUpdateStore();

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
  const [showClearHistoryConfirm, setShowClearHistoryConfirm] =
    React.useState(false);
  const [currentStatusText, setCurrentStatusText] =
    React.useState("Ready to start...");

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
          setSuccessStackLength(parsedSuccess.length);
        }
        if (storedError) {
          const parsedError = JSON.parse(storedError);
          setErrorStack(parsedError);
          setErrorCount(parsedError.length);
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
      setSuccessStackLength(0);
      setErrorStackLength(0);
      setCurrentStatusText("Initializing update process...");

      const file = values.file;
      setSelectedFileName(file.name);

      if (file) {
        try {
          setCurrentStatusText("Reading Excel file...");
          const fileReader = new FileReader();
          fileReader.onload = async (e) => {
            if (e.target?.result) {
              const data = new Uint8Array(e.target.result as ArrayBuffer);
              setCurrentStatusText("Parsing Excel data...");
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
                setCurrentStatusText("Error: 'id' column missing.");
                return;
              }

              setCurrentStatusText(
                `Processing ${jsonData.length - 1} records...`
              );

              for (let i = 1; i < jsonData.length; i++) {
                if (!useDatabaseUpdateStore.getState().isRunning) {
                  setCurrentStatusText("Process stopped by user.");
                  break;
                }

                const row = jsonData[i] as (string | number | null)[];

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

                if (id === null || Number.isNaN(id)) {
                  toast.error(`Row ${i + 1}: Invalid or missing 'id' value.`);
                  setErrorStack((prev) => [
                    {
                      _uuid: crypto.randomUUID(),
                      operation: "Player Creation Failed",
                      table: "N/A",
                      status: 400,
                      error: {
                        message: `Row ${i + 1}: Invalid or missing 'id'.`,
                      },
                    },
                    ...prev,
                  ]);
                  setErrorCount((prev) => prev + 1);
                  setCurrentIndex((prev) => prev + 1);
                  setCurrentStatusText(
                    `Row ${i + 1}: Skipping due to invalid ID.`
                  );
                  continue;
                }

                if (id === 0) {
                  if (name === undefined || name === "") {
                    toast.error(
                      `Row ${i + 1}: Missing or empty 'name' for new player.`
                    );
                    setErrorStack((prev) => [
                      {
                        _uuid: crypto.randomUUID(),
                        operation: "Player Creation Failed",
                        table: "N/A",
                        status: 400,
                        error: {
                          message: `Row ${
                            i + 1
                          }: Missing or empty 'name' for new player.`,
                        },
                      },
                      ...prev,
                    ]);
                    setErrorCount((prev) => prev + 1);
                    setCurrentIndex((prev) => prev + 1);
                    setCurrentStatusText(
                      `Row ${
                        i + 1
                      }: Skipping due to missing name for new player.`
                    );
                    continue;
                  }
                }

                const playerData = {
                  ...(name !== undefined && name !== "" && { name }),
                  ...(birth !== undefined && {
                    birth: birth.split("T")[0],
                  }),
                  ...(sex !== undefined && { sex }),
                  ...(clubId !== undefined && { clubId }),
                  ...(locationId !== undefined && { locationId }),
                };

                const operationText =
                  id === 0
                    ? "Creating Player"
                    : `Updating Player with ID ${id}`;

                setCurrentUpdate({
                  operation: operationText,
                  table: "Players",
                });
                setCurrentStatusText(
                  `${operationText} (Row ${i} of ${jsonData.length - 1})`
                );

                try {
                  await new Promise((resolve) =>
                    setTimeout(resolve, Math.random() * 500 + 100)
                  );

                  let res: Response;
                  let jsonRes: PlayerAPIResponse;
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

                  const successPayloadDataFields: PlayerDataFields =
                    jsonRes.dataFields;

                  setSuccessStack((prev) => [
                    {
                      _uuid: crypto.randomUUID(),
                      operation:
                        id === 0
                          ? `${successPayloadDataFields.name} Created`
                          : `${successPayloadDataFields.name} - ID ${successPayloadDataFields.id} - Updated`,
                      table: "Players",
                      status: res.status,
                      success: {
                        dataFields: successPayloadDataFields,
                        message: jsonRes.message,
                      },
                    },
                    ...prev,
                  ]);
                  setSuccessCount((prev) => prev + 1);
                  setCurrentStatusText(`Successfully processed ID ${id}.`);
                } catch (error: unknown) {
                  const errorMessage =
                    error instanceof Error ? error.message : "Unknown error";
                  const errorStack =
                    error instanceof Error
                      ? error.stack
                      : "No stack trace available.";
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

                  setErrorStack((prev) => [
                    {
                      _uuid: crypto.randomUUID(),
                      operation:
                        id === 0
                          ? "Player Creation Failed"
                          : `Player with ID ${id} update failed`,
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
                  setCurrentStatusText(`Failed to process ID ${id}.`);
                } finally {
                  setCurrentIndex((prev) => prev + 1);
                  setCurrentUpdate(null);
                }
              }
            }

            if (useDatabaseUpdateStore.getState().isRunning) {
              toast.success("Database update process completed!");
              setCurrentStatusText("Update process finished.");
            }
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
          setCurrentStatusText(`File processing error: ${errorMessage}`);
        }
      } else {
        toast.error("Please select a file to upload.");
        setIsRunning(false);
        setSelectedFileName(null);
        setCurrentStatusText("No file selected.");
      }
    },
    [
      setIsRunning,
      setSelectedFileName,
      setSuccessStackLength,
      setErrorStackLength,
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
    setSuccessCount(0);
    setErrorCount(0);
    setCurrentIndex(0);
    setTotalUpdates(0);
    setIsRunning(false);
    setSuccessCurrentPage(1);
    setErrorCurrentPage(1);
    setSelectedFileName(null);
    setSuccessStackLength(0);
    setErrorStackLength(0);
    toast.info("Database update history cleared from local storage.");
    setShowClearHistoryConfirm(false);
    setCurrentStatusText("History cleared. Ready to start...");
  }, [
    setSuccessStackLength,
    setErrorStackLength,
    form.reset,
    setIsRunning,
    setSelectedFileName,
  ]);

  const clearHistory = useCallback(() => {
    setShowClearHistoryConfirm(true);
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
  }, [form, setSelectedFileName]);

  React.useEffect(() => {
    const {
      setRunAction,
      setStopAction,
      setClearHistoryAction,
      setClearFileAction,
    } = useDatabaseUpdateStore.getState();
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

  return (
    <>
      <DatabaseUpdateDeveloperTool />

      {isRunning && (
        <DatabaseUpdateMotionGrid currentStatusText={currentStatusText} />
      )}

      <div className="absolute top-4 right-4 flex flex-col items-end gap-4">
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

      {!isRunning && successStack.length === 0 && errorStack.length === 0 && (
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="absolute top-1/3 left-1/2 -translate-1/2 flex flex-col items-center gap-4 p-6 w-full max-w-lg bg-background dark:bg-[#0F0F0F] rounded-xl shadow-md"
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

      <AlertDialog
        open={showClearHistoryConfirm}
        onOpenChange={setShowClearHistoryConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your
              success and error history from local storage.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={performClearHistory}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {!currentUpdate && !isRunning && totalUpdates > 0 && (
        <Alert className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 w-fit">
          <CheckCircleIcon className="text-green-500" />
          <AlertTitle>Completed</AlertTitle>
          <AlertDescription>
            All file operations have finished.
          </AlertDescription>
        </Alert>
      )}

      <AnimatePresence mode="wait">
        {currentUpdate && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 hidden justify-center">
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              key={crypto.randomUUID()}
              transition={{ duration: 0.4 }}
            >
              <Alert>
                <LoaderCircleIcon className="animate-spin" />
                <AlertTitle>{currentUpdate.operation}</AlertTitle>
                <AlertDescription>
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
                      key={(update as unknown as { _uuid: string })._uuid}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Alert variant="success">
                        <CircleCheckIcon />
                        <AlertTitle className="flex justify-between">
                          <span>{update.operation}</span>
                          <Badge className="bg-[#E8F5E9] text-[#388E3C] dark:bg-[#022C22] dark:text-[#1BC994] rounded-sm">
                            {update.status}
                          </Badge>
                        </AlertTitle>
                        <AlertDescription className="mt-2">
                          {update.success && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button>View details</Button>
                              </PopoverTrigger>
                              <PopoverContent className="flex flex-col gap-2 text-sm w-auto max-w-96 overflow-auto">
                                <div className="flex items-center gap-2">
                                  <div className="p-1 bg-accent rounded-sm">
                                    <UserIcon size={14} />
                                  </div>
                                  <p className="text-foreground/60">
                                    ID: {update.success.dataFields?.id}
                                  </p>
                                </div>
                                {update.success.dataFields?.birth && (
                                  <div className="flex items-center gap-2">
                                    <div className="p-1 bg-accent rounded-sm">
                                      <CakeIcon size={14} />
                                    </div>
                                    <p className="text-foreground/60">
                                      Birth:{" "}
                                      {format(
                                        new Date(
                                          update.success.dataFields?.birth
                                        ),
                                        "MM/dd/yyyy"
                                      )}
                                    </p>
                                  </div>
                                )}
                                {update.success.dataFields?.sex != null && (
                                  <div className="flex items-center gap-2">
                                    <div className="p-1 bg-accent rounded-sm">
                                      <VenusAndMarsIcon size={14} />
                                    </div>
                                    <p className="text-foreground/60">
                                      Sex:{" "}
                                      {update.success.dataFields?.sex
                                        .toString()
                                        .toUpperCase()}
                                    </p>
                                  </div>
                                )}
                                {update.success.dataFields?.clubId && (
                                  <div className="flex items-center gap-2">
                                    <div className="p-1 bg-accent rounded-sm">
                                      <StoreIcon size={14} />
                                    </div>
                                    <p className="text-foreground/60">
                                      Club ID:{" "}
                                      {update.success.dataFields?.clubId}
                                    </p>
                                  </div>
                                )}
                                {update.success.dataFields?.locationId && (
                                  <div className="flex items-center gap-2">
                                    <div className="p-1 bg-accent rounded-sm">
                                      <MapPinnedIcon size={14} />
                                    </div>
                                    <p className="text-foreground/60">
                                      Location ID:{" "}
                                      {update.success.dataFields?.locationId}
                                    </p>
                                  </div>
                                )}
                              </PopoverContent>
                            </Popover>
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
                      key={(update as unknown as { _uuid: string })._uuid}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                    >
                      <Alert variant="destructive">
                        <AlertCircleIcon />
                        <AlertTitle>{update.operation}</AlertTitle>
                        <AlertDescription className="mt-2">
                          {update.error && (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button>View details</Button>
                              </PopoverTrigger>
                              <PopoverContent className="flex flex-col gap-2 text-sm w-auto max-w-96 overflow-auto">
                                <div className="flex items-center gap-2">
                                  <div className="p-1 bg-accent rounded-sm">
                                    <InfoIcon size={14} />
                                  </div>
                                  <p className="text-foreground/60">
                                    Status: {update.status}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="p-1 bg-accent rounded-sm">
                                    <MessageSquareIcon size={14} />
                                  </div>
                                  <p className="text-foreground/60">
                                    Message: {update.error.message}
                                  </p>
                                </div>
                                {update.error.stack && (
                                  <div className="flex items-center gap-2">
                                    <div className="p-1 bg-accent rounded-sm">
                                      <CodeIcon size={14} />
                                    </div>
                                    <p className="text-foreground/60">
                                      Stack: {update.error.stack}
                                    </p>
                                  </div>
                                )}
                              </PopoverContent>
                            </Popover>
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
