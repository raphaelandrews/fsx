import { afterAll, beforeAll, describe, expect, test } from "bun:test";

import { createDb } from "@fsx/db";

import { ownerCaller } from "./test-admin";
import { createTestD1 } from "./test-d1";
import { mockWorkerEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");

let caller: Awaited<ReturnType<typeof ownerCaller>>;
let dispose: () => Promise<void>;

const idOf = (rows: unknown) => (rows as { id: number }[])[0]!.id;

beforeAll(async () => {
  const test = await createTestD1("fsx-event-links");
  caller = await ownerCaller(appRouter.createCaller, createDb(test.binding));
  dispose = () => test.miniflare.dispose();
});

afterAll(async () => {
  await dispose();
});

describe("event links stay on the event page", () => {
  test("generic link procedures reject event-owned groups", async () => {
    const event = idOf(await caller.events.create({ name: "Aberto", startDate: "2026-11-01" }));
    const [link] = await caller.events.setLinks({
      eventId: event,
      links: [{ type: "regulation", href: "https://example.com/r" }],
    });
    const events = await caller.events.list();
    const groupId = events.find((item) => item.id === event)!.linkGroup!.id;

    await expect(
      caller.links.createLink({ linkGroupId: groupId, label: "Extra", icon: "link", sortOrder: 1 }),
    ).rejects.toMatchObject({ code: "BAD_REQUEST" });
    await expect(caller.links.updateLink({ id: link!.id, label: "Outro" })).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
    await expect(caller.links.deleteGroup({ id: groupId })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });
    await expect(caller.links.updateGroup({ id: groupId, label: "x" })).rejects.toMatchObject({
      code: "NOT_FOUND",
    });

    await caller.events.delete({ id: event });
    await expect(caller.events.delete({ id: event })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect((await caller.links.list()).some((group) => group.id === groupId)).toBe(false);
  });
});

describe("upcoming events", () => {
  test("lists only events from today on, soonest first", async () => {
    const past = idOf(await caller.events.create({ name: "Passado", startDate: "2000-01-01" }));
    const later = idOf(await caller.events.create({ name: "Depois", startDate: "2999-12-31" }));
    const sooner = idOf(await caller.events.create({ name: "Antes", startDate: "2999-01-01" }));

    const ids = (await caller.events.upcoming()).map((event) => event.id);
    expect(ids).not.toContain(past);
    expect(ids.indexOf(sooner)).toBeLessThan(ids.indexOf(later));
    expect(ids).toContain(later);
  });
});
