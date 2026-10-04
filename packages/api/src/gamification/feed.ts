import { and, desc, eq, gte, inArray, isNotNull, sql } from "drizzle-orm";

import { announcements } from "@fsx/db/schema/announcements";
import { players } from "@fsx/db/schema/players";
import { playersToTitles } from "@fsx/db/schema/playersToTitles";
import { titles } from "@fsx/db/schema/titles";

import type { Context } from "../context";
import { achievementsOf, type BadgeIcon } from "./badges";
import { loadAllPlayerStats } from "./load";

export const FEED_SIZE = 20;
const FEED_WINDOW_DAYS = 60;
// Players with something recorded in the window. Their ids are bound as an IN
// list, and D1 accepts at most 100 parameters per statement.
const FEED_PLAYERS_LIMIT = 90;

export interface FeedItem {
  kind: "achievement" | "title" | "announcement";
  date: string;
  player: { id: number; name: string; nickname: string | null };
  label: string;
  icon: BadgeIcon | "title" | "announcement";
  announcementId: number | null;
}

// The day the feed starts: the launch date, or 60 days ago when later. Before
// launch (null) the feed is empty, so history is never published as news.
export function feedStart(launchDate: string | null, today: string): string | null {
  if (!launchDate) return null;
  const window = new Date(`${today}T00:00:00Z`);
  window.setUTCDate(window.getUTCDate() - FEED_WINDOW_DAYS);
  const windowStart = window.toISOString().slice(0, 10);
  return launchDate > windowStart ? launchDate : windowStart;
}

// Achievements dated in the window come from tournaments played then; titles
// and announcements, which carry no tournament date, use when they were recorded.
export async function recentFeed(db: Context["db"], since: string): Promise<FeedItem[]> {
  const recentPlayers = await db.all<{ playerId: number }>(sql`
    SELECT player_id AS playerId FROM players_to_tournaments WHERE created_at >= ${since}
    UNION SELECT player_id FROM tournament_podiums WHERE created_at >= ${since}
    UNION SELECT player_id FROM circuit_final_podiums WHERE created_at >= ${since}
    UNION SELECT player_id FROM players_to_titles WHERE created_at >= ${since}
    UNION SELECT player_id FROM announcements WHERE player_id IS NOT NULL AND created_at >= ${since}
    LIMIT ${FEED_PLAYERS_LIMIT}`);
  const ids = recentPlayers.map((row) => row.playerId);
  if (ids.length === 0) return [];

  const [careers, titleAwards, notices] = await Promise.all([
    loadAllPlayerStats(db, ids),
    db
      .select({ playerId: playersToTitles.playerId, createdAt: playersToTitles.createdAt, title: titles.name })
      .from(playersToTitles)
      .innerJoin(titles, eq(titles.id, playersToTitles.titleId))
      .where(and(inArray(playersToTitles.playerId, ids), gte(playersToTitles.createdAt, since))),
    db
      .select({
        id: announcements.id,
        year: announcements.year,
        number: announcements.number,
        playerId: announcements.playerId,
        createdAt: announcements.createdAt,
      })
      .from(announcements)
      .where(and(isNotNull(announcements.playerId), gte(announcements.createdAt, since)))
      .orderBy(desc(announcements.createdAt))
      .limit(FEED_SIZE),
  ]);

  const people = new Map<number, FeedItem["player"]>(
    careers.map(({ player }) => [player.id, { id: player.id, name: player.name, nickname: player.nickname }]),
  );
  const missing = [...titleAwards, ...notices]
    .map((row) => row.playerId!)
    .filter((id) => !people.has(id));
  if (missing.length > 0) {
    for (const player of await db
      .select({ id: players.id, name: players.name, nickname: players.nickname })
      .from(players)
      .where(inArray(players.id, missing))) {
      people.set(player.id, player);
    }
  }
  const who = (id: number) => people.get(id)!;

  const items: FeedItem[] = [
    ...careers.flatMap(({ player, stats }) =>
      achievementsOf(stats)
        .filter((achievement) => achievement.earnedAt !== null && achievement.earnedAt >= since)
        .map((achievement) => ({
          kind: "achievement" as const,
          date: achievement.earnedAt!,
          player: who(player.id),
          label: achievement.label,
          icon: achievement.icon,
          announcementId: null,
        })),
    ),
    ...titleAwards.map((award) => ({
      kind: "title" as const,
      date: award.createdAt.slice(0, 10),
      player: who(award.playerId),
      label: award.title,
      icon: "title" as const,
      announcementId: null,
    })),
    ...notices.map((notice) => ({
      kind: "announcement" as const,
      date: notice.createdAt.slice(0, 10),
      player: who(notice.playerId!),
      label: `Comunicado ${String(notice.number).padStart(3, "0")}/${notice.year}`,
      icon: "announcement" as const,
      announcementId: notice.id,
    })),
  ];
  return items.sort((a, b) => b.date.localeCompare(a.date)).slice(0, FEED_SIZE);
}
