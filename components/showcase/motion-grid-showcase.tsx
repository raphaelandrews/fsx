import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
 
import { Button } from '@/components/ui/button';
import { type Frames, MotionGrid } from '@/components/animate-ui/components/motion-grid';
import { RotatingText } from '@/components/animate-ui/text/rotating';
 
const importingFrames = [
  [[2, 2]],
  [
    [1, 2],
    [2, 1],
    [2, 3],
    [3, 2],
  ],
  [
    [2, 2],
    [0, 2],
    [1, 1],
    [1, 3],
    [2, 0],
    [2, 4],
    [3, 1],
    [3, 3],
    [4, 2],
  ],
  [
    [0, 1],
    [0, 3],
    [1, 0],
    [1, 2],
    [1, 4],
    [2, 1],
    [2, 3],
    [3, 0],
    [3, 2],
    [3, 4],
    [4, 1],
    [4, 3],
  ],
  [
    [0, 0],
    [0, 2],
    [0, 4],
    [1, 1],
    [1, 3],
    [2, 0],
    [2, 2],
    [2, 4],
    [3, 1],
    [3, 3],
    [4, 0],
    [4, 2],
    [4, 4],
  ],
  [
    [0, 1],
    [0, 3],
    [1, 0],
    [1, 2],
    [1, 4],
    [2, 1],
    [2, 3],
    [3, 0],
    [3, 2],
    [3, 4],
    [4, 1],
    [4, 3],
  ],
  [
    [0, 0],
    [0, 2],
    [0, 4],
    [1, 1],
    [1, 3],
    [2, 0],
    [2, 4],
    [3, 1],
    [3, 3],
    [4, 0],
    [4, 2],
    [4, 4],
  ],
  [
    [0, 1],
    [1, 0],
    [3, 0],
    [4, 1],
    [0, 3],
    [1, 4],
    [3, 4],
    [4, 3],
  ],
  [
    [0, 0],
    [0, 4],
    [4, 0],
    [4, 4],
  ],
  [],
] as Frames;
 
const arrowDownFrames = [
  [[2, 0]],
  [
    [1, 0],
    [2, 0],
    [3, 0],
    [2, 1],
  ],
  [
    [2, 0],
    [1, 1],
    [2, 1],
    [3, 1],
    [2, 2],
  ],
  [
    [2, 0],
    [2, 1],
    [1, 2],
    [2, 2],
    [3, 2],
    [2, 3],
  ],
  [
    [2, 1],
    [2, 2],
    [1, 3],
    [2, 3],
    [3, 3],
    [2, 4],
  ],
  [
    [2, 2],
    [2, 3],
    [1, 4],
    [2, 4],
    [3, 4],
  ],
  [
    [2, 3],
    [2, 4],
  ],
  [[2, 4]],
  [],
] as Frames;
 
const arrowUpFrames = [
  [[2, 4]],
  [
    [1, 4],
    [2, 4],
    [3, 4],
    [2, 3],
  ],
  [
    [2, 4],
    [1, 3],
    [2, 3],
    [3, 3],
    [2, 2],
  ],
  [
    [2, 4],
    [2, 3],
    [1, 2],
    [2, 2],
    [3, 2],
    [2, 1],
  ],
  [
    [2, 3],
    [2, 2],
    [1, 1],
    [2, 1],
    [3, 1],
    [2, 0],
  ],
  [
    [2, 2],
    [2, 1],
    [1, 0],
    [2, 0],
    [3, 0],
  ],
  [
    [2, 1],
    [2, 0],
  ],
  [[2, 0]],
  [],
] as Frames;
 
const syncingFrames = [...arrowDownFrames, ...arrowUpFrames] as Frames;
 
const searchingFrames = [
  [
    [1, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [1, 2],
  ],
  [
    [2, 0],
    [1, 1],
    [2, 1],
    [3, 1],
    [2, 2],
  ],
  [
    [3, 0],
    [2, 1],
    [3, 1],
    [4, 1],
    [3, 2],
  ],
  [
    [3, 1],
    [2, 2],
    [3, 2],
    [4, 2],
    [3, 3],
  ],
  [
    [3, 2],
    [2, 3],
    [3, 3],
    [4, 3],
    [3, 4],
  ],
  [
    [1, 2],
    [0, 3],
    [1, 3],
    [2, 3],
    [1, 4],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 2],
    [2, 0],
    [2, 1],
    [2, 2],
  ],
  [],
] as Frames;
 
const busyFrames = [
  [
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 2],
    [4, 1],
    [4, 2],
    [4, 3],
  ],
  [
    [0, 1],
    [0, 2],
    [0, 3],
    [2, 3],
    [4, 2],
    [4, 3],
    [4, 4],
  ],
  [
    [0, 1],
    [0, 2],
    [0, 3],
    [3, 4],
    [4, 2],
    [4, 3],
    [4, 4],
  ],
  [
    [0, 1],
    [0, 2],
    [0, 3],
    [2, 3],
    [4, 2],
    [4, 3],
    [4, 4],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 2],
    [4, 2],
    [4, 3],
    [4, 4],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [2, 1],
    [4, 1],
    [4, 2],
    [4, 3],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [3, 0],
    [4, 0],
    [4, 1],
    [4, 2],
  ],
  [
    [0, 1],
    [0, 2],
    [0, 3],
    [2, 1],
    [4, 0],
    [4, 1],
    [4, 2],
  ],
] as Frames;
 
const savingFrames = [
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [0, 4],
    [1, 0],
    [1, 1],
    [1, 2],
    [1, 3],
    [2, 0],
    [2, 1],
    [2, 2],
    [2, 3],
    [2, 4],
    [3, 0],
    [3, 1],
    [3, 2],
    [3, 3],
    [4, 0],
    [4, 1],
    [4, 2],
    [4, 3],
    [4, 4],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [0, 3],
    [1, 0],
    [1, 1],
    [1, 2],
    [2, 0],
    [2, 1],
    [2, 2],
    [2, 3],
    [3, 0],
    [3, 1],
    [3, 2],
    [4, 0],
    [4, 1],
    [4, 2],
    [4, 3],
  ],
  [
    [0, 0],
    [0, 1],
    [0, 2],
    [1, 0],
    [1, 1],
    [2, 0],
    [2, 1],
    [2, 2],
    [3, 0],
    [3, 1],
    [4, 0],
    [4, 1],
    [4, 2],
    [4, 4],
    [3, 4],
    [2, 4],
    [1, 4],
    [0, 4],
  ],
  [
    [0, 0],
    [0, 1],
    [1, 0],
    [2, 0],
    [2, 1],
    [3, 0],
    [4, 0],
    [4, 1],
    [4, 3],
    [3, 3],
    [2, 3],
    [1, 3],
    [0, 3],
    [4, 4],
    [3, 4],
    [2, 4],
    [1, 4],
    [0, 4],
  ],
  [
    [0, 0],
    [2, 0],
    [4, 0],
    [4, 2],
    [3, 2],
    [2, 2],
    [1, 2],
    [0, 2],
    [4, 3],
    [3, 3],
    [2, 3],
    [1, 3],
    [0, 3],
    [4, 4],
    [3, 4],
    [2, 4],
    [1, 4],
    [0, 4],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [4, 1],
    [3, 1],
    [2, 1],
    [1, 1],
    [0, 1],
    [4, 2],
    [3, 2],
    [2, 2],
    [1, 2],
    [0, 2],
    [4, 3],
    [3, 3],
    [2, 3],
    [1, 3],
    [0, 3],
    [4, 4],
    [3, 4],
    [2, 4],
    [1, 4],
    [0, 4],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [4, 1],
    [3, 1],
    [2, 1],
    [1, 1],
    [0, 1],
    [4, 2],
    [3, 2],
    [2, 2],
    [1, 2],
    [0, 2],
    [4, 3],
    [3, 3],
    [2, 3],
    [1, 3],
    [0, 3],
    [4, 4],
    [3, 4],
    [2, 4],
    [1, 4],
    [0, 4],
  ],
  [
    [0, 0],
    [1, 0],
    [2, 0],
    [3, 0],
    [4, 0],
    [4, 1],
    [3, 1],
    [2, 1],
    [1, 1],
    [0, 1],
    [4, 2],
    [3, 2],
    [2, 2],
    [1, 2],
    [0, 2],
    [4, 3],
    [3, 3],
    [2, 3],
    [1, 3],
    [0, 3],
    [4, 4],
    [3, 4],
    [2, 4],
    [1, 4],
    [0, 4],
  ],
] as Frames;
 
const initializingFrames = [
  [],
  [
    [1, 0],
    [3, 0],
  ],
  [
    [1, 0],
    [3, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
    [4, 1],
  ],
  [
    [1, 0],
    [3, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
    [4, 1],
    [0, 2],
    [1, 2],
    [2, 2],
    [3, 2],
    [4, 2],
  ],
  [
    [1, 0],
    [3, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
    [4, 1],
    [0, 2],
    [1, 2],
    [2, 2],
    [3, 2],
    [4, 2],
    [1, 3],
    [2, 3],
    [3, 3],
  ],
  [
    [1, 0],
    [3, 0],
    [0, 1],
    [1, 1],
    [2, 1],
    [3, 1],
    [4, 1],
    [0, 2],
    [1, 2],
    [2, 2],
    [3, 2],
    [4, 2],
    [1, 3],
    [2, 3],
    [3, 3],
    [2, 4],
  ],
  [
    [1, 2],
    [2, 1],
    [2, 2],
    [2, 3],
    [3, 2],
  ],
  [[2, 2]],
  [],
] as Frames;
 
const states = {
  importing: {
    frames: importingFrames,
    label: 'Importing',
  },
  syncing: {
    frames: syncingFrames,
    label: 'Syncing',
  },
  searching: {
    frames: searchingFrames,
    label: 'Searching',
  },
  busy: {
    frames: busyFrames,
    label: 'Busy',
  },
  saving: {
    frames: savingFrames,
    label: 'Saving',
  },
  initializing: {
    frames: initializingFrames,
    label: 'Initializing',
  },
};
 
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
 
export function MotionGridShowcase() {
  const [state, setState] = useState<keyof typeof states>('importing');
 
  const runStates = async () => {
    while (true) {
      for (const state of Object.keys(states) as (keyof typeof states)[]) {
        setState(state);
        await sleep(3000);
      }
    }
  };
 
  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
   useEffect(() => {
    runStates();
  }, []);
 
  return (
    <Button size="lg" className="px-3 h-11 gap-x-3 relative" asChild>
      <motion.button
        layout
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <motion.div layout="preserve-aspect">
          <MotionGrid
            gridSize={[5, 5]}
            frames={states[state].frames}
            cellClassName="size-[3px]"
            cellActiveClassName="bg-white/70 dark:bg-black/70"
            cellInactiveClassName="bg-white/20 dark:bg-black/20"
          />
        </motion.div>
 
        <RotatingText
          text={states[state].label}
          containerClassName="absolute left-[46px] top-1/2 -translate-y-1/2"
          layout="preserve-aspect"
        />
 
        <span className="invisible opacity-0" aria-hidden>
          {states[state].label}
        </span>
      </motion.button>
    </Button>
  );
};
