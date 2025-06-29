import { create } from 'zustand';

interface DatabaseUpdateState {
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  runProcess: () => void;
  resetProcess: () => void;
  clearHistory: () => void;
  clearFile: () => void;
}

interface DatabaseUpdateActions {
  setRunAction: (action: () => void) => void;
  setResetAction: (action: () => void) => void;
  setClearHistoryAction: (action: () => void) => void;
  setClearFileAction: (action: () => void) => void;
}

export const useDatabaseUpdateStore = create<DatabaseUpdateState & DatabaseUpdateActions>((set) => ({
  isRunning: false,
  setIsRunning: (running) => set({ isRunning: running }),
  runProcess: () => console.warn("runProcess action not set"),
  resetProcess: () => console.warn("resetProcess action not set"),
  clearHistory: () => console.warn("clearHistory action not set"),
  clearFile: () => console.warn("clearFile action not set"),
  setRunAction: (action) => set({ runProcess: action }),
  setResetAction: (action) => set({ resetProcess: action }),
  setClearHistoryAction: (action) => set({ clearHistory: action }),
  setClearFileAction: (action) => set({ clearFile: action }),
}));