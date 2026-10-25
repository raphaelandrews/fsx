import { z } from "zod";
import { asc, eq } from "drizzle-orm";

import { categories } from "@fsx/db/schema/categories";
import { adminProcedure, publicProcedure, router } from "../index";
import { idInput, nameText, positiveInt, sexSchema, sortOrder } from "../input-schemas";
import { deleteById } from "../crud";
import { requireMutationRows } from "../errors";
import { PUBLIC_COLLECTION_LIMIT } from "../lib/resource-bounds";
import { assertDeletable } from "../services/delete-impact";

const categoryInput = z
  .object({
    name: nameText.max(60),
    kind: z.enum(["age", "open"]),
    sex: sexSchema.nullable().optional(),
    ageLimit: z.number().int().min(1).max(100).nullable().optional(),
    sortOrder,
  })
  .superRefine((value, ctx) => {
    if (value.kind === "age" && (!value.sex || !value.ageLimit)) {
      ctx.addIssue({ code: "custom", message: "An age category needs a sex and an age limit", path: ["ageLimit"] });
    }
    if (value.kind === "open" && (value.sex || value.ageLimit)) {
      ctx.addIssue({ code: "custom", message: "An open category has no sex or age limit", path: ["kind"] });
    }
  });

const row = (input: z.infer<typeof categoryInput>) => ({
  name: input.name,
  kind: input.kind,
  sex: input.kind === "age" ? input.sex! : null,
  ageLimit: input.kind === "age" ? input.ageLimit! : null,
  sortOrder: input.sortOrder,
});

export const categoriesRouter = router({
  list: publicProcedure.query(({ ctx }) =>
    ctx.db
      .select({
        id: categories.id,
        name: categories.name,
        kind: categories.kind,
        sex: categories.sex,
        ageLimit: categories.ageLimit,
        sortOrder: categories.sortOrder,
      })
      .from(categories)
      .orderBy(asc(categories.sortOrder), asc(categories.id))
      .limit(PUBLIC_COLLECTION_LIMIT),
  ),
  create: adminProcedure.input(categoryInput).mutation(({ ctx, input }) =>
    ctx.db.insert(categories).values(row(input)).returning(),
  ),
  update: adminProcedure
    .input(categoryInput.and(z.object({ id: positiveInt })))
    .mutation(async ({ ctx, input }) =>
      requireMutationRows(
        await ctx.db.update(categories).set(row(input)).where(eq(categories.id, input.id)).returning(),
        "Category",
      ),
    ),
  delete: adminProcedure.input(idInput).mutation(async ({ ctx, input }) => {
    await assertDeletable(ctx.db, "category", input.id);
    return deleteById(ctx.db, categories, input.id, "Category");
  }),
});
