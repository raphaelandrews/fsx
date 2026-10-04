import { sql } from "drizzle-orm";

import type { Context } from "../context";
import { storedOrComputed } from "./computed";
import { RATING_TYPES, type RatingType } from "../routers/rating-update";

// A club is ranked by the average of its best active players; with fewer than
// this many active members one strong player could carry it, so it is unranked.
export const CLUB_STRENGTH_SIZE = 5;

export interface ClubStanding {
  club: { id: number; name: string; logoUrl: string | null };
  members: number;
  activeMembers: number;
  strength: Record<RatingType, number | null>;
  rank: Record<RatingType, number | null>;
  // Career medals of the club's current members: tournament podiums (overall and
  // category) and finished-circuit podiums. Stage results are left out.
  medals: { gold: number; silver: number; bronze: number };
}

type MemberRow = { clubId: number; members: number; activeMembers: number };
type ActiveRow = { clubId: number } & Record<RatingType, number>;
type MedalRow = { clubId: number; place: number; total: number };

export function loadClubStandings(db: Context["db"]): Promise<ClubStanding[]> {
  return storedOrComputed(db, "club-standings", () => computeClubStandings(db));
}

async function computeClubStandings(db: Context["db"]): Promise<ClubStanding[]> {
  const [clubs, memberCounts, activeMembers, medals] = await db.batch([
    db.query.clubs.findMany({ columns: { id: true, name: true, logoUrl: true } }),
    db.all<MemberRow>(sql`
      SELECT club_id AS clubId, COUNT(*) AS members, SUM(active) AS activeMembers
      FROM players WHERE club_id IS NOT NULL GROUP BY club_id`),
    // Sorting each club's members in the Worker reads every active member once;
    // three ROW_NUMBER() windows made D1 read the rows several times over.
    db.all<ActiveRow>(sql`
      SELECT club_id AS clubId, classic, rapid, blitz FROM players WHERE active = 1 AND club_id IS NOT NULL`),
    db.all<MedalRow>(sql`
      SELECT p.club_id AS clubId, m.place AS place, COUNT(*) AS total
      FROM (
        SELECT player_id, place FROM tournament_podiums WHERE place <= 3
        UNION ALL
        SELECT player_id, place FROM circuit_final_podiums WHERE place <= 3
      ) m
      JOIN players p ON p.id = m.player_id
      WHERE p.club_id IS NOT NULL
      GROUP BY p.club_id, m.place`),
  ]);

  const counts = new Map(memberCounts.map((row) => [row.clubId, row]));
  const ratingsOf = new Map<number, ActiveRow[]>();
  for (const row of activeMembers) ratingsOf.set(row.clubId, [...(ratingsOf.get(row.clubId) ?? []), row]);
  const strengthOf = (clubId: number, type: RatingType) => {
    const best = (ratingsOf.get(clubId) ?? []).map((row) => row[type]).sort((a, b) => b - a).slice(0, CLUB_STRENGTH_SIZE);
    return best.length === CLUB_STRENGTH_SIZE ? Math.round(best.reduce((sum, rating) => sum + rating, 0) / best.length) : null;
  };
  const standings: ClubStanding[] = clubs.flatMap((club) => {
    const row = counts.get(club.id);
    if (!row) return [];
    const ranked = row.activeMembers >= CLUB_STRENGTH_SIZE;
    const medalCount = (place: number) =>
      medals.find((medal) => medal.clubId === club.id && medal.place === place)?.total ?? 0;
    return [
      {
        club,
        members: row.members,
        activeMembers: row.activeMembers,
        strength: Object.fromEntries(
          RATING_TYPES.map((type) => [type, ranked ? strengthOf(club.id, type) : null]),
        ) as Record<RatingType, number | null>,
        rank: { classic: null, rapid: null, blitz: null },
        medals: { gold: medalCount(1), silver: medalCount(2), bronze: medalCount(3) },
      },
    ];
  });

  // Rounded strengths rank, so clubs shown with the same number share a place.
  for (const type of RATING_TYPES) {
    const ordered = standings
      .filter((standing) => standing.strength[type] !== null)
      .sort((a, b) => b.strength[type]! - a.strength[type]!);
    ordered.forEach((standing, index) => {
      const previous = ordered[index - 1];
      standing.rank[type] =
        previous && previous.strength[type] === standing.strength[type] ? previous.rank[type] : index + 1;
    });
  }
  return standings.sort((a, b) => a.club.name.localeCompare(b.club.name, "pt-BR"));
}
