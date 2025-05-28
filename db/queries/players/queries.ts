import { db } from "@/db";
import { unstable_cache } from "@/lib/unstable_cache";

export const getPlayers = unstable_cache(
  () => db.query.players.findMany({
    columns: {
      id: true,
      name: true,
      nickname: true,
      classic: true,
      rapid: true,
      blitz: true,
      imageUrl: true,
      birth: true,
      sex: true,
    },
    with: {
      club: {
        columns: {
          name: true,
          logo: true
        }
      },
      location: {
        columns: {
          name: true,
          flag: true
        }
      },
      defendingChampions: {
        columns: {},
        with: {
          championship: {
            columns: {
              name: true
            }
          }
        }
      },
      playersToTitles: {
        columns: {
          id: true,
          playerId: true,
          titleId: true,
        },
        with: {
          title: {
            columns: {
              id: true,
              title: true,
              shortTitle: true,
              type: true
            }
          }
        }
      }
    },
  }),
  ['players'],
  {
    revalidate: 60 * 60 * 24 * 30,
    tags: ['players']
  }
)
