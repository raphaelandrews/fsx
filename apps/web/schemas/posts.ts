import { z } from "zod";

export const FreshNewsSchema = z.object({
  id: z.string(),
  title: z.string(),
  image: z.string().nullable(),
});

export type FreshNews = z.infer<typeof FreshNewsSchema>;

export const FreshNewsArraySchema = z.array(FreshNewsSchema);