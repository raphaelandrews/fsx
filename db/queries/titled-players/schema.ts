import { createSelectSchema } from "drizzle-zod";
import { z } from "zod";

import { players, titles } from "@/db/schema";

const playersSchema = createSelectSchema(players);
const titleSchema = createSelectSchema(titles);

const playerToTitleSchema = z.object({
  title: titleSchema.pick({ type: true, title: true, shortTitle: true }),
});

export const TitledPlayerSchema = playersSchema
  .pick({
    id: true,
    name: true,
    imageUrl: true,
  })
  .extend({
    id: z.number().int().positive(),
    nickname: z.string().max(20, "Nickname must be 20 characters or less").nullable().optional(),
    imageUrl: z.string().url().nullable().optional(),
    playersToTitles: z.array(playerToTitleSchema).optional(),
  });

export const SuccessTitledPlayersSchema = z.object({
  success: z.literal(true),
  data: z.array(TitledPlayerSchema),
});

const ErrorTitledPlayersSchema = z.object({
  success: z.literal(false),
  error: z.object({
    code: z.number(),
    message: z.string(),
    details: z.any().optional(),
  }),
});

export const APITitledPlayersResponseSchema = z.discriminatedUnion("success", [
  SuccessTitledPlayersSchema,
  ErrorTitledPlayersSchema,
]);

export type TitledPlayer = z.infer<typeof TitledPlayerSchema>;
export type SuccessTitledPlayersResponse = z.infer<typeof SuccessTitledPlayersSchema>["data"];
export type APITitledPlayersResponse = z.infer<typeof APITitledPlayersResponseSchema>;
