import React from "react";
import {
  Archive,
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
} from "lucide-react";
import { toast } from "sonner";

import { useDatabaseUpdateStore } from "@/lib/stores/database-update-store";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";

interface ToolbarButtonProps {
  icon: React.ElementType;
  isActive?: boolean;
  onClick: () => void;
  className?: string;
}

export function DatabaseUpdateDeveloperTool() {
  const {
    isRunning,
    runProcess,
    stopProcess,
    clearHistory,
    clearFile,
    selectedFileName,
    successStackLength,
    errorStackLength,
  } = useDatabaseUpdateStore();

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

  const getPanelHeight = () => {
    switch (activePanel) {
      case "notification":
        return "h-48";
      case "accessibility":
        return "h-64";
      case "issues":
        return "h-72";
      case "share":
        return "h-80";
      default:
        return "h-0";
    }
  };

  return (
    <div
      className={`fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-background dark:bg-[#0F0F0F] ${
        activePanel ? "rounded-b-xl border-t-0" : "rounded-xl"
      } shadow-md z-50`}
    >
      <div
        className={`absolute bottom-full left-1/2 transform -translate-x-1/2 mb-0 backdrop-blur-sm border max-w-md w-full overflow-hidden shadow-2xl transition-all duration-500 ease-out ${
          activePanel
            ? `translate-y-0 opacity-100 scale-100 rounded-t-xl rounded-bl-none rounded-br-none ${getPanelHeight()}`
            : "translate-y-4 opacity-0 scale-95 pointer-events-none h-0 rounded-xl"
        }`}
      >
        <div className="relative w-full h-full">
          <NotificationPanel
            isVisible={activePanel === "notification" && !isTransitioning}
          />
          <AccessibilityPanel
            isVisible={activePanel === "accessibility" && !isTransitioning}
          />
          <IssuesPanel
            isVisible={activePanel === "issues" && !isTransitioning}
          />
          <SharePanel isVisible={activePanel === "share" && !isTransitioning} />
        </div>
      </div>

      <div
        className={`flex items-center justify-center px-4 py-2 transition-all duration-500 ease-out ${
          activePanel ? "rounded-b-xl border-t-0" : "rounded-xl"
        }`}
      >
        <ToolbarButton
          icon={Archive}
          isActive={activePanel === "notification"}
          onClick={() => handlePanelToggle("notification")}
        />

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
                } else if (successStackLength > 0 || errorStackLength > 0) {
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

const NotificationPanel: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  return (
    <div
      className={`
      absolute inset-0 p-6 transition-all duration-400 ease-out
      ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-2 scale-98 pointer-events-none"
      }
    `}
    >
      <div className="flex items-center space-x-3 mb-4">
        <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center transition-transform duration-300 hover:scale-110">
          <User size={16} className="text-white" />
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-white font-medium">Jonas</span>
            <Copy
              size={14}
              className="text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
            />
            <AtSign
              size={14}
              className="text-gray-400 hover:text-gray-300 transition-colors cursor-pointer"
            />
          </div>
        </div>
      </div>

      <div className="text-gray-300 text-sm mb-6 leading-relaxed">
        The contrast ratio on this isn't passing AA contrast.
      </div>

      <div className="text-center">
        <Button className="text-white font-medium hover:text-gray-300 transition-all duration-300 hover:scale-105">
          View All
        </Button>
      </div>
    </div>
  );
};

const AccessibilityPanel: React.FC<{ isVisible: boolean }> = ({
  isVisible,
}) => {
  const issues = [
    {
      type: "advisory" as const,
      selector: 'div[data-color="var(--ds-blue-600)"]',
      description: ".cursor_cursorName__GrFIA",
      className: "text-blue-400",
    },
    {
      type: "warning" as const,
      selector: 'div[data-color="var(--ds-red-700)"]',
      description: ".cursor_cursorName__GrFIA",
      className: "text-red-400",
    },
  ];

  return (
    <div
      className={`
      absolute inset-0 p-6 transition-all duration-400 ease-out
      ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-2 scale-98 pointer-events-none"
      }
    `}
    >
      <div className="flex items-center space-x-6 mb-6">
        <div className="flex items-center space-x-2 transition-all duration-300 hover:scale-105">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-gray-300 text-sm">Advisory</span>
        </div>
        <div className="flex items-center space-x-2 transition-all duration-300 hover:scale-105">
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
          <span className="text-gray-300 text-sm">Warning</span>
        </div>
        <div className="flex items-center space-x-2 transition-all duration-300 hover:scale-105">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-gray-300 text-sm">Serious</span>
        </div>
      </div>

      <div className="space-y-4">
        {issues.map((issue, index) => (
          <div
            key={crypto.randomUUID()}
            className="space-y-1 transition-all duration-300 hover:bg-gray-700/30 p-2 rounded-lg"
            style={{
              animationDelay: isVisible ? `${index * 100}ms` : "0ms",
              transitionDelay: isVisible ? `${index * 50}ms` : "0ms",
            }}
          >
            <div
              className={`font-mono text-sm ${issue.className} transition-colors duration-300`}
            >
              {issue.selector}
            </div>
            <div className="text-orange-400 text-sm font-mono ml-4 transition-colors duration-300">
              {issue.description}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const IssuesPanel: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  const issues = [
    {
      severity: 0.03,
      selector: "div.Home_cause_kdmgGl",
      description: "became taller and shifting another element",
      color: "border-green-500 text-green-400",
    },
    {
      severity: 0.12,
      selector: "div.phase-2",
      description: "was added and shifted 2 other elements",
      color: "border-orange-500 text-orange-400",
    },
  ];

  return (
    <div
      className={`
      absolute inset-0 p-6 transition-all duration-400 ease-out
      ${
        isVisible
          ? "opacity-100 translate-y-0 scale-100"
          : "opacity-0 translate-y-2 scale-98 pointer-events-none"
      }
    `}
    >
      <div className="flex items-center space-x-6 mb-6">
        <span className="text-white font-medium transition-all duration-300 hover:scale-105">
          All
        </span>
        <div className="flex items-center space-x-2 transition-all duration-300 hover:scale-105">
          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          <span className="text-gray-300 text-sm">0.01</span>
        </div>
        <div className="flex items-center space-x-2 transition-all duration-300 hover:scale-105">
          <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse" />
          <span className="text-gray-300 text-sm">0.10</span>
        </div>
        <div className="flex items-center space-x-2 transition-all duration-300 hover:scale-105">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          <span className="text-gray-300 text-sm">0.25</span>
        </div>
      </div>

      <div className="space-y-4">
        {issues.map((issue, index) => (
          <div
            key={crypto.randomUUID()}
            className="flex items-start space-x-3 transition-all duration-300 hover:bg-gray-700/30 p-2 rounded-lg"
            style={{
              animationDelay: isVisible ? `${index * 150}ms` : "0ms",
              transitionDelay: isVisible ? `${index * 75}ms` : "0ms",
            }}
          >
            <div
              className={`w-8 h-8 rounded-full border-2 ${issue.color} flex items-center justify-center text-xs font-mono transition-all duration-300 hover:scale-110`}
            >
              .{String(issue.severity).slice(1)}
            </div>
            <div className="flex-1">
              <div className="text-blue-400 font-mono text-sm mb-1 transition-colors duration-300 hover:text-blue-300">
                {issue.selector}
              </div>
              <div className="text-gray-400 text-sm transition-colors duration-300">
                {issue.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const SharePanel: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  return (
    <div
      className={`
      absolute inset-0 p-8 text-center transition-all duration-400 ease-out
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
