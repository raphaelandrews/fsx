import { create } from 'zustand';
import type { RatingUpdateProps } from '../components/rating-update-types';

interface RatingUpdateStore {
  isRunning: boolean;
  currentIndex: number;
  totalUpdates: number;
  currentUpdate: RatingUpdateProps | null;
  selectedFileName: string | null;
  successStackLength: number;
  errorStackLength: number;
  generatedFilesCount: number;

  runAction?: () => void;
  stopAction?: () => void;
  clearHistoryAction?: () => void;
  clearFileAction?: () => void;

  runProcess: () => void;
  stopProcess: () => void;
  clearHistory: () => void;
  clearFile: () => void;

  setIsRunning: (status: boolean) => void;
  setCurrentIndex: (index: number) => void;
  setTotalUpdates: (total: number) => void;
  setCurrentUpdate: (update: RatingUpdateProps | null) => void;
  setSelectedFileName: (name: string | null) => void;
  setSuccessStackLength: (length: number) => void;
  setErrorStackLength: (length: number) => void;
  setGeneratedFilesCount: (count: number) => void;

  setRunAction: (action: () => void) => void;
  setStopAction: (action: () => void) => void;
  setClearHistoryAction: (action: () => void) => void;
  setClearFileAction: (action: () => void) => void;
}

export const useRatingUpdateStore = create<RatingUpdateStore>((set, get) => ({
  isRunning: false,
  currentIndex: 0,
  totalUpdates: 0,
  currentUpdate: null,
  selectedFileName: null,
  successStackLength: 0,
  errorStackLength: 0,
  generatedFilesCount: 0,

  runAction: undefined,
  stopAction: undefined,
  clearHistoryAction: undefined,
  clearFileAction: undefined,

  runProcess: () => {
    const { runAction } = get();
    if (runAction) runAction();
  },
  stopProcess: () => {
    const { stopAction } = get();
    if (stopAction) stopAction();
  },
  clearHistory: () => {
    const { clearHistoryAction } = get();
    if (clearHistoryAction) clearHistoryAction();
  },
  clearFile: () => {
    const { clearFileAction } = get();
    if (clearFileAction) clearFileAction();
  },

  setIsRunning: (status) => set({ isRunning: status }),
  setCurrentIndex: (index) => set({ currentIndex: index }),
  setTotalUpdates: (total) => set({ totalUpdates: total }),
  setCurrentUpdate: (update) => set({ currentUpdate: update }),
  setSelectedFileName: (name) => set({ selectedFileName: name }),
  setSuccessStackLength: (length) => set({ successStackLength: length }),
  setErrorStackLength: (length) => set({ errorStackLength: length }),
  setGeneratedFilesCount: (count) => set({ generatedFilesCount: count }),

  setRunAction: (action) => set({ runAction: action }),
  setStopAction: (action) => set({ stopAction: action }),
  setClearHistoryAction: (action) => set({ clearHistoryAction: action }),
  setClearFileAction: (action) => set({ clearFileAction: action }),
}));
