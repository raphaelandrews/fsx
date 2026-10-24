import { TIER_SUGGESTION, XP } from "@fsx/api/gamification/constants";

import { InfoPopover } from "@/components/info-popover";

import { TIER_LABELS } from "./labels";

const { minPlayersA, fieldSize } = TIER_SUGGESTION;

const DESCRIPTIONS = [
  ["S", "Campeonatos Sergipanos: Absoluto, Feminino, Rápido, Blitz, Bullet e Equipes."],
  [
    "A",
    `Campo forte: ao menos ${minPlayersA} jogadores e média dos ${fieldSize} melhores ratings (antes do torneio) entre as mais altas dos torneios dos últimos 3 anos, no mesmo ritmo.`,
  ],
  ["B", "Demais torneios avaliados pela FSX."],
  ["school", "Eventos escolares, definidos por quem os organiza."],
] as const;

export function TierInfo() {
  return (
    <InfoPopover label="O que é o tier?" title="Tier do torneio">
      <p className="text-muted-foreground">
        O tier indica a importância do torneio. Ele define quanto um pódio vale no XP do jogador.
      </p>
      <dl className="space-y-2">
        {DESCRIPTIONS.map(([tier, text]) => (
          <div key={tier}>
            <dt className="flex items-baseline justify-between gap-2 font-medium">
              {TIER_LABELS[tier]}
              <span className="text-muted-foreground tabular-nums">× {XP.tierMultiplier[tier]}</span>
            </dt>
            <dd className="text-muted-foreground">{text}</dd>
          </div>
        ))}
      </dl>
    </InfoPopover>
  );
}
