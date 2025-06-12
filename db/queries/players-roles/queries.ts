import { db } from "@/db";
import { unstable_cache } from "@/lib/unstable_cache";

export const getPlayersRoles = unstable_cache(
  () =>
    db.query.roles.findMany({
      columns: {
        role: true,
        type: true,
      },
      with: {
        playersToRoles: {
          columns: {},
          with: {
            player: {
              columns: {
                id: true,
                name: true,
                imageUrl: true
              }
            }
          }
        }
      },
    }),
  ["players-roles"],
  {
    revalidate: 60 * 60 * 24 * 15,
    tags: ["players-roles"],
  }
);
