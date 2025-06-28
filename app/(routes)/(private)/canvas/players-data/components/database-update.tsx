"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DatabaseIcon,
  CheckCircleIcon,
  PlayIcon,
  RotateCcwIcon,
  DatabaseZapIcon,
  LoaderCircleIcon,
  AlertCircleIcon,
  CircleCheckIcon,
} from "lucide-react";

import { type DatabaseUpdateProps, mockResponses, mockUpdates } from "./data";
import { MotionGridShowcase } from "./motion-grid-showcase";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Announcement,
  AnnouncementTag,
  AnnouncementTitle,
} from "@/components/ui/announcement";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export default function DatabaseUpdate() {
  const [currentUpdate, setCurrentUpdate] =
    useState<DatabaseUpdateProps | null>(null);
  const [successStack, setSuccessStack] = useState<DatabaseUpdateProps[]>([]);
  const [errorStack, setErrorStack] = useState<DatabaseUpdateProps[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const startAnimation = () => {
    setCurrentUpdate(null);
    setSuccessStack([]);
    setErrorStack([]);
    setSuccessCount(0);
    setErrorCount(0);
    setCurrentIndex(0);
    setIsRunning(true);

    const firstUpdate = {
      ...mockUpdates[0],
      status: "pending" as const,
    };
    setCurrentUpdate(firstUpdate);
  };

  const reset = () => {
    setCurrentUpdate(null);
    setSuccessStack([]);
    setErrorStack([]);
    setSuccessCount(0);
    setErrorCount(0);
    setCurrentIndex(0);
    setIsRunning(false);
  };

  useEffect(() => {
    if (!(isRunning && currentUpdate)) return;

    const timer = setTimeout(() => {
      const isSuccess = Math.random() > 0.4;
      const duration = Math.floor(Math.random() * 2000) + 500;

      if (isSuccess) {
        const successUpdate = {
          ...currentUpdate,
          status: "success" as const,
          success:
            mockResponses.success[
              Math.floor(Math.random() * mockResponses.success.length)
            ],
          duration,
        };

        setSuccessStack((prev) => [successUpdate, ...prev]);
        setSuccessCount((prev) => prev + 1);
        setCurrentUpdate(null);

        const nextIndex = currentIndex + 1;
        if (nextIndex < mockUpdates.length) {
          setTimeout(() => {
            const nextUpdate = {
              ...mockUpdates[nextIndex],
              status: "pending" as const,
            };
            setCurrentUpdate(nextUpdate);
            setCurrentIndex(nextIndex);
          }, 800);
        } else {
          setIsRunning(false);
        }
      } else {
        const errorUpdate = {
          ...currentUpdate,
          status: "error" as const,
          error:
            mockResponses.errors[
              Math.floor(Math.random() * mockResponses.errors.length)
            ],
          duration,
        };

        setErrorStack((prev) => [errorUpdate, ...prev]);
        setErrorCount((prev) => prev + 1);
        setCurrentUpdate(null);

        const nextIndex = currentIndex + 1;
        if (nextIndex < mockUpdates.length) {
          setTimeout(() => {
            const nextUpdate = {
              ...mockUpdates[nextIndex],
              status: "pending" as const,
            };
            setCurrentUpdate(nextUpdate);
            setCurrentIndex(nextIndex);
          }, 800);
        } else {
          setIsRunning(false);
        }
      }
    }, Math.random() * 2000 + 1500);

    return () => clearTimeout(timer);
  }, [isRunning, currentUpdate, currentIndex]);

  return (
    <div className="relative w-screen h-screen bg-[radial-gradient(var(--color-secondary),transparent_1px)] [background-size:16px_16px]">
      <Alert className="absolute top-4 left-4 flex justify-center gap-3 w-fit">
        <DatabaseIcon />
        <AlertTitle>Database Update Process</AlertTitle>
      </Alert>

      <div className="absolute top-4 right-4 flex flex-col items-end gap-4">
        <div className="flex gap-2">
          <Button disabled={isRunning} onClick={startAnimation} size="sm">
            <PlayIcon className="mr-2 size-4" />
            Run
          </Button>
          <Button onClick={reset} size="sm" variant="outline">
            <RotateCcwIcon className="mr-2 size-4" />
            Reset
          </Button>
        </div>

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
              {currentIndex + (currentUpdate ? 1 : 0)}/{mockUpdates.length}
            </AnnouncementTitle>
          </Announcement>
        </div>
      </div>

      {successStack.length === 0 && errorStack.length === 0 && (
        <Alert className="absolute top-1/4 left-1/2 -translate-x-1/2 flex justify-center w-fit">
          <DatabaseZapIcon />
          <AlertTitle>Run to start database operations</AlertTitle>
        </Alert>
      )}

      {isRunning && <MotionGridShowcase />}

      {!currentUpdate && isRunning && (
        <div className="mt-4 flex justify-center">
          <Alert className="w-fit">
            <CheckCircleIcon />
            <AlertTitle>Completed</AlertTitle>
          </Alert>
        </div>
      )}

      <AnimatePresence mode="wait">
        {currentUpdate && (
          <div className="mt-4 flex justify-center">
            <motion.div
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              key={currentUpdate.id}
              transition={{ duration: 0.4 }}
            >
              <Alert>
                <LoaderCircleIcon />
                <AlertTitle>{currentUpdate.operation}</AlertTitle>
                <AlertDescription>
                  {currentUpdate.description}

                  <div className="flex items-center justify-center gap-2">
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

      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 flex gap-12">
        <div className="flex flex-col items-center gap-4">
          <Alert variant="success" className="flex items-center gap-2 w-fit">
            <AlertTitle>Success stack trace</AlertTitle>
            <Badge className="bg-[#E8F5E9] text-[#388E3C] dark:bg-[#022C22] dark:text-[#1BC994] rounded-sm">
              {successStack.length}
            </Badge>
          </Alert>

          <ScrollArea className="h-[50vh] w-[350px]" hideScrollbar>
            <AnimatePresence>
              <div className="grid gap-4">
                {successStack.map((update, index) => (
                  <motion.div
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    initial={{ opacity: 0, x: -20 }}
                    key={update.id}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Alert>
                      <CircleCheckIcon />
                      <AlertTitle>{update.operation}</AlertTitle>
                      <AlertDescription>
                        <p>{update.description}</p>

                        {update.success && (
                          <div className="rounded-lg border border-red-200 bg-red-100 p-3">
                            <div className="mb-2 font-medium text-red-800 text-sm">
                              {update.success.playerId}
                            </div>
                            <details className="group">
                              <summary className="cursor-pointer text-red-600 text-xs hover:text-red-700">
                                View stack trace
                              </summary>
                              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded bg-red-200 p-2 text-red-600 text-xs">
                                {update.success.oldRating}
                              </pre>
                            </details>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          </ScrollArea>
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

          <ScrollArea className="h-[50vh] w-[350]" hideScrollbar>
            <AnimatePresence>
              <div className="grid gap-4">
                {errorStack.map((update, index) => (
                  <motion.div
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    initial={{ opacity: 0, x: -20 }}
                    key={update.id}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Alert variant="destructive">
                      <AlertCircleIcon />
                      <AlertTitle>{update.operation}</AlertTitle>
                      <AlertDescription>
                        <p>{update.description}</p>

                        {update.error && (
                          <div className="rounded-lg border border-red-200 bg-red-100 p-3">
                            <div className="mb-2 font-medium text-red-800 text-sm">
                              {update.error.message}
                            </div>
                            <details className="group">
                              <summary className="cursor-pointer text-red-600 text-xs hover:text-red-700">
                                View stack trace
                              </summary>
                              <pre className="mt-2 overflow-x-auto whitespace-pre-wrap rounded bg-red-200 p-2 text-red-600 text-xs">
                                {update.error.stack}
                              </pre>
                            </details>
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                ))}
              </div>
            </AnimatePresence>
          </ScrollArea>
        </div>
      </div>
    </div>
  );
}
