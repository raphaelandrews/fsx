import React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  PlayIcon,
  SquareIcon,
  Trash2Icon,
  StoreIcon,
  InfoIcon,
} from "lucide-react";

import { useRatingUpdateStore } from "@/lib/stores/rating-update-store";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ModeSwitcher } from "@/components/mode-switcher";

interface ToolbarButtonProps {
  icon: React.ElementType;
  isActive?: boolean;
  onClick: () => void;
  className?: string;
}

export function RatingUpdateDeveloperTool() {
  const {
    isRunning,
    runProcess,
    stopProcess,
    clearHistory,
    clearFile,
    selectedFileName,
    successStackLength,
    errorStackLength,
  } = useRatingUpdateStore();

  const [activePanel, setActivePanel] = React.useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = React.useState(false);

  const handlePanelToggle = (panelName: string) => {
    if (activePanel === panelName) {
      setActivePanel(null);
    } else {
      setIsTransitioning(true);
      setActivePanel(panelName);
    }
  };

  React.useEffect(() => {
    if (isTransitioning) {
      const timer = setTimeout(() => {
        setIsTransitioning(false);
      });
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  const panelRef = React.useRef<HTMLDivElement>(null);
  const toolbarRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        activePanel &&
        panelRef.current &&
        toolbarRef.current &&
        !panelRef.current.contains(event.target as Node) &&
        !toolbarRef.current.contains(event.target as Node)
      ) {
        setActivePanel(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [activePanel]);

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-background dark:bg-[#0F0F0F] rounded-2xl shadow-md z-50">
      <div ref={panelRef}>
        <InfoPanel isVisible={activePanel === "info" && !isTransitioning} />
      </div>

      <div
        ref={toolbarRef}
        className="flex items-center justify-center px-3 py-2 rounded-2xl transition-all duration-500 ease-out"
      >
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="ghost" className="p-2">
              <Link href="/" prefetch={false}>
                <StoreIcon size={16} />
                <span className="sr-only">FSX</span>
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>Home</p>
          </TooltipContent>
        </Tooltip>

        <Separator className="mx-2 !w-0.5 !h-4" orientation="vertical" />

        <div className="flex gap-2">
          <span
            className="inline-block"
            onPointerDown={(e) => {
              const isDisabled =
                isRunning ||
                !selectedFileName ||
                successStackLength > 0 ||
                errorStackLength > 0;
              if (isDisabled) {
                e.preventDefault();
                e.stopPropagation();
                if (isRunning) {
                  toast.info("Cannot run: A process is already running.");
                } else if (!selectedFileName) {
                  toast.info("Cannot run: Please select a file first.");
                } else if (successStackLength > 0 || errorStackLength > 0) {
                  toast.info(
                    "Cannot run: Please clear the success and error history."
                  );
                }
              }
            }}
          >
            <Button
              size="sm"
              onClick={runProcess}
              disabled={
                isRunning ||
                !selectedFileName ||
                successStackLength > 0 ||
                errorStackLength > 0
              }
              className={
                isRunning ||
                !selectedFileName ||
                successStackLength > 0 ||
                errorStackLength > 0
                  ? "pointer-events-none"
                  : ""
              }
            >
              <PlayIcon className="mr-2 size-4" />
              Run
            </Button>
          </span>

          <span
            className="inline-block"
            onPointerDown={(e) => {
              const isDisabled = !isRunning;
              if (isDisabled) {
                e.preventDefault();
                e.stopPropagation();
                toast.info("Cannot stop: No process is currently running.");
              }
            }}
          >
            <Button
              size="sm"
              variant="outline"
              onClick={stopProcess}
              disabled={!isRunning}
              className={!isRunning ? "pointer-events-none" : ""}
            >
              <SquareIcon className="mr-2 size-4" />
              Stop
            </Button>
          </span>

          <span
            className="inline-block"
            onPointerDown={(e) => {
              const isDisabled =
                isRunning ||
                (successStackLength === 0 && errorStackLength === 0);
              if (isDisabled) {
                e.preventDefault();
                e.stopPropagation();
                if (isRunning) {
                  toast.info("Cannot clear history: A process is running.");
                } else if (successStackLength === 0 && errorStackLength === 0) {
                  toast.info(
                    "Cannot clear history: No successful or error updates to clear."
                  );
                }
              }
            }}
          >
            <Button
              size="sm"
              variant="destructive"
              onClick={clearHistory}
              disabled={
                isRunning ||
                (successStackLength === 0 && errorStackLength === 0)
              }
              className={
                isRunning ||
                (successStackLength === 0 && errorStackLength === 0)
                  ? "pointer-events-none"
                  : ""
              }
            >
              <Trash2Icon className="mr-2 size-4" />
              Clear History
            </Button>
          </span>

          <span
            className="inline-block"
            onPointerDown={(e) => {
              const isDisabled =
                isRunning ||
                !selectedFileName ||
                successStackLength > 0 ||
                errorStackLength > 0;
              if (isDisabled) {
                e.preventDefault();
                e.stopPropagation();
                if (isRunning) {
                  toast.info("Clear File: A process is running.");
                } else if (!selectedFileName) {
                  toast.info("Clear File: Please select a file first.");
                } else if (successStackLength > 0 || errorStackLength > 0) {
                  toast.info(
                    "Clear File: Please clear the success and error history."
                  );
                }
              }
            }}
          >
            <Button
              size="sm"
              variant="outline"
              onClick={clearFile}
              disabled={
                isRunning ||
                !selectedFileName ||
                successStackLength > 0 ||
                errorStackLength > 0
              }
              className={
                isRunning ||
                !selectedFileName ||
                successStackLength > 0 ||
                errorStackLength > 0
                  ? "pointer-events-none"
                  : ""
              }
            >
              <Trash2Icon className="mr-2 size-4" />
              Clear File
            </Button>
          </span>
        </div>

        <Separator className="mx-2 !w-0.5 !h-4" orientation="vertical" />

        <ColorPicker
          isActive={activePanel === "accessibility"}
          onClick={() => handlePanelToggle("accessibility")}
        />
        <ToolbarButton
          icon={InfoIcon}
          isActive={activePanel === "info"}
          onClick={() => handlePanelToggle("info")}
        />

        <Separator className="mx-2 !w-0.5 !h-4" orientation="vertical" />

        <ModeSwitcher />
      </div>
    </div>
  );
}

const ToolbarButton: React.FC<ToolbarButtonProps> = ({
  icon: Icon,
  isActive = false,
  onClick,
  className = "",
}) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`
        relative p-2
        ${isActive ? "bg-accent" : "bg-transparent"}
        ${className}
      `}
    >
      <Icon size={16} className="text-gray-300" />
      {isActive && (
        <div className="absolute -top-1.5 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
      )}
    </Button>
  );
};

const ColorPicker: React.FC<{ isActive?: boolean; onClick?: () => void }> = ({
  isActive = false,
  onClick,
}) => {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={`
        relative p-2
        ${isActive ? "bg-accent" : "bg-transparent"}
      `}
    >
      <div className="flex items-center space-x-1">
        <div className="w-4 h-4 bg-teal-500 rounded-full transition-transform duration-300 hover:scale-110" />
        <div className="w-4 h-4 bg-amber-500 rounded-full -ml-2 transition-transform duration-300 hover:scale-110" />
        <div className="w-4 h-4 bg-rose-500 rounded-full -ml-2 transition-transform duration-300 hover:scale-110" />
      </div>
      {isActive && (
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
      )}
    </Button>
  );
};

const InfoPanel: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  return (
    <div
      className={`
      fixed bottom-16 transform -translate-x-1/2 w-fit h-fit left-1/2 mb-0 p-8 border rounded-2xl backdrop-blur-sm shadow-xl transition-all duration-300 ease-out
      ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-2 scale-98 pointer-events-none"
      }
    `}
    >
      <article className="[&>p]:text-sm [&>p]:text-foreground/70 [&>p]:mt-1.5 [&>p]:leading-6">
        <div className="flex flex-col items-center gap-2 mb-2">
          <InfoIcon className=" p-1 rounded-sm bg-secondary" />
          <h3 className="font-medium text-balance text-center">
            Processo de atualização de rating
          </h3>
        </div>
        <p>
          Esse workflow simula o processo de atualização de rating da Federação
          Sergipana de Xadrez.
        </p>
        <p>
          A variação de rating utilizada no processo é calculada pelo Swiss
          Manager, programa utilizado pela FSX nos torneios.
        </p>
        <p>
          O Swiss Manager utiliza uma variável "K" no cálculo da variação de
          rating.
        </p>
        <p>
          Nas{" "}
          <a
            href="/normas-tecnicas"
            className="text-blue-500 underline underline-offset-2"
          >
            normas técnicas
          </a>{" "}
          da FSX, estão disponíveis os valores do "K" para cada situação.
        </p>
      </article>
    </div>
  );
};
