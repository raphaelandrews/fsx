import { type RatingType, RATING_LABELS_PT } from "@fsx/api/rating-types";
import { cn } from "@fsx/ui/lib/utils";

import { Movement } from "@/components/gamification/movement";

import type { PlayerRanking } from "./types";

export const RATING_FORMATS: { key: RatingType; label: string }[] = (["classic", "rapid", "blitz"] as const).map((key) => ({ key, label: RATING_LABELS_PT[key] }));

// The tiles double as the format selector for the evolution charts below.
export function RatingPicker({
  ratings,
  peaks,
  ranking,
  showFemale,
  selected,
  onSelect,
}: {
  ratings: Record<RatingType, number | null | undefined>;
  peaks: Record<RatingType, number | undefined>;
  ranking: PlayerRanking | null;
  showFemale: boolean;
  selected: RatingType;
  onSelect: (format: RatingType) => void;
}) {
  return (
    <div role="group" aria-label="Formato de rating" className="grid grid-cols-3 gap-2 px-2 sm:gap-4 sm:px-4">
      {RATING_FORMATS.map(({ key, label }) => {
        const value = ratings[key];
        const peak = peaks[key];
        const rank = ranking?.[key];
        const isSelected = selected === key;
        return (
          <button
            key={key}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onSelect(key)}
            className={cn(
              "flex h-full min-w-0 flex-col items-center justify-center gap-1 rounded-2xl bg-muted p-3 text-center outline-offset-2 transition-[background-color,box-shadow,scale] duration-200 ease-out focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.96] sm:p-4",
              isSelected ? "shadow-[inset_0_0_0_2px_var(--primary)]" : "hover:bg-accent",
            )}
          >
            <span className="font-medium text-foreground/70 text-sm">{label}</span>
            <span className="font-semibold text-xl tabular-nums sm:text-2xl">{value ?? "—"}</span>
            {peak !== undefined && value != null && peak > value && (
              <span className="text-foreground/70 text-xs tabular-nums">Pico {peak}</span>
            )}
            {ranking && (
              <span className="mt-1 flex flex-col items-center gap-0.5 border-t border-border pt-2 text-sm font-medium">
                <span className="inline-flex flex-wrap items-baseline justify-center gap-x-1">
                  Absoluto {rank ? `#${rank.position}` : "—"}
                  {rank && (
                    <>
                      <span className="sr-only"> de {rank.players} jogadores ativos</span>
                      <Movement value={rank.movement} />
                    </>
                  )}
                </span>
                {showFemale && (
                  <span className="text-muted-foreground">
                    Feminino {rank?.female ? `#${rank.female.position}` : "—"}
                    {rank?.female && <span className="sr-only"> de {rank.female.players} jogadoras ativas</span>}
                  </span>
                )}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
