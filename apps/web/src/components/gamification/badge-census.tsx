import { useState } from "react";
import { HugeiconsIcon } from "@hugeicons/react";

import type { BadgeIcon, BadgeTier } from "@fsx/api/gamification/badges";

import { Tabs, TabsList, TabsTrigger } from "@fsx/ui/components/tabs";

import { Subheading } from "@/components/player/player-achievements";
import { formatShare } from "@/lib/format-share";

import { BADGE_ICONS, ProgressBar } from "./achievement-badge";
import { TIER_LABELS } from "./tier";

export interface CensusBadge {
  id: string;
  label: string;
  description: string;
  icon: BadgeIcon;
  tier: BadgeTier;
  holders: number;
}

const TIER_ORDER: BadgeTier[] = ["platinum", "gold", "silver", "bronze"];
const number = new Intl.NumberFormat("pt-BR");

export function BadgeCensus({ badges, players }: { badges: CensusBadge[]; players: number }) {
  const groups = TIER_ORDER.map((tier) => ({
    tier,
    badges: badges.filter((badge) => badge.tier === tier),
  })).filter((group) => group.badges.length > 0);
  const [selected, setSelected] = useState<BadgeTier | undefined>(groups[0]?.tier);
  const visible = groups.filter((group) => group.tier === selected);

  return (
    <div className="flex flex-col gap-6">
      <Tabs value={selected} onValueChange={(value) => setSelected(value as BadgeTier)} className="w-full">
        <div className="flex justify-center">
          <TabsList aria-label="Nível dos emblemas">
            {groups.map(({ tier, badges: tierBadges }) => (
              <TabsTrigger key={tier} value={tier}>
                {TIER_LABELS[tier]}
                <span className="ml-1.5 text-xs tabular-nums opacity-70">{tierBadges.length}</span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
      </Tabs>
      {visible.map(({ tier, badges: tierBadges }) => (
        <section key={tier} aria-labelledby={`badge-census-${tier}`}>
          <Subheading
            id={`badge-census-${tier}`}
            aside={`${tierBadges.filter((badge) => badge.holders > 0).length} de ${tierBadges.length} conquistados`}
          >
            {TIER_LABELS[tier]}
          </Subheading>
          <ul className="grid gap-2 sm:grid-cols-2">
            {tierBadges.map((badge) => {
              const share = players > 0 ? badge.holders / players : 0;
              return (
                <li key={badge.id} className="flex items-center gap-3 rounded-2xl border bg-background p-3">
                  <span
                    className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-muted"
                    aria-hidden
                  >
                    <HugeiconsIcon icon={BADGE_ICONS[badge.icon]} className="size-5" strokeWidth={1.75} />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-pretty font-semibold leading-tight">{badge.label}</span>
                      <span className="shrink-0 font-semibold tabular-nums">{formatShare(share)}</span>
                    </div>
                    <p className="text-pretty text-muted-foreground text-sm">{badge.description}</p>
                    <ProgressBar current={badge.holders} target={players} className="bg-muted" />
                    <span className="text-muted-foreground text-sm tabular-nums">
                      {badge.holders === 0
                        ? "Ninguém conquistou ainda"
                        : `${number.format(badge.holders)} ${badge.holders === 1 ? "jogador" : "jogadores"}`}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
