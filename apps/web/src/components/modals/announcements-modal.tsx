import { type Dispatch, type SetStateAction, useEffect, useRef } from "react";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

interface Props {
  year: number;
  number: number;
  content: string;
  setIsOpen: Dispatch<SetStateAction<boolean>>;
  handleClick: () => void;
}

const AnnouncementsModal = ({
  number,
  content,
  handleClick,
  setIsOpen,
}: Props) => {
  const modalRef = useRef<HTMLDivElement>(null);

  // biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.body.classList.add("overflow-hidden");
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.classList.remove("overflow-hidden");
    };
  }, [modalRef]);

  return (
    <div className="fixed flex justify-center items-center w-screen h-screen top-0 bottom-0 left-0 right-0 bg-black/90 z-50">
      <div ref={modalRef} className="relative max-w-[500px] w-11/12">
        <div className="flex h-full w-full flex-col p-6 border rounded-md border-border bg-background overflow-hidden shadow-md">
          <div className="flex justify-between items-center">
            <p className="font-semibold text-sm">Comunicado FSX nº {number}</p>
            <Button
              variant="ghost"
              onClick={handleClick}
              className="h-auto p-0 hover:bg-transparent"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-3">{content}</p>
        </div>
      </div>
    </div>
  );
};

export default AnnouncementsModal;
