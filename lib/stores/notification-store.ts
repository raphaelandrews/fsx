import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

export const useNotificationStore = create(
  persist<NotificationStore>(
    (set) => ({
      notifications: [],
      addNotification: (notification) =>
        set((state) => {
          const newNotifications = [
            { ...notification, id: crypto.randomUUID() },
            ...state.notifications,
          ];
          if (newNotifications.length > 20) {
            return { notifications: newNotifications.slice(0, 20) };
          }
          return { notifications: newNotifications };
        }),
      clearNotifications: () =>
        set({
          notifications: [],
        }),
    }),
    {
      name: 'notification-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);