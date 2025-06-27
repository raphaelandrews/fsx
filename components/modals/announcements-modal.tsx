import React from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Props {
  year: number;
  number: string;
  content: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AnnouncementsModal({
  number,
  content,
  onOpenChange,
  open,
}: Props) {
  const modalRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onOpenChange(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onOpenChange(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    document.body.classList.add("overflow-hidden");

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
      document.body.classList.remove("overflow-hidden");
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/90 backdrop-blur-sm"
      data-theme="dark"
    >
      <div
        ref={modalRef}
        className="relative w-[calc(100vw-2rem)] max-w-[500px]"
        aria-describedby="announcement-content"
      >
        <div className="flex flex-col gap-4 p-6 border rounded-lg border-border bg-background shadow-lg">
          <header className="flex justify-between items-center gap-4">
            <h2 className="text-lg font-semibold">
              Comunicado FSX nº {number}
            </h2>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="size-8 p-0 hover:bg-transparent"
              aria-label="Fechar comunicado"
            >
              <X className="size-4" />
            </Button>
          </header>
          <div className="prose prose-sm text-muted-foreground">{content}</div>
        </div>
      </div>
    </div>
  );
}
