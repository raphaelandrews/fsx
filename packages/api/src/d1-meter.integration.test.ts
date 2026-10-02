import { describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";

import { createDb } from "@fsx/db";
import { norms } from "@fsx/db/schema/norms";

import { meterD1 } from "./d1-meter";
import { createTestD1 } from "./test-d1";

describe("meterD1", () => {
  test("counts drizzle statements, including batches, and records replayable SQL", async () => {
    const { miniflare, binding } = await createTestD1("fsx-d1-meter");
    try {
      const meter = meterD1(binding, { record: true });
      const db = createDb(meter.binding);

      await db.insert(norms).values({ name: "Norma A" });
      await db.select().from(norms).where(eq(norms.name, "Norma A"));
      expect(meter.queries).toBe(2);

      await db.batch([
        db.insert(norms).values({ name: "Norma B" }),
        db.select().from(norms),
      ]);
      expect(meter.queries).toBe(4);
      expect(meter.statements).toHaveLength(4);

      const select = meter.statements.find((statement) => statement.sql.startsWith("select"))!;
      const replay = await binding.prepare(select.sql).bind(...select.params).all();
      expect(replay.results).toHaveLength(1);
      expect(replay.meta.rows_read).toBeGreaterThan(0);
    } finally {
      await miniflare.dispose();
    }
  });
});
