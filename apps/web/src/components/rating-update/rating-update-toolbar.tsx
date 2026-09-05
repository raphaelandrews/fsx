"use client";

import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Delete01Icon,
  File02Icon,
  Home01Icon,
  InformationCircleIcon,
  PlayIcon,
  SquareIcon,
} from "@hugeicons/core-free-icons";

import { Button } from "@fsx/ui/components/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@fsx/ui/components/tooltip";
import { Separator } from "@fsx/ui/components/separator";
import { cn } from "@fsx/ui/lib/utils";

interface ToolbarProps {
  isRunning: boolean;
  selectedFileName: string | null;
  hasLogs: boolean;
  onRun: () => void;
  onStop: () => void;
  onClearHistory: () => void;
  onClearFile: () => void;
}

export function RatingUpdateToolbar({
  isRunning,
  selectedFileName,
  hasLogs,
  onRun,
  onStop,
  onClearHistory,
  onClearFile,
}: ToolbarProps) {
  const [activePanel, setActivePanel] = useState<"rules" | "info" | null>(null);

  const togglePanel = (panel: "rules" | "info") =>
    setActivePanel((current) => (current === panel ? null : panel));

  const canRun = !isRunning && !!selectedFileName && !hasLogs;
  const canClearHistory = !isRunning && hasLogs;
  const canClearFile = !isRunning && !!selectedFileName && !hasLogs;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      {activePanel === "rules" ? <RulesPanel /> : null}
      {activePanel === "info" ? <InfoPanel /> : null}

      <div className="bg-background dark:bg-[#0F0F0F] shadow-md rounded-2xl flex items-center justify-center px-3 py-2">
        <Tooltip>
          <TooltipTrigger render={<Button aria-label="Home" size="sm" variant="ghost" className="p-2" />}>
            <HugeiconsIcon className="size-4" icon={Home01Icon} strokeWidth={2} />
          </TooltipTrigger>
          <TooltipContent>
            <p>Home</p>
          </TooltipContent>
        </Tooltip>

        <Separator className="mx-2 !h-4 !w-0.5" orientation="vertical" />

        <div className="flex gap-2">
          <Button onClick={onRun} disabled={!canRun} size="sm">
            <HugeiconsIcon className="mr-2 size-4" icon={PlayIcon} strokeWidth={2} />
            Run
          </Button>
          <Button onClick={onStop} disabled={!isRunning} size="sm" variant="outline">
            <HugeiconsIcon className="mr-2 size-4" icon={SquareIcon} strokeWidth={2} />
            Stop
          </Button>
          <Button onClick={onClearHistory} disabled={!canClearHistory} size="sm" variant="destructive">
            <HugeiconsIcon className="mr-2 size-4" icon={Delete01Icon} strokeWidth={2} />
            Clear History
          </Button>
          <Button onClick={onClearFile} disabled={!canClearFile} size="sm" variant="outline">
            <HugeiconsIcon className="mr-2 size-4" icon={Delete01Icon} strokeWidth={2} />
            Clear File
          </Button>
        </div>

        <Separator className="mx-2 !h-4 !w-0.5" orientation="vertical" />

        <div className="flex gap-1">
          <ToolbarButton label="Rules" isActive={activePanel === "rules"} onClick={() => togglePanel("rules")} />
          <ToolbarButton label="Info" isActive={activePanel === "info"} onClick={() => togglePanel("info")} />
        </div>
      </div>
    </div>
  );
}

function ToolbarButton({ label, isActive, onClick }: { label: string; isActive: boolean; onClick: () => void }) {
  const Icon = label === "Rules" ? File02Icon : InformationCircleIcon;
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn("relative p-2", isActive && "bg-accent")}
    >
      <HugeiconsIcon className="size-4 text-muted-foreground" icon={Icon} strokeWidth={2} />
      <span className="sr-only">{label}</span>
      {isActive && <span className="absolute -top-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-foreground" />}
    </Button>
  );
}

function PanelCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="fixed bottom-16 left-1/2 mb-0 w-fit max-w-[520px] -translate-x-1/2 rounded-2xl border p-8 shadow-xl backdrop-blur-sm">
      <article className="[&>p]:mt-1.5 [&>p]:text-sm [&>p]:leading-6 [&>p]:text-foreground/70">
        <div className="mb-2 flex flex-col items-center gap-2">
          <div className="bg-secondary rounded-sm p-1">
            <HugeiconsIcon className="size-4" icon={InformationCircleIcon} strokeWidth={2} />
          </div>
          <h3 className="font-medium text-balance text-center">{title}</h3>
        </div>
        {children}
      </article>
    </div>
  );
}

function RulesPanel() {
  return (
    <PanelCard title="Update Rules">
      <p>This system updates the FSX tournament ratings based on Excel files (.xls or .xlsx).</p>
      <p>
        The system automatically recognizes columns with player data (id, name, birth, sex, clubId and
        locationId) and tournament data (tournamentId, variation and ratingType).
      </p>
      <p>Columns with other names are ignored.</p>
      <p>
        The ID column is the only mandatory one; however, at least one other column must be present. If a
        tournament data column is present, the other two must also be present.
      </p>
      <p>Swiss Manager generates Excel files with the data; just copy and paste into the file to upload.</p>
      <p>To start the update, upload the file and click &quot;Run&quot;.</p>
    </PanelCard>
  );
}

function InfoPanel() {
  return (
    <PanelCard title="Rating update process">
      <p>This workflow simulates the rating update process of the Sergipe Chess Federation.</p>
      <p>The rating variation used in the process is calculated by Swiss Manager.</p>
      <p>Swiss Manager uses a &quot;K&quot; variable to calculate the rating variation.</p>
      <p>The FSX technical rules contain the &quot;K&quot; values for each situation.</p>
    </PanelCard>
  );
}
