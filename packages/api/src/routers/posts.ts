import { z } from "zod";
import { eq, desc, and, count } from "drizzle-orm";

import { posts, insertPostSchema } from "@fsx/db/schema/posts";
import { protectedProcedure, publicProcedure, router } from "../index";

export const postsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db
      .select({ id: posts.id, title: posts.title, image: posts.image, slug: posts.slug })
      .from(posts)
      .where(eq(posts.published, true))
      .orderBy(desc(posts.createdAt))
      .limit(24)
  ),
  listAdmin: protectedProcedure.query(({ ctx }) =>
    ctx.db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt))
  ),
  bySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(({ ctx, input }) =>
      ctx.db.query.posts.findFirst({
        where: and(eq(posts.slug, input.slug), eq(posts.published, true)),
        columns: { id: true, title: true, image: true, content: true, slug: true, createdAt: true },
      })
    ),
  byPage: publicProcedure
    .input(z.object({ page: z.number().default(1) }))
    .query(async ({ ctx, input }) => {
      const validPage = Math.max(1, input.page);
      const perPage = 12;
      const data = await ctx.db.query.posts.findMany({
        columns: { id: true, title: true, image: true, slug: true, createdAt: true },
        where: eq(posts.published, true),
        orderBy: [desc(posts.createdAt)],
        limit: perPage,
        offset: (validPage - 1) * perPage,
      });
      const countResult = await ctx.db
        .select({ value: count() })
        .from(posts)
        .where(eq(posts.published, true));
      const totalItems = countResult[0]?.value ?? 0;
      const totalPages = Math.max(1, Math.ceil(totalItems / perPage));
      return {
        posts: data,
        pagination: {
          currentPage: validPage,
          totalPages,
          totalItems,
          itemsPerPage: perPage,
          hasNextPage: validPage < totalPages,
          hasPreviousPage: validPage > 1,
        },
      };
    }),
  fresh: publicProcedure.query(({ ctx }) =>
    ctx.db
      .select({ id: posts.id, title: posts.title, image: posts.image, slug: posts.slug })
      .from(posts)
      .where(eq(posts.published, true))
      .orderBy(desc(posts.createdAt))
      .limit(6)
  ),
  create: protectedProcedure
    .input(insertPostSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(posts).values(input).returning()
    ),
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      image: z.string().optional(),
      content: z.string().optional(),
      slug: z.string().optional(),
      published: z.boolean().optional(),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(posts).set(input).where(eq(posts.id, input.id)).returning()
    ),
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) =>
      ctx.db.delete(posts).where(eq(posts.id, input.id))
    ),
});
