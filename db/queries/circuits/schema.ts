import { z } from "zod";

const titleSchema = z.object({
  shortTitle: z.string(),
  type: z.string()
});

const clubSchema = z.object({
  id: z.number(),
  name: z.string(),
  logo: z.string().nullable()
});

const playerSchema = z.object({
  id: z.number(),
  name: z.string(),
  nickname: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  club: clubSchema.nullable().optional(),
  playersToTitles: z.array(
    z.object({
      title: titleSchema
    })
  ).optional()
});

const podiumSchema = z.object({
  category: z.string().nullable(),
  place: z.string(),
  points: z.number(),
  player: playerSchema
});

const tournamentSchema = z.object({
  name: z.string()
});

const phaseSchema = z.object({
  id: z.number(),
  order: z.number(),
  tournament: tournamentSchema,
  circuitPodiums: z.array(podiumSchema)
});

const circuitSchema = z.object({
  name: z.string(),
  type: z.string(),
  circuitPhase: z.array(phaseSchema)
});

export const circuitsSchema = z.array(circuitSchema);
export type Circuit = z.infer<typeof circuitSchema>;
export type CircuitClub = z.infer<typeof clubSchema>;
export type CircuitPhase = z.infer<typeof phaseSchema>;
export type CircuitPlayer = z.infer<typeof playerSchema>;
export type ExtendedCircuitPlayer = CircuitPlayer & {
  total: number;
  category?: string | undefined | null;
  pointsByPhase?: Record<string, number> | null;
  clubName?: string | null;
};
export type ExtendedCircuit = Circuit & {
  players: ExtendedCircuitPlayer[];
};
export type ExtendedCircuitClub = {
  clubName: string;
  clubLogo: string | null;
  total: number;
  pointsByPhase: Record<string, number>;
  players: CircuitPlayer[]
};
export type ExtendedCircuitPodium = CircuitPodium & {
  clubId: number;
};
export type CircuitPodium = z.infer<typeof podiumSchema>;

