import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { createDb } from "@fsx/db";

import { ownerCaller } from "./test-admin";
import { createTestD1 } from "./test-d1";
import { mockWorkerEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");

let caller: Awaited<ReturnType<typeof ownerCaller>>;
let dispose: () => Promise<void>;
let tournamentId: number;

const idOf = (rows: unknown) => (rows as { id: number }[])[0]!.id;

beforeAll(async () => {
  const test = await createTestD1("fsx-events-calendar");
  caller = await ownerCaller(appRouter.createCaller, createDb(test.binding));
  dispose = () => test.miniflare.dispose();
  tournamentId = idOf(await caller.tournaments.create({ name: "Aberto do Calendário", ratingType: "rapid" }));
  await caller.events.create({ name: "Janeiro", startDate: "2031-01-10" });
  await caller.events.create({
    name: "Virada de mês",
    startDate: "2031-01-30",
    endDate: "2031-02-02",
    venue: "Ginásio",
    tournamentId,
  });
  await caller.events.create({ name: "Outro ano", startDate: "2032-03-01" });
});

afterAll(async () => {
  await dispose();
});

describe("the public calendar", () => {
  test("lists a year's events in date order with their details", async () => {
    const events = await caller.events.calendar({ year: 2031 });
    expect(events.map((event) => event.name)).toEqual(["Janeiro", "Virada de mês"]);
    expect(events[1]).toMatchObject({ endDate: "2031-02-02", venue: "Ginásio", tournamentId });
  });

  test("a multi-day event shows in every month it touches", async () => {
    expect((await caller.events.calendar({ year: 2031, month: 2 })).map((event) => event.name)).toEqual(["Virada de mês"]);
    expect(await caller.events.calendar({ year: 2031, month: 3 })).toEqual([]);
  });

  test("rejects an invalid month", async () => {
    await expect(caller.events.calendar({ year: 2031, month: 13 })).rejects.toThrow();
  });
});

describe("event dates and tournament", () => {
  test("rejects an end date before the start date", async () => {
    await expect(caller.events.create({ name: "Invertido", startDate: "2031-05-10", endDate: "2031-05-09" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    const id = idOf(await caller.events.create({ name: "Válido", startDate: "2031-05-10" }));
    await expect(caller.events.update({ id, endDate: "2031-05-01" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.events.update({ id, startDate: "2031-05-12", endDate: "2031-05-11" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("keeps a venue link, clears it when emptied, and refuses a non-http address", async () => {
    const id = idOf(await caller.events.create({ name: "Com Mapa", startDate: "2031-07-01", venue: "Ginásio", venueUrl: "https://maps.example.com/x" }));
    const find = async () => (await caller.events.calendar({ year: 2031, month: 7 })).find((event) => event.id === id)!;
    expect(await find()).toMatchObject({ venue: "Ginásio", venueUrl: "https://maps.example.com/x" });
    await caller.events.update({ id, name: "Com Mapa 2" });
    expect((await find()).venueUrl).toBe("https://maps.example.com/x");
    await caller.events.update({ id, venueUrl: "" });
    expect((await find()).venueUrl).toBeNull();
    await expect(caller.events.update({ id, venueUrl: "javascript:alert(1)" })).rejects.toMatchObject({ code: "BAD_REQUEST" });
  });

  test("rejects an unknown tournament and unknown event", async () => {
    await expect(caller.events.create({ name: "Sem torneio", startDate: "2031-06-01", tournamentId: 999999 })).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.events.update({ id: 999999, endDate: "2031-06-01" })).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  test("deleting the tournament keeps the event", async () => {
    await caller.tournaments.delete({ id: tournamentId });
    const events = await caller.events.calendar({ year: 2031, month: 1 });
    expect(events.find((event) => event.name === "Virada de mês")?.tournamentId).toBeNull();
  });
});
