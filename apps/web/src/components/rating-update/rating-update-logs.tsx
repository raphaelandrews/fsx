import { motion, AnimatePresence } from "motion/react";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  AddCircleIcon,
  CakeIcon,
  CodeIcon,
  InformationCircleIcon,
  MapPinIcon,
  Medal01Icon,
  Store01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@fsx/ui/components/popover";
import { cn } from "@fsx/ui/lib/utils";

import type { PlayerDataFields, PlayerTournamentDataFields, RatingUpdateProps } from "./rating-update-types";

function formatDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  // Explicit timeZone to keep SSR/client consistent (server runs in UTC).
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  }).format(d);
}

type DataFieldsUnion = PlayerDataFields | { player: PlayerDataFields; playerTournament: PlayerTournamentDataFields };

function InfoRow({ icon, label, value }: { icon: Parameters<typeof HugeiconsIcon>[0]["icon"]; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <div className="bg-accent rounded-sm p-1">
        <HugeiconsIcon className="size-3.5" icon={icon} strokeWidth={2} />
      </div>
      <p className="text-foreground/60">
        {label}: {value}
      </p>
    </div>
  );
}

function SuccessDetail({ data }: { data: DataFieldsUnion }) {
  const player = "player" in data ? data.player : data;
  const tournament = "playerTournament" in data ? data.playerTournament : null;

  return (
    <>
      {player.id ? <InfoRow icon={UserIcon} label="ID" value={player.id} /> : null}
      {player.birth ? <InfoRow icon={CakeIcon} label="Birth" value={formatDate(player.birth)} /> : null}
      {player.sex != null ? <InfoRow icon={UserIcon} label="Sex" value={String(player.sex).toUpperCase()} /> : null}
      {player.clubId ? <InfoRow icon={Store01Icon} label="Club ID" value={player.clubId} /> : null}
      {player.locationId ? <InfoRow icon={MapPinIcon} label="Location ID" value={player.locationId} /> : null}
      {tournament ? (
        <>
          <InfoRow icon={Medal01Icon} label="Tournament ID" value={tournament.tournamentId} />
          <InfoRow icon={Medal01Icon} label="Variation" value={tournament.variation} />
          <InfoRow icon={Medal01Icon} label="Old Rating" value={tournament.oldRating} />
        </>
      ) : null}
    </>
  );
}

export function RatingUpdateLogs({ updates }: { updates: RatingUpdateProps[] }) {
  return (
    <div className="h-auto w-[450px] overflow-hidden p-2">
      <AnimatePresence mode="popLayout">
        <div className="space-y-3 relative">
          {updates.map((update, index) => (
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              initial={{ opacity: 0, x: 20 }}
              key={update._uuid}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <div className="bg-card shadow-md rounded-2xl flex items-center justify-between gap-5 p-2">
                <div className="flex items-center gap-2">
                  <div
                    className={cn(
                      "text-xs font-medium p-2 rounded-lg",
                      update.success
                        ? "bg-[#E8F5E9] text-[#388E3C] dark:bg-[#022C22] dark:text-[#1BC994]"
                        : "bg-[#FFEBEE] text-[#D32F2F] dark:bg-[#4D0217] dark:text-[#FF6982]",
                    )}
                  >
                    {update.status}
                  </div>
                  <p className="text-sm font-medium">{update.operation}</p>
                </div>
                {update.success || update.error ? (
                  <Popover>
                    <PopoverTrigger
                      render={
                        <button
                          type="button"
                          aria-label="View details"
                          className="bg-secondary text-secondary-foreground rounded-full p-2"
                        />
                      }
                    >
                      <HugeiconsIcon className="size-4" icon={AddCircleIcon} strokeWidth={2} />
                    </PopoverTrigger>
                    <PopoverContent className="max-w-96 w-auto overflow-auto flex flex-col gap-2 text-sm">
                      {update.success ? <SuccessDetail data={update.success.dataFields} /> : null}
                      {update.error ? (
                        <>
                          <InfoRow icon={InformationCircleIcon} label="Status" value={update.error.message} />
                          {update.error.stack ? <InfoRow icon={CodeIcon} label="Stack" value={update.error.stack} /> : null}
                        </>
                      ) : null}
                    </PopoverContent>
                  </Popover>
                ) : null}
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}
