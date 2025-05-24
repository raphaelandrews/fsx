import { createQueryCollection } from "@tanstack/db-collections"
import { QueryClient } from "@tanstack/query-core"
import { z } from "zod";

import { fetchAllPosts } from "~/db/queries";

const queryClient = new QueryClient()

const PostSchema = z.object({
  id: z.string(),
  title: z.string().max(80),
  image: z.string(),
  slug: z.string(),
  published: z.boolean(),
  createdAt: z.string(),
});

type Post = z.infer<typeof PostSchema>;

export const postCollection = createQueryCollection<Post>({
  id: "postCollection",
  queryKey: ["posts"],
  queryFn: () => fetchAllPosts(),
  getId: (item) => String(item.id),
  schema: PostSchema,
  queryClient,
})
