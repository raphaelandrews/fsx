import { create } from "zustand";

export interface Notification {
  id: string;
  title: string;
  subtitle: string;
  type?: "success" | "error" | "info";
}

interface NotificationStore {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, "id" | "time">) => void;
  clearNotifications: () => void;
}

export const useNotificationStore = create<NotificationStore>((set) => ({
  notifications: [],
  addNotification: (notification) =>
    set((state) => ({
      notifications: [
        {
          ...notification,
          id: crypto.randomUUID(),
        },
        ...state.notifications,
      ].slice(0, 20),
    })),
  clearNotifications: () => set({ notifications: [] }),
}));
