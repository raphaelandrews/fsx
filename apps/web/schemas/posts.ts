import { z } from "zod";

export const FreshNewsSchema = z.object({
  id: z.string(),
  title: z.string()
  .min(1, { message: "Title is required" })
  .max(80, { message: "Title must be 80 characters or less" }),
  image: z.string().nullable(),
});

export type FreshNews = z.infer<typeof FreshNewsSchema>;

export const FreshNewsArraySchema = z.array(FreshNewsSchema);