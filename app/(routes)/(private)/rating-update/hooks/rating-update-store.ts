import { create } from 'zustand';
import type { RatingUpdateProps } from '@/app/(routes)/(private)/rating-update/components/rating-update-types';

interface RatingUpdateState {
  isRunning: boolean;
  selectedFileName: string | null;
  successStackLength: number;
  errorStackLength: number;
  currentIndex: number;
  totalUpdates: number;
  currentUpdate: RatingUpdateProps | null;
}

interface RatingUpdateActions {
  setSelectedFileName: (fileName: string | null) => void;
  setSuccessStackLength: (length: number) => void;
  setErrorStackLength: (length: number) => void;
  setCurrentUpdate: (update: RatingUpdateProps | null) => void;
  setRunAction: (action: () => void) => void;
  setIsRunning: (running: boolean) => void;
  setCurrentIndex: (index: number | ((prev: number) => number)) => void;
  setTotalUpdates: (totalUpdates: number) => void;
  setStopAction: (action: () => void) => void;
  setClearHistoryAction: (action: () => void) => void;
  setClearFileAction: (action: () => void) => void;
  runProcess: () => void;
  stopProcess: () => void;
  clearHistory: () => void;
  clearFile: () => void;
}

export const useRatingUpdateStore = create<RatingUpdateState & RatingUpdateActions>((set) => ({
  isRunning: false,
  selectedFileName: null,
  successStackLength: 0,
  errorStackLength: 0,
  currentIndex: 0,
  totalUpdates: 0,
  currentUpdate: null,
  setIsRunning: (running) => set({ isRunning: running }),
  setCurrentIndex: (index) =>
    set((state) => ({
      currentIndex: typeof index === 'function' ? index(state.currentIndex) : index,
    })),
  setTotalUpdates: (totalUpdates) => set({ totalUpdates: totalUpdates }),
  setSelectedFileName: (fileName) => set({ selectedFileName: fileName }),
  setSuccessStackLength: (length) => set({ successStackLength: length }),
  setErrorStackLength: (length) => set({ errorStackLength: length }),
  setCurrentUpdate: (update) => set({ currentUpdate: update }),
  runProcess: () => console.warn("runProcess action not set"),
  stopProcess: () => set({ isRunning: false }),
  clearHistory: () => console.warn("clearHistory action not set"),
  clearFile: () => console.warn("clearFile action not set"),
  setRunAction: (action) => set({ runProcess: action }),
  setStopAction: (action) => set({ stopProcess: action }),
  setClearHistoryAction: (action) => set({ clearHistory: action }),
  setClearFileAction: (action) => set({ clearFile: action }),
}));
