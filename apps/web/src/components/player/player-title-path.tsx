import { HugeiconsIcon } from "@hugeicons/react";
import { CheckmarkCircle02Icon, HelpCircleIcon } from "@hugeicons/core-free-icons";

import type { TitleCheck, TitleGoal } from "@fsx/api/gamification/title-path";
import { cn } from "@fsx/ui/lib/utils";

import { ProgressBar } from "@/components/gamification/achievement-badge";

function Check({ check }: { check: TitleCheck }) {
  const counted = check.current !== null && check.target !== null;
  return (
    <li className="flex flex-col gap-1.5 py-2">
      <span className="flex items-center justify-between gap-3 text-base">
        <span className={cn("flex items-center gap-2", check.met === true ? "text-foreground" : "text-reading")}>
          {check.met === true ? (
            <HugeiconsIcon icon={CheckmarkCircle02Icon} className="size-4 shrink-0 text-success" aria-hidden />
          ) : check.met === null ? (
            <HugeiconsIcon icon={HelpCircleIcon} className="size-4 shrink-0 text-muted-foreground" aria-hidden />
          ) : (
            <span className="size-4 shrink-0 rounded-full border-2 border-border" aria-hidden />
          )}
          {check.label}
          <span className="sr-only">
            {check.met === true ? " (cumprido)" : check.met === null ? " (sem dados)" : " (pendente)"}
          </span>
        </span>
        {counted && (
          <span className="shrink-0 text-muted-foreground text-sm tabular-nums">
            {Math.min(check.current!, check.target!)} / {check.target}
          </span>
        )}
      </span>
      {counted && check.met !== true && <ProgressBar current={check.current!} target={check.target!} className="ml-6 bg-background" />}
    </li>
  );
}

export function PlayerTitlePath({ goals }: { goals: TitleGoal[] }) {
  if (goals.length === 0) return null;
  return (
    <div className="flex flex-col gap-3 px-3 pb-4">
      <ul className="grid gap-3 sm:grid-cols-2">
        {goals.map((goal) => (
          <li key={goal.shortName} className="rounded-2xl bg-muted p-4">
            <p className="flex items-baseline justify-between gap-2">
              <span className="font-semibold text-base">
                {goal.shortName} <span className="font-medium text-muted-foreground text-sm">· {goal.name}</span>
              </span>
              {goal.complete && (
                <span className="shrink-0 rounded-full bg-success/15 px-2 py-0.5 font-semibold text-success text-xs">
                  Requisitos atingidos
                </span>
              )}
            </p>
            <ul className="mt-2 divide-y">
              {goal.all.map((check) => (
                <Check key={check.label} check={check} />
              ))}
            </ul>
            {goal.anyOf.length > 0 && (
              <>
                <p className="mt-2 font-medium text-muted-foreground text-sm">E pelo menos um destes:</p>
                <ul className="divide-y">
                  {goal.anyOf.map((check) => (
                    <Check key={check.label} check={check} />
                  ))}
                </ul>
              </>
            )}
          </li>
        ))}
      </ul>
      <p className="text-muted-foreground text-sm">
        Estimativa não oficial, a partir dos dados registrados. Os títulos são concedidos pela diretoria da FSX; resultados
        de top 5 e campeonatos aprovados pela diretoria não entram na conta.
      </p>
    </div>
  );
}
