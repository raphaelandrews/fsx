import type { PlayerLevel as Level } from "@fsx/api/gamification/level";
import { Popover, PopoverContent, PopoverTrigger } from "@fsx/ui/components/popover";

const SOURCES: [keyof Level["breakdown"], string][] = [
  ["tournaments", "Torneios disputados"],
  ["tournamentPodiums", "Pódios em torneios"],
  ["circuitResults", "Pódios em circuitos"],
  ["ratingThresholds", "Marcas de rating"],
  ["titles", "Títulos"],
];

const RULES: [string, string][] = [
  ["Torneio disputado", "15 XP"],
  ["Pódio em torneio (1º / 2º / 3º)", "60 / 40 / 25"],
  ["Pódio final de circuito", "40 / 25 / 15"],
  ["Pódio de etapa de circuito", "15 / 10 / 5"],
  ["Marca de rating (2000 a 2400)", "30 XP cada"],
  ["Título mais alto", "50 a 300 XP"],
];

export function PlayerLevel({ level }: { level: Level }) {
  const span = level.nextLevelXp - level.levelXp;
  const progress = Math.round(((level.xp - level.levelXp) / span) * 100);
  const sources = SOURCES.filter(([source]) => level.breakdown[source] > 0);
  return (
    <Popover>
      <PopoverTrigger
        aria-label={`Nível ${level.level}, ${level.xp} XP. Ver como é calculado.`}
        className="flex w-60 items-center gap-2.5 rounded-xl px-2 py-1.5 text-left outline-offset-2 transition-[background-color,scale] duration-150 ease-out hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring active:scale-[0.96]"
      >
        <span
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-primary font-semibold text-primary-foreground text-base tabular-nums"
          aria-hidden
        >
          {level.level}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1.5">
          <span className="flex items-baseline justify-between gap-2 text-sm">
            <span className="font-semibold">Nível {level.level}</span>
            <span className="text-muted-foreground tabular-nums">
              {level.xp} / {level.nextLevelXp} XP
            </span>
          </span>
          <span className="block h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
            <span className="block h-full animate-fill-x rounded-full bg-primary" style={{ width: `${progress}%` }} />
          </span>
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-[min(22rem,calc(100vw-2rem))] gap-3 p-3 text-base sm:w-[40rem] sm:max-w-[calc(100vw-2rem)] sm:grid sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)] sm:gap-x-6 sm:p-4">
        <div className="flex flex-col gap-3">
          <div>
            <p className="font-medium">Nível {level.level}</p>
            <p className="text-muted-foreground text-sm">
              Faltam <span className="tabular-nums">{level.nextLevelXp - level.xp}</span> XP para o nível {level.level + 1}.
            </p>
          </div>
          {sources.length > 0 ? (
            <dl className="space-y-2 text-sm">
              {sources.map(([source, label]) => (
                <div key={source} className="space-y-1">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium tabular-nums">{level.breakdown[source]} XP</dd>
                  </div>
                  <span className="block h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                    <span
                      className="block h-full rounded-full bg-primary/70"
                      style={{ width: `${(level.breakdown[source] / level.xp) * 100}%` }}
                    />
                  </span>
                </div>
              ))}
            </dl>
          ) : (
            <p className="text-muted-foreground text-sm">Dispute o primeiro torneio para começar a ganhar XP.</p>
          )}
        </div>
        <div className="border-t pt-3 sm:border-t-0 sm:border-l sm:pt-0 sm:pl-6">
          <p className="mb-2 font-medium text-sm">Como ganhar XP</p>
          <dl className="space-y-1.5 text-sm">
            {RULES.map(([label, value]) => (
              <div key={label} className="flex justify-between gap-3">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="shrink-0 whitespace-nowrap text-right font-medium tabular-nums">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-2 text-pretty text-muted-foreground text-sm">
            Pódios valem mais em eventos de maior nível, e metade em categorias. O XP vem do histórico registrado pela FSX.
          </p>
        </div>
      </PopoverContent>
    </Popover>
  );
}
