"use client";

import * as React from "react";
import { toast } from "sonner";
import { RefreshCw } from "lucide-react";

import {
  revalidateTagAction,
  revalidateMultipleTagsAction,
} from "@/app/actions/revalidate-tag";

import { Button } from "@/components/ui/button";

interface RevalidateButtonProps {
  tag?: string;
  tags?: string[];
  children?: React.ReactNode;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function RevalidateButton({
  tag,
  tags,
  children,
  variant = "outline",
  size = "default",
  className,
}: RevalidateButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleRevalidate = async () => {
    if (!tag && !tags) {
      toast.error("Error", {
        description: "No tags specified for revalidation",
      });
      return;
    }

    setIsLoading(true);

    try {
      let result: { success: boolean; message: string } = {
        success: false,
        message: "",
      };

      if (tag) {
        result = await revalidateTagAction(tag);
      } else if (tags) {
        result = await revalidateMultipleTagsAction(tags);
      }

      if (result?.success) {
        toast.success("Success", {
          description: result.message,
        });
      } else {
        toast.error("Error", {
          description: result?.message || "Failed to revalidate",
        });
      }
    } catch (_error) {
      toast.error("Error", {
        description: "An unexpected error occurred",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button
      onClick={handleRevalidate}
      disabled={isLoading}
      variant={variant}
      size={size}
      className={className}
    >
      <RefreshCw
        className={`h-4 w-4 ${isLoading ? "animate-spin" : ""} ${
          children ? "mr-2" : ""
        }`}
      />
      {children ||
        (tag ? `Revalidate ${tag}` : `Revalidate ${tags?.length} tags`)}
    </Button>
  );
}
