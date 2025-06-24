"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  DatabaseIcon,
  CheckCircleIcon,
  XCircleIcon,
  Loader2Icon,
  PlayIcon,
  RotateCcwIcon,
  MoreHorizontalIcon,
  AlertTriangleIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MotionGridShowcase } from "./motion-grid-showcase";
import { ManagementBar } from "@/components/animate-ui/ui-elements/management-bar";
import {
  type DatabaseUpdateProps,
  getOperationIcon,
  mockResponses,
  mockUpdates,
} from "./data";

export default function DatabaseUpdate() {
  const [currentUpdate, setCurrentUpdate] =
    useState<DatabaseUpdateProps | null>(null);
  const [errorStack, setErrorStack] = useState<DatabaseUpdateProps[]>([]);
  const [successCount, setSuccessCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  const startAnimation = () => {
    setCurrentUpdate(null);
    setErrorStack([]);
    setSuccessCount(0);
    setErrorCount(0);
    setCurrentIndex(0);
    setIsRunning(true);

    // Start with the first update
    const firstUpdate = {
      ...mockUpdates[0],
      status: "pending" as const,
    };
    setCurrentUpdate(firstUpdate);
  };

  const reset = () => {
    setCurrentUpdate(null);
    setErrorStack([]);
    setSuccessCount(0);
    setErrorCount(0);
    setCurrentIndex(0);
    setIsRunning(false);
  };

  useEffect(() => {
    if (!isRunning || !currentUpdate) return;

    const timer = setTimeout(() => {
      const isSuccess = Math.random() > 0.4; // 60% success rate
      const duration = Math.floor(Math.random() * 2000) + 500;

      if (isSuccess) {
        // Success: increment counter and move to next
        setSuccessCount((prev) => prev + 1);
        setCurrentUpdate(null);

        // Move to next update
        const nextIndex = currentIndex + 1;
        if (nextIndex < mockUpdates.length) {
          setTimeout(() => {
            const nextUpdate = {
              ...mockUpdates[nextIndex],
              status: "pending" as const,
            };
            setCurrentUpdate(nextUpdate);
            setCurrentIndex(nextIndex);
          }, 500);
        } else {
          setIsRunning(false);
        }
      } else {
        // Error: add to error stack and move to next
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

        // Move to next update
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
    <div className="min-h-screen bg-background p-6">
      <ManagementBar />
      <MotionGridShowcase />
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <DatabaseIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">
                  Database Update Process
                </h1>
                <p className="text-sm text-gray-500">
                  Real-time operation monitoring
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-gray-600 font-medium">
                    Success: {successCount}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span className="text-gray-600 font-medium">
                    Errors: {errorCount}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-gray-600">
                    Progress: {currentIndex + (currentUpdate ? 1 : 0)}/
                    {mockUpdates.length}
                  </div>
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={startAnimation} disabled={isRunning} size="sm">
                  <PlayIcon className="w-4 h-4 mr-2" />
                  Run Process
                </Button>
                <Button onClick={reset} variant="outline" size="sm">
                  <RotateCcwIcon className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Central Processing Card */}
        <div className="mb-8 relative">
          {/* Polka dot background */}
          <div
            className="absolute inset-0 opacity-20 rounded-lg"
            style={{
              backgroundImage:
                "radial-gradient(circle, var(--muted) 2px, transparent 2px)",
              backgroundSize: "20px 20px",
              backgroundPosition: "0 0, 10px 10px",
            }}
          />

          <div className="relative z-10">
            <AnimatePresence mode="wait">
              {currentUpdate && (
                <motion.div
                  key={currentUpdate.id}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -20 }}
                  transition={{ duration: 0.4 }}
                >
                  <Card className="bg-white border-2 border-blue-200 shadow-lg">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-center mb-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-xl">
                          {getOperationIcon(currentUpdate.operation)}
                        </div>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Loader2Icon className="w-5 h-5 text-blue-600 animate-spin" />
                          <h3 className="text-lg font-semibold text-gray-900">
                            {currentUpdate.operation}
                          </h3>
                        </div>
                        <p className="text-gray-600 mb-4">
                          {currentUpdate.description}
                        </p>

                        <div className="flex items-center justify-center gap-2">
                          <Badge
                            variant="secondary"
                            className="bg-gray-100 text-gray-700"
                          >
                            {currentUpdate.table}
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-700">
                            Processing
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>

            {!currentUpdate && !isRunning && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DatabaseIcon className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500">
                  Click "Run Process" to start database operations
                </p>
              </div>
            )}

            {!currentUpdate && isRunning && (
              <div className="text-center py-12">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircleIcon className="w-8 h-8 text-green-600" />
                </div>
                <p className="text-green-600 font-medium">
                  All operations completed!
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Error Stack */}
        {errorStack.length > 0 && (
          <div className="relative">
            {/* Polka dot background */}
            <div
              className="absolute inset-0 opacity-5 rounded-lg"
              style={{
                backgroundImage:
                  "radial-gradient(circle, #ef4444 2px, transparent 2px)",
                backgroundSize: "20px 20px",
                backgroundPosition: "0 0, 10px 10px",
              }}
            />

            <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangleIcon className="w-5 h-5 text-red-600" />
                <h2 className="text-lg font-semibold text-gray-900">
                  Failed Operations
                </h2>
                <Badge className="bg-red-100 text-red-800">
                  {errorStack.length}
                </Badge>
              </div>

              <AnimatePresence>
                {errorStack.map((update, index) => (
                  <motion.div
                    key={update.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Card className="bg-red-50 border border-red-200 shadow-sm">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center text-lg">
                              {getOperationIcon(update.operation)}
                            </div>

                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <XCircleIcon className="w-4 h-4 text-red-600" />
                                <h3 className="font-medium text-gray-900">
                                  {update.operation}
                                </h3>
                                {update.duration && (
                                  <span className="text-xs text-red-600">
                                    ({update.duration}ms)
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-3">
                                {update.description}
                              </p>

                              <div className="flex items-center gap-2 mb-3">
                                <Badge
                                  variant="secondary"
                                  className="bg-gray-100 text-gray-700"
                                >
                                  {update.table}
                                </Badge>
                                <Badge className="bg-red-100 text-red-800">
                                  Failed
                                </Badge>
                              </div>

                              {update.error && (
                                <div className="bg-red-100 border border-red-200 rounded-lg p-3">
                                  <div className="text-sm font-medium text-red-800 mb-2">
                                    {update.error.message}
                                  </div>
                                  <details className="group">
                                    <summary className="cursor-pointer text-xs text-red-600 hover:text-red-700">
                                      View stack trace
                                    </summary>
                                    <pre className="text-xs text-red-600 bg-red-200 rounded p-2 mt-2 overflow-x-auto whitespace-pre-wrap">
                                      {update.error.stack}
                                    </pre>
                                  </details>
                                </div>
                              )}
                            </div>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <MoreHorizontalIcon className="w-4 h-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
