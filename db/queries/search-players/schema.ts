import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { players } from "@/db/schema";

const playersSchema = createSelectSchema(players);

export const SearchPlayers = playersSchema
  .pick({
    id: true,
    name: true,
  })
  .extend({
    id: z.number().int().positive(),
    name: z.string().max(100, "Name must be 100 characters or less"),
  });

export const SuccessSearchPlayersSchema = z.object({
  success: z.literal(true),
  data: z.array(SearchPlayers),
});

const ErrorSearchPlayersSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.number(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

export const APISearchPlayersResponseSchema = z.discriminatedUnion("success", [
  SuccessSearchPlayersSchema,
  ErrorSearchPlayersSchema,
]);

export type SearchPlayer = z.infer<typeof SearchPlayers>;
export type APISearchPlayersResponse = z.infer<typeof APISearchPlayersResponseSchema>;
