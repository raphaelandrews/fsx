import { desc, sql } from 'drizzle-orm';

import { db } from "@/db";
import { players } from "@/db/schema";
import { unstable_cache } from "@/lib/unstable_cache";

function normalizeText(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

export const getSearchPlayers = unstable_cache(
  (query: string) =>
    db.select({
      id: players.id,
      name: players.name
    })
      .from(players)
      .where(
        query.trim() ?
          sql`LOWER(${players.name}) ILIKE ${`%${query}%`} OR LOWER(translate(${players.name}, 'áàâãäéèêëíìîïóòôõöúùûüýÿ', 'aaaaaeeeeiiiiooooouuuuyy')) ILIKE ${`%${normalizeText(query)}%`}` :
          sql`1=1`
      )
      .orderBy(desc(players.rapid))
      .limit(10)
      .execute(),
  ['search-players'],
  {
    revalidate: 60 * 60 * 24 * 15,
    tags: ["search-players"],
  }
);
