import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath, URL as NodeURL } from "node:url";

import { describe, expect, test } from "bun:test";
import { Miniflare } from "miniflare";
import { eq } from "drizzle-orm";

import { createDb } from "@fsx/db";
import { cleanupExpiredRateLimits } from "@fsx/db/rate-limit-maintenance";
import { rateLimits } from "@fsx/db/schema/rateLimits";
import { players } from "@fsx/db/schema/players";
import { playersToTournaments } from "@fsx/db/schema/playersToTournaments";
import { tournaments } from "@fsx/db/schema/tournaments";

import { applyRatingUpdate } from "./routers/rating-update";

const migrationsDirectory = new NodeURL("../../db/src/migrations/", import.meta.url);

async function applyMigrations(database: D1Database) {
  const directoryPath = fileURLToPath(migrationsDirectory);
  const files = (await readdir(directoryPath))
    .filter((name) => /^\d+_.*\.sql$/.test(name))
    .sort();

  for (const file of files) {
    const migration = await readFile(new NodeURL(file, migrationsDirectory), "utf8");
    const statements = migration
      .split("--> statement-breakpoint")
      .map((statement) => statement.trim().replace(/\s+/g, " "))
      .filter(Boolean);
    for (const statement of statements) await database.exec(statement);
  }
}

describe("D1 migration and rating integration", () => {
  test("applies tracked migrations, commits rating history, and rolls back failures", async () => {
    const miniflare = new Miniflare({
      compatibilityDate: "2026-08-06",
      d1Databases: { DB: "fsx-integration" },
      modules: true,
      script: "export default { async fetch() { return new Response('ok') } }",
    });

    try {
      const binding = await miniflare.getD1Database("DB");
      await applyMigrations(binding);

      const db = createDb(binding);
      await binding.batch([
        binding.prepare("INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, ?)")
          .bind("expired", 1_000, 2),
        binding.prepare("INSERT INTO rate_limits (key, window_start, count) VALUES (?, ?, ?)")
          .bind("active", 9_000, 3),
      ]);
      expect(await cleanupExpiredRateLimits(binding, 5_000)).toBe(1);
      expect(await db.select().from(rateLimits)).toEqual([
        { key: "active", windowStart: 9_000, count: 3 },
      ]);

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
