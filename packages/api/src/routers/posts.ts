import { z } from "zod";
import { eq, desc, and, count } from "drizzle-orm";

import { env } from "@fsx/env/server";
import { posts, insertPostSchema } from "@fsx/db/schema/posts";
import { adminProcedure, publicProcedure, router } from "../index";
import { contentText, idInput, nameText, page, positiveInt, searchText, urlText } from "../input-schemas";
import { requireMutationRows } from "../errors";
import { urlToKey } from "./images";

export const postsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db
      .select({ id: posts.id, title: posts.title, imageUrl: posts.imageUrl, slug: posts.slug })
      .from(posts)
      .where(eq(posts.published, true))
       .orderBy(desc(posts.createdAt), desc(posts.id))
      .limit(24)
  ),
  listAdmin: adminProcedure.query(({ ctx }) =>
    ctx.db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt))
  ),
  bySlug: publicProcedure
    .input(z.object({ slug: searchText.max(200) }))
    .query(({ ctx, input }) =>
      ctx.db.query.posts.findFirst({
        where: and(eq(posts.slug, input.slug), eq(posts.published, true)),
        columns: { id: true, title: true, imageUrl: true, content: true, slug: true, createdAt: true, updatedAt: true },
      })
    ),
  byPage: publicProcedure
    .input(z.object({ page }))
    .query(async ({ ctx, input }) => {
      const validPage = Math.max(1, input.page);
      const perPage = 12;
      const data = await ctx.db.query.posts.findMany({
         columns: { id: true, title: true, imageUrl: true, slug: true, createdAt: true, updatedAt: true },
        where: eq(posts.published, true),
         orderBy: [desc(posts.createdAt), desc(posts.id)],
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
       .orderBy(desc(posts.createdAt), desc(posts.id))
      .limit(8)
  ),
  create: adminProcedure
    .input(insertPostSchema.omit({ id: true, createdAt: true, updatedAt: true }).extend({
      title: nameText,
      imageUrl: urlText.nullable().optional(),
      content: contentText,
      slug: z.string().trim().min(1).max(200),
      published: z.boolean(),
    }))
    .mutation(({ ctx, input }) =>
      ctx.db.insert(posts).values(input).returning()
    ),
  update: adminProcedure
    .input(z.object({
      id: positiveInt,
      title: searchText.optional(),
      imageUrl: urlText.nullable().optional(),
      content: contentText.optional(),
      slug: searchText.max(200).optional(),
      published: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.update(posts).set(input).where(eq(posts.id, input.id)).returning(),
        "Post",
      )
    ),
  delete: adminProcedure
    .input(idInput)
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
      const deleted = await ctx.db.delete(posts).where(eq(posts.id, input.id)).returning({ id: posts.id });
      requireMutationRows(deleted, "Post");
    }),
});
