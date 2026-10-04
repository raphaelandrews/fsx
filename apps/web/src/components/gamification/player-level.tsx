import type { PlayerLevel as Level } from "@fsx/api/gamification/level";
import { Popover, PopoverContent, PopoverTrigger } from "@fsx/ui/components/popover";

const SOURCES: [keyof Level["breakdown"], string][] = [
  ["tournaments", "Torneios disputados"],
  ["tournamentPodiums", "Pódios em torneios"],
  ["circuitPodiums", "Pódios em circuitos"],
  ["ratingThresholds", "Marcas de rating"],
  ["titles", "Títulos"],
];

export function PlayerLevel({ level }: { level: Level }) {
  const span = level.nextLevelXp - level.levelXp;
  const progress = Math.round(((level.xp - level.levelXp) / span) * 100);
  return (
    <Popover>
      <PopoverTrigger
        aria-label={`Nível ${level.level}, ${level.xp} XP. Ver como é calculado.`}
        className="flex w-48 flex-col gap-1 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring"
      >
        <span className="flex items-baseline justify-between text-xs">
          <span className="font-semibold">Nível {level.level}</span>
          <span className="text-muted-foreground tabular-nums">
            {level.xp} / {level.nextLevelXp} XP
          </span>
        </span>
        <span className="block h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
          <span className="block h-full rounded-full bg-primary" style={{ width: `${progress}%` }} />
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-72 space-y-3 p-3 text-sm">
        <div>
          <p className="font-medium">Nível {level.level}</p>
          <p className="text-muted-foreground text-xs">
            Faltam {level.nextLevelXp - level.xp} XP para o nível {level.level + 1}.
          </p>
        </div>
        <dl className="space-y-1 text-xs">
          {SOURCES.map(([source, label]) => (
            <div key={source} className="flex justify-between gap-2">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="tabular-nums">{level.breakdown[source]} XP</dd>
            </div>
          ))}
        </dl>
        <p className="text-muted-foreground text-xs">
          15 XP por torneio; pódios valem 60/40/25 (circuitos 40/25/15, etapas 15/10/5), conforme a
          importância do evento, e metade em categorias; 30 XP por marca de rating (2000 a 2400);
          o título mais alto vale de 50 a 300. O XP vem do histórico registrado pela FSX.
        </p>
      </PopoverContent>
    </Popover>
  );
}
