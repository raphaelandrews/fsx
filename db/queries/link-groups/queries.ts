import { db } from "@/db"
import { unstable_cache } from "@/lib/unstable_cache";

export const getLinksGroups = unstable_cache(
  () =>
    db.query.linkGroups.findMany({
      columns: {
        id: true,
        label: true,
      },
      with: {
        links: {
          columns: {
            href: true,
            label: true,
            icon: true,
            order: true
          }
        }
      },
      orderBy: (linksGroups, { asc }) => asc(linksGroups.id),
    }),
  ["links-groups"],
  {
    revalidate: 60 * 60 * 24 * 15,
    tags: ["links-groups"],
  },
)
