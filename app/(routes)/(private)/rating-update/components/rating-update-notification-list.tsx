"use client";

import { ArrowUpRight, XCircle, CheckCircle2, Info } from "lucide-react";
import { motion, type Transition } from "motion/react";

import { useNotificationStore } from "@/app/(routes)/(private)/rating-update/hooks/notification-store";
import { Button } from "@/components/ui/button";
import { useNotificationDialogStore } from "@/app/(routes)/(private)/rating-update/hooks/notification-dialog-store";

const transition: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 26,
};

const textSwitchTransition: Transition = {
  duration: 0.22,
  ease: "easeInOut",
};

const notificationTextVariants = {
  collapsed: { opacity: 1, y: 0, pointerEvents: "auto" },
  expanded: { opacity: 0, y: -16, pointerEvents: "none" },
};

const viewAllTextVariants = {
  collapsed: { opacity: 0, y: 16, pointerEvents: "none" },
  expanded: { opacity: 1, y: 0, pointerEvents: "auto" },
};

export const getNotificationIcon = (type?: "success" | "error" | "info") => {
  switch (type) {
    case "success":
      return <CheckCircle2 className="size-3 text-green-500" />;
    case "error":
      return <XCircle className="size-3 text-red-500" />;
    default:
      return <Info className="size-3 text-blue-500" />;
  }
};

export function RatingUpdateNotificationList() {
  const { notifications } = useNotificationStore();
  const { open } = useNotificationDialogStore();
  const lastNotification = notifications[0];

  return (
    <motion.div
      className="absolute bottom-4 left-4 bg-background dark:bg-[#0F0F0F] p-2 rounded-2xl w-xs space-y-3 shadow-md"
      initial="collapsed"
      whileHover="expanded"
    >
      {!lastNotification ? (
        <div className="bg-card rounded-md px-4 py-2 shadow-sm">
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
        <div>
          <motion.div
            className="bg-secondary rounded-md px-4 py-2 shadow-sm hover:shadow-lg transition-shadow duration-200"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={transition}
          >
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-medium flex items-center gap-2">
                {getNotificationIcon(lastNotification.type)}
                {lastNotification.title}
              </h2>
            </div>
            <p className="text-xs text-neutral-500 font-medium">
              {lastNotification.subtitle}
            </p>
          </motion.div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <div className="size-5 rounded-sm bg-primary text-primary-foreground text-xs flex items-center justify-center font-medium">
          {notifications.length}
        </div>
        <span className="grid">
          <motion.span
            className="text-sm font-medium row-start-1 col-start-1"
            variants={notificationTextVariants}
            transition={textSwitchTransition}
          >
            Notifications
          </motion.span>
          <motion.span
            className="text-sm font-medium flex items-center gap-1 cursor-pointer select-none row-start-1 col-start-1"
            variants={viewAllTextVariants}
            transition={textSwitchTransition}
          >
            <Button
              variant="ghost"
              size="sm"
              className="flex items-center gap-1 text-sm font-medium h-5 p-0 hover:bg-transparent dark:hover:bg-transparent"
              onClick={open}
            >
              View all <ArrowUpRight className="size-4" />
            </Button>
          </motion.span>
        </span>
      </div>
    </motion.div>
  );
}
