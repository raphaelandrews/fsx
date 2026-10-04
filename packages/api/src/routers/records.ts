import { storedOrComputed } from "../gamification/computed";
import { GAMIFICATION_LAUNCH_DATE } from "../gamification/constants";
import { feedStart, recentFeed } from "../gamification/feed";
import { loadAllPlayerStats } from "../gamification/load";
import { playerRecords } from "../gamification/records";
import { publicProcedure, router } from "../index";

// The federation's calendar day and year, not UTC's, around midnight.
const today = () => new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
const currentYear = () => Number(today().slice(0, 4));

export const recordsRouter = router({
  recent: publicProcedure.query(({ ctx }) => {
    const since = feedStart(GAMIFICATION_LAUNCH_DATE, today());
    return since ? storedOrComputed(ctx.db, `feed:${since}`, () => recentFeed(ctx.db, since)) : [];
  }),
  all: publicProcedure.query(({ ctx }) => {
    const year = currentYear();
    return storedOrComputed(ctx.db, `records:${year}`, async () =>
      playerRecords(
        (await loadAllPlayerStats(ctx.db)).map(({ player, stats, level, tournaments }) => ({
          player: { id: player.id, name: player.name, nickname: player.nickname, active: player.active },
          stats,
          level,
          tournaments,
        })),
        year,
      ),
    );
  }),
});
