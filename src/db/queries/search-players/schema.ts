import { z } from "zod";

const SearchPlayerSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().max(100),
});

const SuccessSchema = z.object({
  success: z.literal(true),
  data: z.array(SearchPlayerSchema),
});

const ErrorSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.number().int(),
    message: z.string(),
    details: z.unknown().optional(),
  }),
});

export const APISearchPlayersResponseSchema = z.discriminatedUnion("success", [
  SuccessSchema,
  ErrorSchema
]);

export type SearchPlayer = z.infer<typeof SearchPlayerSchema>;
export type APISearchPlayersResponse = z.infer<typeof APISearchPlayersResponseSchema>;
