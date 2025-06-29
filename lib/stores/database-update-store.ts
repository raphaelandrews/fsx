import { create } from 'zustand';

// Define the state and actions that will be managed by the store
interface DatabaseUpdateState {
  isRunning: boolean;
  setIsRunning: (running: boolean) => void;
  // These are the functions that will be called by components like DeveloperTool
  runProcess: () => void;
  resetProcess: () => void;
  clearHistory: () => void;
  clearFile: () => void;
}

// Define actions to set the actual implementation of the above functions
// This pattern is used when the actual logic for the actions lives in a component
// (e.g., database-update.tsx) and depends on component-specific state/refs.
interface DatabaseUpdateActions {
  setRunAction: (action: () => void) => void;
  setResetAction: (action: () => void) => void;
  setClearHistoryAction: (action: () => void) => void;
  setClearFileAction: (action: () => void) => void;
}

// Create the Zustand store
export const useDatabaseUpdateStore = create<DatabaseUpdateState & DatabaseUpdateActions>((set) => ({
  // Initial state
  isRunning: false,
  setIsRunning: (running) => set({ isRunning: running }),

  // Placeholder functions for actions. These will be replaced by the actual
  // implementations from the DatabaseUpdate component.
  runProcess: () => console.warn("runProcess action not set"),
  resetProcess: () => console.warn("resetProcess action not set"),
  clearHistory: () => console.warn("clearHistory action not set"),
  clearFile: () => console.warn("clearFile action not set"),

  // Actions to set the actual function implementations
  setRunAction: (action) => set({ runProcess: action }),
  setResetAction: (action) => set({ resetProcess: action }),
  setClearHistoryAction: (action) => set({ clearHistory: action }),
  setClearFileAction: (action) => set({ clearFile: action }),
}));