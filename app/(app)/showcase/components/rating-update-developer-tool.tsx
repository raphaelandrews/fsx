import React from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  PlayIcon,
  SquareIcon,
  Trash2Icon,
  StoreIcon,
  InfoIcon,
  FileTextIcon,
} from "lucide-react";

import { useRatingUpdateStore } from "../hooks/rating-update-store";
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
    successLogLength,
    errorLogLength,
    generatedFilesCount,
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
        <RulesPanel isVisible={activePanel === "rules" && !isTransitioning} />
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
                successLogLength > 0 ||
                errorLogLength > 0;
              if (isDisabled) {
                e.preventDefault();
                e.stopPropagation();
                if (isRunning) {
                  toast.info("Cannot run: A process is already running.");
                } else if (!selectedFileName) {
                  toast.error("Cannot run: Please select a file first.");
                } else if (successLogLength > 0 || errorLogLength > 0) {
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
                successLogLength > 0 ||
                errorLogLength > 0
              }
              className={
                isRunning ||
                !selectedFileName ||
                successLogLength > 0 ||
                errorLogLength > 0
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
                (successLogLength === 0 && errorLogLength === 0);
              if (isDisabled) {
                e.preventDefault();
                e.stopPropagation();
                if (isRunning) {
                  toast.info("Cannot clear history: A process is running.");
                } else if (successLogLength === 0 && errorLogLength === 0) {
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
                (successLogLength === 0 && errorLogLength === 0)
              }
              className={
                isRunning ||
                (successLogLength === 0 && errorLogLength === 0)
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
                isRunning || generatedFilesCount === 0;
              if (isDisabled) {
                e.preventDefault();
                e.stopPropagation();
                if (isRunning) {
                  toast.info("Cannot clear files: A process is running.");
                } else if (generatedFilesCount === 0) {
                  toast.info(
                    "Cannot clear files: No generated files to clear."
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
                isRunning || generatedFilesCount === 0 
              }
              className={
                isRunning || generatedFilesCount === 0 
                  ? "pointer-events-none"
                  : ""
              }
            >
              <Trash2Icon className="mr-2 size-4" />
              Clear Files
            </Button>
          </span>
        </div>

        <Separator className="mx-2 !w-0.5 !h-4" orientation="vertical" />
        <div className="flex gap-1">
          <ToolbarButton
            icon={FileTextIcon}
            isActive={activePanel === "rules"}
            onClick={() => handlePanelToggle("rules")}
          />
          <ToolbarButton
            icon={InfoIcon}
            isActive={activePanel === "info"}
            onClick={() => handlePanelToggle("info")}
          />
        </div>

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
  className,
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

const RulesPanel: React.FC<{ isVisible: boolean }> = ({ isVisible }) => {
  return (
    <div
      className={`
      fixed bottom-16 transform -translate-x-1/2 w-[400px] h-fit left-1/2 mb-0 p-8 border rounded-2xl backdrop-blur-sm shadow-xl transition-all duration-300 ease-out
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
            Regras de Atualização
          </h3>
        </div>
        <p>
          Esse sistema atualiza o rating dos torneios da FSX com base em
          planilhas excel (.xls ou .xlsx).
        </p>
        <p>
          O sistema reconhece automaticamente as colunas com dados de jogador
          (id, name, birth, sex, clubId e locationId) e dados de torneio
          (tournamentId, variation e ratingType).
        </p>
        <p>Colunas com outros nomes são ignoradas.</p>
        <p>
          A coluna ID é a única obrigatória, entretanto, é necessário que mais
          alguma coluna esteja presente no arquivo. Caso uma das três colunas de
          dados de torneio esteja presente, as outras duas também precisam
          estar.
        </p>
        <p>
          O Swiss Manager gera arquivos excel com os dados, basta copiar e colar
          no arquivo que será utilizado para upload.
        </p>
        <p>
          Para iniciar a atualização, basta fazer o upload do arquivo e clicar
          em "Run".
        </p>
        <p>
          É possível verificar quais atualizações deram certo ou errado. Caso a
          atualização seja bem-sucedida, serão retornados os dados que foram
          atualizados. Em caso de erro, será retornado o erro.
        </p>
      </article>
    </div>
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
