import { QueryClient } from "@tanstack/query-core"
import { createQueryCollection } from "@tanstack/db-collections"
import { z } from "zod";

import { fetchAllAnnouncements } from "~/db/queries";

const queryClient = new QueryClient()

const AnnouncementSchema = z.object({
  id: z.number().int().positive(),
  year: z.number().int(),
  number: z.string().max(3),
  content: z.string(),
});

type Announcement = z.infer<typeof AnnouncementSchema>;

export const announcementCollection = createQueryCollection<Announcement>({
  id: "announcementCollection",
  queryKey: ["announcements"],
  queryFn: () => fetchAllAnnouncements(),
  getId: (item) => String(item.id),
  schema: AnnouncementSchema,
  queryClient,
})