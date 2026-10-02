import { z } from "zod";

export const positiveInt = z.number().int().safe().min(1);
export const nonNegativeInt = z.number().int().safe().min(0);
export const rating = z.number().int().safe().min(0).max(4000);
export const points = z.number().int().safe().min(0).max(1_000_000);
export const sortOrder = nonNegativeInt.max(100_000);

export const page = positiveInt.max(1_000).default(1);
export const limit = positiveInt.max(100).default(20);
export const searchText = z.string().trim().max(120);
export const nameText = z.string().trim().min(1).max(160);
export const contentText = z.string().max(500_000);
export const urlText = z.string().trim().url().max(2_048);
export const filterArray = z.array(z.string().trim().min(1).max(80)).max(50);

export const idInput = z.object({ id: positiveInt });
