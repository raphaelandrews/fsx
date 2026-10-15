import { describe, expect, test } from "bun:test";

import { formatSchedule, isScheduledInFuture, scheduleToInput, scheduleToInstant } from "./schedule";

describe("schedule conversion", () => {
  test("treats the typed time as Brasília time", () => {
    expect(scheduleToInstant("2026-10-20T09:00")).toBe("2026-10-20T12:00:00.000Z");
    expect(scheduleToInstant("")).toBeNull();
  });

  test("round-trips through the stored UTC timestamp", () => {
    expect(scheduleToInput("2026-10-20 12:00:00")).toBe("2026-10-20T09:00");
    expect(scheduleToInput("2026-10-20 02:30:00")).toBe("2026-10-19T23:30");
    expect(scheduleToInput(null)).toBe("");
  });

  test("formats for the dashboard and knows what is still in the future", () => {
    expect(formatSchedule("2026-10-20 12:00:00")).toBe("20/10/2026 at 09:00 (Brasília)");
    expect(isScheduledInFuture("2026-10-20 12:00:00", Date.parse("2026-10-20T11:59:00Z"))).toBe(true);
    expect(isScheduledInFuture("2026-10-20 12:00:00", Date.parse("2026-10-20T12:00:01Z"))).toBe(false);
    expect(isScheduledInFuture(null)).toBe(false);
  });
});
