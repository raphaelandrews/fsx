import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { players } from "~/db/schema";

const playerSelectSchema = createSelectSchema(players);

export const SearchPlayerBaseSchema = playerSelectSchema.extend({
  id: z.number().int(),
  name: z.string().max(100), 
}).strict();

export const SearchPlayerResponseSchema = SearchPlayerBaseSchema.extend({
  id: z.number().int(),
}).partial();

export const SuccessSearchPlayersResponseSchema = z.array(SearchPlayerResponseSchema);

export const ErrorSearchPlayersResponseSchema = z.object({
  error: z.string(),
});

export type SearchPlayerResponse = z.infer<typeof SearchPlayerResponseSchema>;
export type SuccessSearchPlayersResponse = z.infer<typeof SuccessSearchPlayersResponseSchema>;
export type ErrorSearchPlayersResponse = z.infer<typeof ErrorSearchPlayersResponseSchema>;
