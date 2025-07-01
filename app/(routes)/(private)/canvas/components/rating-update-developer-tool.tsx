import React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  Maximize2,
  Upload,
  Bug,
  PlayIcon,
  SquareIcon,
  Trash2Icon,
  User,
  AtSign,
  Copy,
  Shield,
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
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isTransitioning]);

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-background dark:bg-[#0F0F0F] rounded-2xl shadow-md z-50">
      <div
        className={`fixed bottom-16 left-1/2 transform -translate-x-1/2 mb-0 rounded-2xl backdrop-blur-sm border overflow-hidden shadow-2xl transition-all duration-500 ease-out ${
          activePanel
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-4 opacity-0 scale-95 pointer-events-none h-0 "
        }`}
      >
        <div className="relative w-full h-full">
          {activePanel === "info" && (
            <InfoPanel isVisible={activePanel === "info" && !isTransitioning} />
          )}
        </div>
      </div>

      <div
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
          icon={Bug}
          isActive={activePanel === "issues"}
          onClick={() => handlePanelToggle("issues")}
        />
        <ToolbarButton
          icon={Maximize2}
          isActive={activePanel === "fullscreen"}
          onClick={() => handlePanelToggle("fullscreen")}
        />
        <ToolbarButton
          icon={Upload}
          isActive={activePanel === "share"}
          onClick={() => handlePanelToggle("share")}
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
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full" />
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
      inset-0 p-8 text-center transition-all duration-400 ease-out
      ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-2 scale-98 pointer-events-none"
      }
    `}
    >
      <div className="mb-6">
        <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 transition-all duration-300 hover:scale-110 hover:bg-gray-600">
          <Shield size={24} className="text-gray-300" />
        </div>
        <h2 className="text-white text-xl font-semibold mb-2 transition-all duration-300 hover:scale-105">
          Share Preview
        </h2>
        <p className="text-gray-400 text-sm leading-relaxed transition-colors duration-300">
          Choose who can comment on deployments for
          feature/additional-design-changes.
        </p>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Add team members or emails..."
          className="w-full bg-gray-700/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
        />
      </div>
    </div>
  );
};
