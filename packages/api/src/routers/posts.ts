import { z } from "zod";
import { eq, desc, and, count, sql } from "drizzle-orm";

import { posts, insertPostSchema } from "@fsx/db/schema/posts";
import { adminProcedure, publicProcedure, router } from "../index";
import { contentText, idInput, imageUrl, nameText, page, positiveInt, searchText } from "../input-schemas";
import { requireFound, requireMutationRows } from "../errors";
import { paginate } from "../lib/pagination";
import { publiclyVisiblePost, toDbTimestamp } from "../lib/post-visibility";
import { deleteMediaUrl, deleteReplacedMedia } from "../services/media-storage";

const scheduleInstant = z.iso.datetime();

export const postsRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db
      .select({ id: posts.id, title: posts.title, imageUrl: posts.imageUrl, slug: posts.slug })
      .from(posts)
      .where(publiclyVisiblePost())
      .orderBy(desc(posts.createdAt), desc(posts.id))
      .limit(24)
  ),
  listAdmin: adminProcedure.query(({ ctx }) =>
    ctx.db
      .select({
        id: posts.id,
        title: posts.title,
        slug: posts.slug,
        imageUrl: posts.imageUrl,
        published: posts.published,
        publishAt: posts.publishAt,
        createdAt: posts.createdAt,
        updatedAt: posts.updatedAt,
      })
      .from(posts)
      .orderBy(desc(posts.createdAt), desc(posts.id))
  ),
  forEdit: adminProcedure
    .input(idInput)
    .query(async ({ ctx, input }) =>
      requireFound(await ctx.db.query.posts.findFirst({ where: eq(posts.id, input.id) }), "Post")
    ),
  bySlug: publicProcedure
    .input(z.object({ slug: searchText.max(200) }))
    .query(async ({ ctx, input }) =>
      requireFound(await ctx.db.query.posts.findFirst({
        where: and(eq(posts.slug, input.slug), publiclyVisiblePost()),
        columns: { id: true, title: true, imageUrl: true, content: true, slug: true, createdAt: true, updatedAt: true },
      }), "Post")
    ),
  byPage: publicProcedure.input(z.object({ page })).query(async ({ ctx, input }) => {
    const perPage = 12;
    const [data, countResult] = await Promise.all([
      ctx.db.query.posts.findMany({
        columns: {
          id: true,
          title: true,
          imageUrl: true,
          slug: true,
          createdAt: true,
          updatedAt: true,
        },
        where: publiclyVisiblePost(),
        orderBy: [desc(posts.createdAt), desc(posts.id)],
        limit: perPage,
        offset: (input.page - 1) * perPage,
      }),
      ctx.db.select({ value: count() }).from(posts).where(publiclyVisiblePost()),
    ]);
    const totalItems = countResult[0]?.value ?? 0;
    return {
      posts: data,
      pagination: paginate({ page: input.page, perPage, totalItems }),
    };
  }),
  fresh: publicProcedure.query(({ ctx }) =>
    ctx.db
      .select({ id: posts.id, title: posts.title, imageUrl: posts.imageUrl, slug: posts.slug })
      .from(posts)
      .where(publiclyVisiblePost())
      .orderBy(desc(posts.createdAt), desc(posts.id))
      .limit(8)
  ),
  create: adminProcedure
    .input(insertPostSchema.omit({ id: true, createdAt: true, updatedAt: true, publishAt: true }).extend({
      title: nameText,
      imageUrl: imageUrl.nullable().optional(),
      content: contentText,
      slug: z.string().trim().min(1).max(200),
      published: z.boolean(),
      publishAt: scheduleInstant.nullable().optional(),
    }))
    .mutation(({ ctx, input }) => {
      const { publishAt, ...values } = input;
      const at = publishAt ? toDbTimestamp(publishAt) : null;
      // The schedule is the publication date everywhere the site shows or sorts by one.
      return ctx.db.insert(posts).values({ ...values, publishAt: at, ...(at ? { createdAt: at } : {}) }).returning();
    }),
  update: adminProcedure
    .input(
      z.object({
        id: positiveInt,
        title: nameText.optional(),
        imageUrl: imageUrl.nullable().optional(),
        content: contentText.optional(),
        slug: z.string().trim().min(1).max(200).optional(),
        published: z.boolean().optional(),
        publishAt: scheduleInstant.nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const previous = await ctx.db.query.posts.findFirst({
        where: eq(posts.id, input.id),
        columns: { imageUrl: true, publishAt: true, createdAt: true },
      });
      const { publishAt, ...values } = input;
      const schedule =
        publishAt === undefined
          ? {}
          : publishAt
            ? { publishAt: toDbTimestamp(publishAt), createdAt: toDbTimestamp(publishAt) }
            : {
                publishAt: null,
                // Taking a post off its schedule publishes it now, not at the date it was waiting for.
                ...(previous?.publishAt && previous.publishAt === previous.createdAt ? { createdAt: sql`(CURRENT_TIMESTAMP)` } : {}),
              };
      const updated = requireMutationRows(
        await ctx.db.update(posts).set({ ...values, ...schedule }).where(eq(posts.id, input.id)).returning(),
        "Post",
      );
      await deleteReplacedMedia(previous?.imageUrl, input.imageUrl);
      return updated;
    }),
  delete: adminProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    const deleted = requireMutationRows(
      await ctx.db
        .delete(posts)
        .where(eq(posts.id, input.id))
        .returning({ id: posts.id, imageUrl: posts.imageUrl }),
      "Post",
    );
    await deleteMediaUrl(deleted[0]?.imageUrl);
    return deleted.map(({ id }) => ({ id }));
  }),
});
