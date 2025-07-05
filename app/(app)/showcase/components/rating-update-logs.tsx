"use client";

import { format } from "date-fns";
import { motion, AnimatePresence } from "framer-motion";
import {
  CakeIcon,
  CirclePlusIcon,
  InfoIcon,
  MapPinnedIcon,
  MessageSquareIcon,
  RewindIcon,
  StoreIcon,
  TrendingUpDownIcon,
  TrophyIcon,
  UserIcon,
  VenusAndMarsIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

import type {
  PlayerDataFields,
  PlayerTournamentDataFields,
  RatingUpdateProps,
} from "./rating-update-types";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type RatingUpdateLogsProps = {
  updates: RatingUpdateProps[];
};

function RatingUpdateLogs({ updates }: RatingUpdateLogsProps) {
  return (
    <div className="h-auto w-[450px] p-2 overflow-hidden">
      <AnimatePresence mode="popLayout">
        <div className={cn("space-y-3 relative")}>
          {updates.map((update, index) => (
            <motion.div
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              initial={{ opacity: 0, x: 20 }}
              key={(update as unknown as { _uuid: string })._uuid}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <div
                key={update._uuid}
                className="flex items-center justify-between gap-5 p-2 rounded-2xl bg-card shadow-md"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`font-medium text-xs p-2 rounded-lg ${
                      update.success
                        ? "bg-[#E8F5E9] text-[#388E3C] dark:bg-[#022C22] dark:text-[#1BC994]"
                        : "bg-[#FFEBEE] text-[#D32F2F] dark:bg-[#4D0217] dark:text-[#FF6982]"
                    }`}
                  >
                    {update.status}
                  </div>
                  <p className="text-sm font-medium">{update.operation}</p>
                </div>
                {update.success && (
                  <Popover>
                    <PopoverTrigger
                      className="size-8 text-secondary-foreground p-2 rounded-full bg-secondary"
                      asChild
                    >
                      <CirclePlusIcon className="size-4" />
                    </PopoverTrigger>
                    <PopoverContent className="flex flex-col gap-2 text-sm w-auto max-w-96 overflow-auto">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-accent rounded-sm">
                          <UserIcon size={14} />
                        </div>
                        <p className="text-foreground/60">
                          ID:{" "}
                          {(update.success.dataFields as PlayerDataFields)?.id}
                          {
                            (
                              update.success.dataFields as {
                                player?: PlayerDataFields;
                                playerTournament?: PlayerTournamentDataFields;
                              }
                            )?.player?.id
                          }
                        </p>
                      </div>
                      {(update.success.dataFields as PlayerDataFields)
                        ?.birth && (
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-accent rounded-sm">
                            <CakeIcon size={14} />
                          </div>
                          <p className="text-foreground/60">
                            Birth:{" "}
                            {format(
                              new Date(
                                (update.success.dataFields as PlayerDataFields)
                                  ?.birth as string
                              ),
                              "MM/dd/yyyy"
                            )}
                          </p>
                        </div>
                      )}
                      {(update.success.dataFields as PlayerDataFields)?.sex !=
                        null && (
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-accent rounded-sm">
                            <VenusAndMarsIcon size={14} />
                          </div>
                          <p className="text-foreground/60">
                            Sex:{" "}
                            {(
                              (update.success.dataFields as PlayerDataFields)
                                ?.sex as boolean
                            )
                              .toString()
                              .toUpperCase()}
                          </p>
                        </div>
                      )}
                      {(update.success.dataFields as PlayerDataFields)
                        ?.clubId && (
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-accent rounded-sm">
                            <StoreIcon size={14} />
                          </div>
                          <p className="text-foreground/60">
                            Club ID:{" "}
                            {
                              (update.success.dataFields as PlayerDataFields)
                                ?.clubId
                            }
                          </p>
                        </div>
                      )}
                      {(update.success.dataFields as PlayerDataFields)
                        ?.locationId && (
                        <div className="flex items-center gap-2">
                          <div className="p-1 bg-accent rounded-sm">
                            <MapPinnedIcon size={14} />
                          </div>
                          <p className="text-foreground/60">
                            Location ID:{" "}
                            {
                              (update.success.dataFields as PlayerDataFields)
                                ?.locationId
                            }
                          </p>
                        </div>
                      )}
                      {(
                        update.success.dataFields as {
                          player?: PlayerDataFields;
                          playerTournament?: PlayerTournamentDataFields;
                        }
                      )?.player && (
                        <>
                          {(
                            update.success.dataFields as {
                              player?: PlayerDataFields;
                              playerTournament?: PlayerTournamentDataFields;
                            }
                          )?.player?.birth && (
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-accent rounded-sm">
                                <CakeIcon size={14} />
                              </div>
                              <p className="text-foreground/60">
                                Birth:{" "}
                                {format(
                                  new Date(
                                    (
                                      update.success.dataFields as {
                                        player?: PlayerDataFields;
                                        playerTournament?: PlayerTournamentDataFields;
                                      }
                                    )?.player?.birth as string
                                  ),
                                  "MM/dd/yyyy"
                                )}
                              </p>
                            </div>
                          )}
                          {(
                            update.success.dataFields as {
                              player?: PlayerDataFields;
                              playerTournament?: PlayerTournamentDataFields;
                            }
                          )?.player?.sex != null && (
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-accent rounded-sm">
                                <VenusAndMarsIcon size={14} />
                              </div>
                              <p className="text-foreground/60">
                                Sex:{" "}
                                {(
                                  (
                                    update.success.dataFields as {
                                      player?: PlayerDataFields;
                                      playerTournament?: PlayerTournamentDataFields;
                                    }
                                  )?.player?.sex as boolean
                                )
                                  .toString()
                                  .toUpperCase()}
                              </p>
                            </div>
                          )}
                          {(
                            update.success.dataFields as {
                              player?: PlayerDataFields;
                              playerTournament?: PlayerTournamentDataFields;
                            }
                          )?.player?.clubId && (
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-accent rounded-sm">
                                <StoreIcon size={14} />
                              </div>
                              <p className="text-foreground/60">
                                Club ID:{" "}
                                {
                                  (
                                    update.success.dataFields as {
                                      player?: PlayerDataFields;
                                      playerTournament?: PlayerTournamentDataFields;
                                    }
                                  )?.player?.clubId
                                }
                              </p>
                            </div>
                          )}
                          {(
                            update.success.dataFields as {
                              player?: PlayerDataFields;
                              playerTournament?: PlayerTournamentDataFields;
                            }
                          )?.player?.locationId && (
                            <div className="flex items-center gap-2">
                              <div className="p-1 bg-accent rounded-sm">
                                <MapPinnedIcon size={14} />
                              </div>
                              <p className="text-foreground/60">
                                Location ID:{" "}
                                {
                                  (
                                    update.success.dataFields as {
                                      player?: PlayerDataFields;
                                      playerTournament?: PlayerTournamentDataFields;
                                    }
                                  )?.player?.locationId
                                }
                              </p>
                            </div>
                          )}
                        </>
                      )}
                      {(
                        update.success.dataFields as {
                          player?: PlayerDataFields;
                          playerTournament?: PlayerTournamentDataFields;
                        }
                      )?.playerTournament && (
                        <>
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-accent rounded-sm">
                              <TrophyIcon size={14} />
                            </div>
                            <p className="text-foreground/60">
                              Tournament ID:{" "}
                              {
                                (
                                  update.success.dataFields as {
                                    player?: PlayerDataFields;
                                    playerTournament?: PlayerTournamentDataFields;
                                  }
                                )?.playerTournament?.tournamentId
                              }
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-accent rounded-sm">
                              <TrendingUpDownIcon size={14} />
                            </div>
                            <p className="text-foreground/60">
                              Variation:{" "}
                              {
                                (
                                  update.success.dataFields as {
                                    player?: PlayerDataFields;
                                    playerTournament?: PlayerTournamentDataFields;
                                  }
                                )?.playerTournament?.variation
                              }
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="p-1 bg-accent rounded-sm">
                              <RewindIcon size={14} />
                            </div>
                            <p className="text-foreground/60">
                              Old Rating:{" "}
                              {
                                (
                                  update.success.dataFields as {
                                    player?: PlayerDataFields;
                                    playerTournament?: PlayerTournamentDataFields;
                                  }
                                )?.playerTournament?.oldRating
                              }
                            </p>
                          </div>
                        </>
                      )}
                    </PopoverContent>
                  </Popover>
                )}
                {update.error && (
                  <Popover>
                    <PopoverTrigger
                      className="size-8 text-secondary-foreground p-2 rounded-full bg-secondary"
                      asChild
                    >
                      <CirclePlusIcon className="size-4" />
                    </PopoverTrigger>
                    <PopoverContent className="flex flex-col gap-2 text-sm w-auto max-w-96 overflow-auto">
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-accent rounded-sm">
                          <InfoIcon size={14} />
                        </div>
                        <p className="text-foreground/60">
                          Status: {update.status}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="p-1 bg-accent rounded-sm">
                          <MessageSquareIcon size={14} />
                        </div>
                        <p className="text-foreground/60">
                          Message: {update.error.message}
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    </div>
  );
}

export { RatingUpdateLogs, type RatingUpdateLogsProps };
