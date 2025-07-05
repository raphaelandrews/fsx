import { create } from "zustand";

type AnimationState = "initializing" | "ready" | "busy" | "stop" | "x" | "add" |"saving" | "syncing" | "searching";

interface RatingUpdateStatusStore {
  statusText: string;
  animationState: AnimationState;
  setMotionGridStatus: (text: string, animation: AnimationState) => void;
}

export const useRatingUpdateStatusStore = create<RatingUpdateStatusStore>((set) => ({
  statusText: "Ready to start",
  animationState: "ready",
  setMotionGridStatus: (text, animation) => set({ statusText: text, animationState: animation }),
}));
