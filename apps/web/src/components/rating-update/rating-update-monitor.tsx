"use client";

import { motion, AnimatePresence } from "motion/react";

import { Button } from "@fsx/ui/components/button";
import { Badge } from "@fsx/ui/components/badge";

import { MotionGrid } from "@/components/animate-ui/motion-grid";
import { RotatingText } from "@/components/animate-ui/rotating";

import { motionGridStates, type AnimationState } from "./motion-grid-states";

export function RatingUpdateMonitor({
  statusText,
  animationState,
  currentIndex,
  totalUpdates,
}: {
  statusText: string;
  animationState: AnimationState;
  currentIndex: number;
  totalUpdates: number;
}) {
  const { frames, duration } = motionGridStates[animationState];

  return (
    <div className="absolute top-20 left-1/2 flex -translate-x-1/2 flex-col items-center gap-6">
      <Button
        className="h-11 gap-x-3 px-3"
        size="lg"
        variant="outline"
      >
        <MotionGrid
          cellActiveClassName="bg-primary"
          cellClassName="size-[3px]"
          cellInactiveClassName="bg-secondary"
          frames={frames}
          gridSize={[5, 5]}
          duration={duration}
        />

        <RotatingText
          containerClassName="absolute left-[46px] top-1/2 -translate-y-1/2"
          layout="preserve-aspect"
          text={statusText}
        />

        <span aria-hidden className="invisible opacity-0">
          {statusText}
        </span>
      </Button>

      <AnimatePresence mode="popLayout">
        <motion.div
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          initial={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.3, delay: 0.05 }}
        >
          <ProgressBar currentIndex={currentIndex} totalUpdates={totalUpdates} />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function ProgressBar({ currentIndex, totalUpdates }: { currentIndex: number; totalUpdates: number }) {
  const progress = totalUpdates > 0 ? (currentIndex / totalUpdates) * 100 : 0;

  return (
    <div className="w-[300px] space-y-2">
      <div className="mb-1.5 flex items-center justify-between gap-1">
        <span className="text-sm font-medium">
          <Badge className="rounded-sm" variant="secondary">
            {currentIndex}/{totalUpdates}
          </Badge>
        </span>
        <Badge className="rounded-sm" variant="secondary">
          {progress.toFixed(1)} %
        </Badge>
      </div>
      <div className="bg-muted h-2 w-full overflow-hidden rounded-full">
        <div
          className="bg-primary h-full rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
