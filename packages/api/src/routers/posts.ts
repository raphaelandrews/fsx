import { z } from "zod";
import { eq, desc, and, count } from "drizzle-orm";

import { env } from "@fsx/env/server";
import { posts, insertPostSchema } from "@fsx/db/schema/posts";
import { adminProcedure, publicProcedure, router } from "../index";
import { urlToKey } from "./images";

export const postsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db
      .select({ id: posts.id, title: posts.title, imageUrl: posts.imageUrl, slug: posts.slug })
      .from(posts)
      .where(eq(posts.published, true))
      .orderBy(desc(posts.createdAt))
      .limit(24)
  ),
  listAdmin: adminProcedure.query(({ ctx }) =>
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
        columns: { id: true, title: true, imageUrl: true, content: true, slug: true, createdAt: true },
      })
    ),
  byPage: publicProcedure
    .input(z.object({ page: z.number().default(1) }))
    .query(async ({ ctx, input }) => {
      const validPage = Math.max(1, input.page);
      const perPage = 12;
      const data = await ctx.db.query.posts.findMany({
        columns: { id: true, title: true, imageUrl: true, slug: true, createdAt: true },
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
      .select({ id: posts.id, title: posts.title, imageUrl: posts.imageUrl, slug: posts.slug })
      .from(posts)
      .where(eq(posts.published, true))
      .orderBy(desc(posts.createdAt))
      .limit(8)
  ),
  create: adminProcedure
    .input(insertPostSchema.omit({ id: true }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(posts).values(input).returning()
    ),
  update: adminProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      imageUrl: z.string().nullable().optional(),
      content: z.string().optional(),
      slug: z.string().optional(),
      published: z.boolean().optional(),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.update(posts).set(input).where(eq(posts.id, input.id)).returning()
    ),
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      // Cascade: remove the post's cover image from R2 so deleting a post
      // doesn't leave an orphaned object. Best-effort; the DB delete proceeds
      // even if the object is already gone.
      const existing = await ctx.db.query.posts.findFirst({
        where: eq(posts.id, input.id),
        columns: { imageUrl: true },
      });
      if (existing?.imageUrl) {
        const key = urlToKey(existing.imageUrl);
        if (key) await env.IMAGES.delete(key).catch(() => {});
      }
      await ctx.db.delete(posts).where(eq(posts.id, input.id));
    }),
});
