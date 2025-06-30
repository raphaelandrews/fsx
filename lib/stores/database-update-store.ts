import { create } from 'zustand';

interface DatabaseUpdateState {
  isRunning: boolean;
  selectedFileName: string | null;
  successStackLength: number;
  errorStackLength: number;
  setIsRunning: (running: boolean) => void;
  runProcess: () => void;
  stopProcess: () => void;
  clearHistory: () => void;
  clearFile: () => void;
}

interface DatabaseUpdateActions {
  setSelectedFileName: (fileName: string | null) => void;
  setSuccessStackLength: (length: number) => void;
  setErrorStackLength: (length: number) => void;
  setRunAction: (action: () => void) => void;
  setStopAction: (action: () => void) => void;
  setClearHistoryAction: (action: () => void) => void;
  setClearFileAction: (action: () => void) => void;
}

export const useDatabaseUpdateStore = create<DatabaseUpdateState & DatabaseUpdateActions>((set) => ({
  isRunning: false,
  selectedFileName: null,
  successStackLength: 0,
  errorStackLength: 0,
  setIsRunning: (running) => set({ isRunning: running }),
  setSelectedFileName: (fileName: string | null) => set({ selectedFileName: fileName }),
  setSuccessStackLength: (length) => set({ successStackLength: length }),
  setErrorStackLength: (length) => set({ errorStackLength: length }),
  runProcess: () => console.warn("runProcess action not set"),
  stopProcess: () => console.warn("stopProcess action not set"),
  clearHistory: () => console.warn("clearHistory action not set"),
  clearFile: () => console.warn("clearFile action not set"),
  setRunAction: (action) => set({ runProcess: action }),
  setStopAction: (action) => set({ stopProcess: action }),
  setClearHistoryAction: (action) => set({ clearHistory: action }),
  setClearFileAction: (action) => set({ clearFile: action }),
}));