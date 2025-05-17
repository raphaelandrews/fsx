import { desc, count } from "drizzle-orm"

import { db } from "@/db"
import { announcements } from "@/db/schema"
import { unstable_cache } from "@/lib/unstable_cache";

const perPage = 12

export const getAnnouncementsByPage = unstable_cache(
  async (page: number) => {
    const validPage = Math.max(1, page)

    const data = await db.query.announcements.findMany({
      columns: { id: true, year: true, number: true, content: true },
      orderBy: [desc(announcements.year), desc(announcements.number)],
      limit: perPage,
      offset: (page - 1) * perPage,
    });

    const [{ value: total }] = await db.select({ value: count() }).from(announcements);
    const totalItems = total ?? 0
    const totalPages = Math.max(1, Math.ceil(totalItems / perPage))

    return {
      announcements: data,
      pagination: {
        currentPage: validPage,
        totalPages,
        totalItems,
        itemsPerPage: perPage,
        hasNextPage: validPage < totalPages,
        hasPreviousPage: validPage > 1,
      },
    }
  },
  ["announcements-list"],
  {
    revalidate: 60 * 60 * 24 * 30,
    tags: ["announcements", "announcements-list"],
  },
)
