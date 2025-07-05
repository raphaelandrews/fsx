"use client";

import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"; 

export function ViewportWarning() {
  const [showDialog, setShowDialog] = React.useState(false);

  React.useEffect(() => {
    const checkViewport = () => {
      const currentIsSmall = window.innerWidth < 1440;

      const acknowledged = sessionStorage.getItem(
        "viewportWarningAcknowledged"
      );

      setShowDialog(currentIsSmall && !acknowledged);
    };

    checkViewport();

    window.addEventListener("resize", checkViewport);

    return () => {
      window.removeEventListener("resize", checkViewport);
    };
  }, []);

  const handleAcknowledge = () => {
    sessionStorage.setItem("viewportWarningAcknowledged", "true");
    setShowDialog(false);
  };

  if (!showDialog) {
    return null;
  }

  return (
    <AlertDialog open={showDialog} onOpenChange={setShowDialog}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Viewport Recommendation</AlertDialogTitle>
        </AlertDialogHeader>
        <AlertDialogDescription>
          For the best experience, a viewport width of 1440px or wider is
          recommended for this route. You can continue, but some elements might
          not display optimally.
        </AlertDialogDescription>
        <AlertDialogFooter>
          <AlertDialogAction onClick={handleAcknowledge}>
            Continue
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
