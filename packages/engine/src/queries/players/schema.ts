import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { players } from "~/db/schema";

const baseInsertSchema = createInsertSchema(players);
const playersSchema = createSelectSchema(players);

export const PaginationSchema = z.object({
  currentPage: z.number().min(1, "Current page must be at least 1"),
  totalPages: z.number().min(1, "Total pages must be at least 1"),
  totalItems: z.number().min(0, "Total items cannot be negative"),
  itemsPerPage: z.number().min(1, "Items per page must be at least 1"),
  hasNextPage: z.boolean(),
  hasPreviousPage: z.boolean(),
});

export const PlayerBaseSchema = playersSchema.extend({
  name: z.string().max(100, "Name cannot exceed 100 characters"),
  nickname: z.string().max(20, "Nickname cannot exceed 20 characters").optional(),
  blitz: z.number().int().min(0).max(32767),
  rapid: z.number().int().min(0).max(32767),
  classic: z.number().int().min(0).max(32767),
  active: z.boolean().optional(),
  imageUrl: z.string().url().optional(),
  cbxId: z.number().optional(),
  fideId: z.number().optional(),
  verified: z.boolean().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
}).strict();

export const PlayerResponseSchema = PlayerBaseSchema.extend({
  id: z.number().int(),
}).partial();

export const PaginatedPlayersResponseSchema = z.object({
  players: z.array(PlayerResponseSchema),
  pagination: PaginationSchema,
});

export const PlayerMutationSchema = baseInsertSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    name: z.string().max(100),
    nickname: z.string().max(20).optional(),
    imageUrl: z.string().url().optional()
  })
  .partial();

export const SuccessPlayerResponseSchema = PlayerResponseSchema;

export const ErrorPlayerResponseSchema = z.object({
  error: z.string(),
});

export type PlayerResponse = z.infer<typeof PlayerResponseSchema>;
export type PlayerMutation = z.infer<typeof PlayerMutationSchema>;
export type SuccessPlayerResponse = z.infer<typeof SuccessPlayerResponseSchema>;
export type ErrorPlayerResponse = z.infer<typeof ErrorPlayerResponseSchema>;
export type PaginatedPlayersResponse = z.infer<typeof PaginatedPlayersResponseSchema>;
