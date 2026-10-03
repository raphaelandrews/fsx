import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";

import { createDb } from "@fsx/db";
import { players } from "@fsx/db/schema/players";
import { playersToTournaments } from "@fsx/db/schema/playersToTournaments";
import { tournaments } from "@fsx/db/schema/tournaments";

import { applyRatingUpdate } from "./routers/rating-update";
import { createTestD1 } from "./test-d1";

describe("D1 migration and rating integration", () => {
  test("applies tracked migrations, commits rating history, and rolls back failures", async () => {
    const { miniflare, binding } = await createTestD1("fsx-integration");

    try {

      const db = createDb(binding);
      const [player] = await db
        .insert(players)
        .values({ name: "Integration Player", active: true, rapid: 1600 })
        .returning({ id: players.id });
      const [tournament] = await db
        .insert(tournaments)
        .values({ name: "Integration Tournament", ratingType: "rapid" })
        .returning({ id: tournaments.id });

      if (!player || !tournament) throw new Error("Fixture insert failed");

      const result = await applyRatingUpdate(db, {
        playerId: player.id,
        tournamentId: tournament.id,
        variation: 25,
        ratingType: "rapid",
      });

      expect(result[0]).toMatchObject({ id: expect.any(Number), oldRating: 1600, variation: 25 });
      expect(await db.select({ rapid: players.rapid }).from(players).where(eq(players.id, player.id)))
        .toEqual([{ rapid: 1625 }]);

      await expect(
        applyRatingUpdate(db, {
          playerId: player.id,
          tournamentId: tournament.id,
          variation: 50,
          ratingType: "rapid",
        }),
      ).rejects.toThrow();

      expect(await db.select({ rapid: players.rapid }).from(players).where(eq(players.id, player.id)))
        .toEqual([{ rapid: 1625 }]);
      expect(await db.select().from(playersToTournaments)).toHaveLength(1);

      const secondTournament = await db.insert(tournaments)
        .values({ name: "Concurrent Tournament", ratingType: "rapid" })
        .returning({ id: tournaments.id });
      const attempts = await Promise.allSettled([
        applyRatingUpdate(db, {
          playerId: player.id,
          tournamentId: secondTournament[0]!.id,
          variation: 10,
          ratingType: "rapid",
        }),
        applyRatingUpdate(db, {
          playerId: player.id,
          tournamentId: secondTournament[0]!.id,
          variation: 10,
          ratingType: "rapid",
        }),
      ]);
      expect(attempts.filter((attempt) => attempt.status === "fulfilled")).toHaveLength(1);
      expect(attempts.filter((attempt) => attempt.status === "rejected")).toHaveLength(1);
      expect(await db.select({ rapid: players.rapid }).from(players).where(eq(players.id, player.id)))
        .toEqual([{ rapid: 1635 }]);
      expect(await db.select().from(playersToTournaments)).toHaveLength(2);
    } finally {
      await miniflare.dispose();
    }
  });
});
