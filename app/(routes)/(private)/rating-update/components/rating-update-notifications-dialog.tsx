import { Info, Trash2Icon } from "lucide-react";

import { useNotificationDialogStore } from "@/lib/stores/notification-dialog-store";
import { useNotificationStore } from "@/lib/stores/notification-store";

import { getNotificationIcon } from "./rating-update-notification-list";
import {
  Drawer,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "./ui/drawer";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

export function RatingUpdateNotificationsDialog() {
  const { notifications, clearNotifications } = useNotificationStore();
  const { isOpen, close } = useNotificationDialogStore();

  return (
    <Drawer open={isOpen} onOpenChange={(open) => !open && close()}>
      <DrawerContent className="sm:max-w-[425px] bg-background dark:bg-[#0F0F0F]">
        <DrawerHeader>
          <DrawerTitle>Notifications</DrawerTitle>
        </DrawerHeader>
        <div className="px-4">
          {notifications.length === 0 ? (
            <div className="bg-card mb-4 rounded-md px-4 py-2 shadow-sm">
              <div className="flex items-center gap-2">
                <Info className="size-3 text-blue-500" />
                <h2 className="font-medium text-sm text-card-foreground">
                  No notifications
                </h2>
              </div>
              <div className="text-xs text-muted-foreground font-medium mt-1">
                Notifications will appear here
              </div>
            </div>
          ) : (
            <ScrollArea className="h-[258px]" hideScrollbar>
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="bg-secondary rounded-md px-4 py-2 shadow-sm"
                  >
                    <div className="flex justify-between items-center">
                      <h2 className="text-sm font-medium flex items-center gap-2">
                        {getNotificationIcon(notification.type)}
                        {notification.title}
                      </h2>
                    </div>
                    <p className="text-xs text-neutral-500 font-medium">
                      {notification.subtitle}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
        {notifications.length > 0 && (
          <DrawerFooter>
            <div className="flex justify-start">
              <Button
                variant="destructive"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => {
                  clearNotifications();
                  close();
                }}
              >
                <Trash2Icon size={14} />
                Clear all
              </Button>
            </div>
          </DrawerFooter>
        )}
      </DrawerContent>
    </Drawer>
  );
}
