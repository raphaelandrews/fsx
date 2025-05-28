import { sql, desc } from 'drizzle-orm';

import { db } from "@/db";
import { playersToTitles } from "@/db/schema";
import { unstable_cache } from "@/lib/unstable_cache";

export const getTitledPlayers = unstable_cache(
  () =>
    db.query.players.findMany({
      columns: {
        id: true,
        name: true,
        imageUrl: true,
        rapid: true, 
      },
      with: {
        playersToTitles: {
          columns: {},
          with: {
            title: {
              columns: {
                title: true,
                shortTitle: true,
                type: true
              }
            }
          }
        }
      },
      where: (players, { exists }) =>
        exists(
          db.select()
            .from(playersToTitles)
            .where(sql`${playersToTitles.playerId} = ${players.id}`)
        ),
      orderBy: (players) => [desc(players.rapid)] 
    }),
  ["titled-players"],
  {
    revalidate: 60 * 60 * 24 * 15,
  }
);
