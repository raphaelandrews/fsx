import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { eq } from "drizzle-orm";
import type { SQLiteColumn, SQLiteTable } from "drizzle-orm/sqlite-core";

import { createDb } from "@fsx/db";
import { announcements } from "@fsx/db/schema/announcements";
import { championships } from "@fsx/db/schema/championships";
import { circuitPhases } from "@fsx/db/schema/circuitPhases";
import { circuitPodiums } from "@fsx/db/schema/circuitPodiums";
import { circuits } from "@fsx/db/schema/circuits";
import { clubs } from "@fsx/db/schema/clubs";
import { cups } from "@fsx/db/schema/cups";
import { events } from "@fsx/db/schema/events";
import { insignias } from "@fsx/db/schema/insignias";
import { linkGroups } from "@fsx/db/schema/linkGroups";
import { links } from "@fsx/db/schema/links";
import { locations } from "@fsx/db/schema/locations";
import { norms } from "@fsx/db/schema/norms";
import { playersToInsignias } from "@fsx/db/schema/playersToInsignias";
import { playersToRoles } from "@fsx/db/schema/playersToRoles";
import { playersToTitles } from "@fsx/db/schema/playersToTitles";
import { posts } from "@fsx/db/schema/posts";
import { roles } from "@fsx/db/schema/roles";
import { titles } from "@fsx/db/schema/titles";
import { tournamentPodiums } from "@fsx/db/schema/tournamentPodiums";
import { tournaments } from "@fsx/db/schema/tournaments";
import { tvSergipe } from "@fsx/db/schema/tvSergipe";

import type { Context } from "./context";
import { DEFAULT_LINK_ICON } from "./link-icons";
import { ownerCaller } from "./test-admin";
import { createTestD1 } from "./test-d1";
import { mockWorkerEnv, testEnv } from "./test-env";

mockWorkerEnv();

const { appRouter } = await import("./routers/index");

type Caller = Awaited<ReturnType<typeof ownerCaller>>;
type IdTable = SQLiteTable & { id: SQLiteColumn };

const MISSING_ID = 999_999;
const MEDIA = (kind: "players" | "posts") =>
  `/api/media/${kind}/0b1c2d3e-4f50-6172-8394-a5b6c7d8e9f0.webp`;

let db: Context["db"];
let caller: Caller;
let dispose: () => Promise<void>;
// Placeholder IDs let `cases()` run at registration time for the test names;
// each test rebuilds the cases after beforeAll has created the real fixtures.
let fixtures = {
  playerId: 0,
  secondPlayerId: 0,
  clubId: 0,
  tournamentId: 0,
  circuitId: 0,
  phaseId: 0,
  titleId: 0,
  roleId: 0,
  insigniaId: 0,
};

function idOf(result: unknown): number {
  const row = Array.isArray(result) ? result[0] : result;
  const id = (row as { id?: unknown } | undefined)?.id;
  if (typeof id !== "number") throw new Error(`Mutation returned no id: ${JSON.stringify(result)}`);
  return id;
}

async function readRow(table: IdTable, id: number) {
  const [row] = await db.select().from(table).where(eq(table.id, id));
  return row as Record<string, unknown> | undefined;
}

beforeAll(async () => {
  const { miniflare, binding, images } = await createTestD1("fsx-admin-crud");
  testEnv.IMAGES = images;
  db = createDb(binding);
  caller = await ownerCaller(appRouter.createCaller, db);
  dispose = () => miniflare.dispose();

  const player = base({ name: "Fixture Player" });
  const playerId = idOf(await caller.players.create(player));
  const secondPlayerId = idOf(await caller.players.create(base({ name: "Second Player" })));
  const clubId = idOf(await caller.clubs.create({ name: "Fixture Club" }));
  const tournamentId = idOf(await caller.tournaments.create({ name: "Fixture Open", ratingType: "rapid" }));
  const circuitId = idOf(await caller.circuits.create({ name: "Fixture Circuit", type: "default" }));
  const phaseId = idOf(await caller.circuits.phases.create({ circuitId, tournamentId, sortOrder: 1 }));
  const titleId = idOf(await caller.titles.create({ name: "Mestre", shortName: "MF", type: "internal" }));
  const roleId = idOf(await caller.roles.create({ name: "Árbitro", shortName: "AR", type: "referee" }));
  const insigniaId = idOf(await caller.insignias.create({ name: "Ouro", level: 1 }));
  fixtures = { playerId, secondPlayerId, clubId, tournamentId, circuitId, phaseId, titleId, roleId, insigniaId };
});

afterAll(async () => {
  testEnv.IMAGES = {};
  await dispose();
});

function base(overrides: { name: string }) {
  return { blitz: 1500, rapid: 1500, classic: 1500, sex: "male" as const, ...overrides };
}

type CrudCase = {
  name: string;
  table: IdTable;
  create: () => Promise<unknown>;
  created: Record<string, unknown>;
  update: (id: number) => Promise<unknown>;
  updated: Record<string, unknown>;
  remove: (id: number) => Promise<unknown>;
};

const cases = (): CrudCase[] => [
  {
    name: "announcements",
    table: announcements,
    create: () => caller.announcements.create({ year: 2026, number: 7, content: "Comunicado" }),
    created: { year: 2026, number: 7, content: "Comunicado" },
    update: (id) => caller.announcements.update({ id, number: 8, content: "Revisado" }),
    updated: { year: 2026, number: 8, content: "Revisado" },
    remove: (id) => caller.announcements.delete({ id }),
  },
  {
    name: "champions",
    table: championships,
    create: () => caller.champions.create({ name: "Campeonato Sergipano" }),
    created: { name: "Campeonato Sergipano" },
    update: (id) => caller.champions.update({ id, name: "Campeonato Sergipano Absoluto" }),
    updated: { name: "Campeonato Sergipano Absoluto" },
    remove: (id) => caller.champions.delete({ id }),
  },
  {
    name: "circuits",
    table: circuits,
    create: () => caller.circuits.create({ name: "Circuito Escolar", type: "school" }),
    created: { name: "Circuito Escolar", type: "school" },
    update: (id) => caller.circuits.update({ id, name: "Circuito Geral", type: "geral" }),
    updated: { name: "Circuito Geral", type: "geral" },
    remove: (id) => caller.circuits.delete({ id }),
  },
  {
    name: "circuits.phases",
    table: circuitPhases,
    create: () => caller.circuits.phases.create({
      circuitId: fixtures.circuitId,
      tournamentId: fixtures.tournamentId,
      clubId: fixtures.clubId,
      sortOrder: 2,
    }),
    created: { circuitId: fixtures.circuitId, clubId: fixtures.clubId, sortOrder: 2 },
    update: (id) => caller.circuits.phases.update({
      id,
      tournamentId: fixtures.tournamentId,
      clubId: null,
      sortOrder: 3,
    }),
    updated: { clubId: null, sortOrder: 3 },
    remove: (id) => caller.circuits.phases.delete({ id }),
  },
  {
    name: "circuits.podiums",
    table: circuitPodiums,
    create: () => caller.circuits.podiums.create({
      playerId: fixtures.playerId,
      circuitPhaseId: fixtures.phaseId,
      place: 1,
      points: 10,
    }),
    created: { playerId: fixtures.playerId, circuitPhaseId: fixtures.phaseId, place: 1, points: 10 },
    update: (id) => caller.circuits.podiums.update({
      id,
      playerId: fixtures.secondPlayerId,
      circuitPhaseId: fixtures.phaseId,
      place: 2,
      points: 8,
    }),
    updated: { playerId: fixtures.secondPlayerId, place: 2, points: 8 },
    remove: (id) => caller.circuits.podiums.delete({ id }),
  },
  {
    name: "clubs",
    table: clubs,
    create: () => caller.clubs.create({ name: "Clube de Xadrez", logoUrl: "https://example.com/logo.png" }),
    created: { name: "Clube de Xadrez", logoUrl: "https://example.com/logo.png" },
    update: (id) => caller.clubs.update({ id, name: "Clube Aracaju", logoUrl: null }),
    updated: { name: "Clube Aracaju", logoUrl: null },
    remove: (id) => caller.clubs.delete({ id }),
  },
  {
    name: "cups",
    table: cups,
    create: () => caller.cups.create({
      name: "Copa Bullet",
      imageUrl: "https://example.com/cup.png",
      startDate: "2026-03-01",
      endDate: "2026-03-30",
      prizePool: 500,
      ratingType: "blitz",
    }),
    created: { name: "Copa Bullet", prizePool: 500, ratingType: "blitz" },
    update: (id) => caller.cups.update({ id, prizePool: 750, imageUrl: MEDIA("posts") }),
    updated: { name: "Copa Bullet", prizePool: 750, imageUrl: MEDIA("posts") },
    remove: (id) => caller.cups.delete({ id }),
  },
  {
    name: "events",
    table: events,
    create: () => caller.events.create({ name: "Aberto de Verão", startDate: "2026-01-10" }),
    created: { name: "Aberto de Verão", startDate: "2026-01-10" },
    update: (id) => caller.events.update({ id, startDate: "2026-01-17" }),
    updated: { name: "Aberto de Verão", startDate: "2026-01-17" },
    remove: (id) => caller.events.delete({ id }),
  },
  {
    name: "insignias",
    table: insignias,
    create: () => caller.insignias.create({ name: "Prata", level: 2 }),
    created: { name: "Prata", level: 2 },
    update: (id) => caller.insignias.update({ id, level: 3 }),
    updated: { name: "Prata", level: 3 },
    remove: (id) => caller.insignias.delete({ id }),
  },
  {
    name: "links (groups)",
    table: linkGroups,
    create: () => caller.links.create({ label: "Federação" }),
    created: { label: "Federação" },
    update: (id) => caller.links.updateGroup({ id, label: "Links oficiais" }),
    updated: { label: "Links oficiais" },
    remove: (id) => caller.links.deleteGroup({ id }),
  },
  {
    name: "links (items)",
    table: links,
    create: async () => {
      const groupId = idOf(await caller.links.create({ label: "Grupo" }));
      return caller.links.createLink({
        label: "Site",
        href: "https://example.com",
        icon: DEFAULT_LINK_ICON,
        sortOrder: 1,
        linkGroupId: groupId,
      });
    },
    created: { label: "Site", href: "https://example.com", sortOrder: 1 },
    update: (id) => caller.links.updateLink({ id, label: "Portal", href: "" }),
    updated: { label: "Portal", href: null, sortOrder: 1 },
    remove: (id) => caller.links.deleteLink({ id }),
  },
  {
    name: "locations",
    table: locations,
    create: () => caller.locations.create({ name: "Aracaju", type: "city", flagUrl: "https://example.com/flag.png" }),
    created: { name: "Aracaju", type: "city", flagUrl: "https://example.com/flag.png" },
    update: (id) => caller.locations.update({ id, name: "Sergipe", type: "state", flagUrl: null }),
    updated: { name: "Sergipe", type: "state", flagUrl: null },
    remove: (id) => caller.locations.delete({ id }),
  },
  {
    name: "norms",
    table: norms,
    create: () => caller.norms.create({ name: "Norma de Mestre" }),
    created: { name: "Norma de Mestre" },
    update: (id) => caller.norms.update({ id, name: "Norma de Grande Mestre" }),
    updated: { name: "Norma de Grande Mestre" },
    remove: (id) => caller.norms.delete({ id }),
  },
  {
    name: "posts",
    table: posts,
    create: () => caller.posts.create({
      title: "Notícia",
      slug: "noticia-crud",
      content: "Texto",
      published: false,
      imageUrl: MEDIA("posts"),
    }),
    created: { title: "Notícia", slug: "noticia-crud", published: false, imageUrl: MEDIA("posts") },
    update: (id) => caller.posts.update({ id, title: "Notícia revisada", published: true, imageUrl: null }),
    updated: { title: "Notícia revisada", slug: "noticia-crud", published: true, imageUrl: null },
    remove: (id) => caller.posts.delete({ id }),
  },
  {
    name: "roles",
    table: roles,
    create: () => caller.roles.create({ name: "Presidente", shortName: "PR", type: "management" }),
    created: { name: "Presidente", shortName: "PR", type: "management" },
    update: (id) => caller.roles.update({ id, name: "Vice-presidente", shortName: "VP" }),
    updated: { name: "Vice-presidente", shortName: "VP", type: "management" },
    remove: (id) => caller.roles.delete({ id }),
  },
  {
    name: "titles",
    table: titles,
    create: () => caller.titles.create({ name: "Candidato a Mestre", shortName: "CM", type: "external" }),
    created: { name: "Candidato a Mestre", shortName: "CM", type: "external" },
    update: (id) => caller.titles.update({ id, shortName: "CMS", type: "internal" }),
    updated: { name: "Candidato a Mestre", shortName: "CMS", type: "internal" },
    remove: (id) => caller.titles.delete({ id }),
  },
  {
    name: "tournamentPodiums",
    table: tournamentPodiums,
    create: () => caller.tournamentPodiums.create({
      playerId: fixtures.playerId,
      tournamentId: fixtures.tournamentId,
      place: 1,
    }),
    created: { playerId: fixtures.playerId, tournamentId: fixtures.tournamentId, place: 1 },
    update: (id) => caller.tournamentPodiums.update({
      id,
      playerId: fixtures.secondPlayerId,
      tournamentId: fixtures.tournamentId,
      place: 2,
    }),
    updated: { playerId: fixtures.secondPlayerId, place: 2 },
    remove: (id) => caller.tournamentPodiums.delete({ id }),
  },
  {
    name: "tournaments",
    table: tournaments,
    create: () => caller.tournaments.create({
      name: "Aberto de Aracaju",
      ratingType: "classic",
      date: "2026-05-02",
      chessResults: "https://chess-results.com/tnr1.aspx",
    }),
    created: { name: "Aberto de Aracaju", ratingType: "classic", date: "2026-05-02" },
    update: (id) => caller.tournaments.update({ id, name: "Aberto de Aracaju 2026", chessResults: null }),
    updated: { name: "Aberto de Aracaju 2026", date: "2026-05-02", chessResults: null },
    remove: (id) => caller.tournaments.delete({ id }),
  },
  {
    name: "tvSergipe",
    table: tvSergipe,
    create: () => caller.tvSergipe.create({
      clubId: fixtures.clubId,
      playerId: fixtures.playerId,
      ageGroup: "12",
      sex: "female",
      modality: "individual",
      place: 1,
    }),
    created: { clubId: fixtures.clubId, playerId: fixtures.playerId, modality: "individual", place: 1 },
    update: (id) => caller.tvSergipe.update({
      id,
      clubId: fixtures.clubId,
      teamName: "B",
      ageGroup: "12",
      sex: "female",
      modality: "team",
      place: 3,
    }),
    updated: { playerId: null, teamName: "B", modality: "team", place: 3 },
    remove: (id) => caller.tvSergipe.delete({ id }),
  },
];

describe("admin CRUD round-trips against D1", () => {
  test("players persist every edited field (players have no delete)", async () => {
    const id = idOf(await caller.players.create({
      ...base({ name: "Maria Souza" }),
      sex: "female",
      nickname: "Mari",
      birthDate: "2012-04-09",
      imageUrl: MEDIA("players"),
      clubId: fixtures.clubId,
      cbxId: 123,
    }));
    await caller.players.update({ id, name: "Maria Souza Lima", rapid: 1620, imageUrl: null, clubId: null });
    expect(await caller.players.forEdit({ id })).toMatchObject({
      name: "Maria Souza Lima",
      nickname: "Mari",
      rapid: 1620,
      birthDate: "2012-04-09",
      imageUrl: null,
      clubId: null,
      cbxId: 123,
    });
  });

  for (const crud of cases()) {
    test(`${crud.name}: create → read → update → read → delete`, async () => {
      const current = cases().find((candidate) => candidate.name === crud.name)!;
      const id = idOf(await current.create());
      expect(await readRow(current.table, id)).toMatchObject(current.created);

      await current.update(id);
      expect(await readRow(current.table, id)).toMatchObject(current.updated);

      await current.remove(id);
      expect(await readRow(current.table, id)).toBeUndefined();
    });
  }

  test("player relations link, list, and unlink", async () => {
    const { playerId, titleId, roleId, insigniaId } = fixtures;
    const relations = [
      {
        table: playersToTitles,
        link: () => caller.playersToTitles.link({ playerId, titleId }),
        list: () => caller.playersToTitles.listByPlayer({ playerId }),
        unlink: (id: number) => caller.playersToTitles.unlink({ id }),
      },
      {
        table: playersToRoles,
        link: () => caller.playersToRoles.link({ playerId, roleId }),
        list: () => caller.playersToRoles.listByPlayer({ playerId }),
        unlink: (id: number) => caller.playersToRoles.unlink({ id }),
      },
      {
        table: playersToInsignias,
        link: () => caller.playersToInsignias.link({ playerId, insigniaId }),
        list: () => caller.playersToInsignias.listByPlayer({ playerId }),
        unlink: (id: number) => caller.playersToInsignias.unlink({ id }),
      },
    ];
    for (const relation of relations) {
      const id = idOf(await relation.link());
      expect((await relation.list()).map((row) => (row as { id: number }).id)).toContain(id);
      await relation.unlink(id);
      expect(await readRow(relation.table, id)).toBeUndefined();
    }
  });
});

describe("events.setLinks against D1", () => {
  test("creates the group, then updates, inserts, and deletes links in one batch", async () => {
    const eventId = idOf(await caller.events.create({ name: "Evento com links", startDate: "2026-02-01" }));
    const otherEventId = idOf(await caller.events.create({ name: "Outro evento", startDate: "2026-02-02" }));

    const first = await caller.events.setLinks({
      eventId,
      links: [
        { type: "regulation", href: "https://example.com/regulamento.pdf" },
        { type: "form", href: "" },
      ],
    });
    expect(first.map((link) => [link.type, link.href, link.sortOrder])).toEqual([
      ["regulation", "https://example.com/regulamento.pdf", 1],
      ["form", null, 2],
    ]);
    const [regulation, form] = first;

    const second = await caller.events.setLinks({
      eventId,
      links: [
        { id: regulation!.id, type: "regulation", href: "https://example.com/v2.pdf", sortOrder: 1 },
        { type: "results", href: "https://chess-results.com/x", sortOrder: 2 },
      ],
    });
    expect(second.map((link) => [link.id === regulation!.id, link.type, link.href])).toEqual([
      [true, "regulation", "https://example.com/v2.pdf"],
      [false, "results", "https://chess-results.com/x"],
    ]);
    expect(await readRow(links, form!.id)).toBeUndefined();

    const otherLinks = await caller.events.setLinks({
      eventId: otherEventId,
      links: [{ type: "form", href: "https://example.com/form" }],
    });
    await expect(caller.events.setLinks({
      eventId,
      links: [{ id: otherLinks[0]!.id, type: "form", href: "https://evil.example" }],
    })).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await readRow(links, otherLinks[0]!.id)).toMatchObject({ href: "https://example.com/form" });

    await expect(caller.events.setLinks({
      eventId,
      links: [{ type: "form" }, { type: "form" }],
    })).rejects.toMatchObject({ code: "BAD_REQUEST" });

    expect(await caller.events.setLinks({ eventId, links: [] })).toEqual([]);
  });
});

describe("admin mutations reject missing and invalid ids", () => {
  const { playerId } = { playerId: 1 };
  const byId: Record<string, (id: number) => Promise<unknown>> = {
    "announcements.update": (id) => caller.announcements.update({ id, number: 1 }),
    "announcements.delete": (id) => caller.announcements.delete({ id }),
    "champions.update": (id) => caller.champions.update({ id, name: "x" }),
    "champions.delete": (id) => caller.champions.delete({ id }),
    "circuits.update": (id) => caller.circuits.update({ id, name: "x", type: "default" }),
    "circuits.delete": (id) => caller.circuits.delete({ id }),
    "circuits.phases.update": (id) => caller.circuits.phases.update({ id, tournamentId: fixtures.tournamentId, sortOrder: 1 }),
    "circuits.phases.delete": (id) => caller.circuits.phases.delete({ id }),
    "circuits.podiums.update": (id) => caller.circuits.podiums.update({ id, playerId, circuitId: fixtures.circuitId, points: 1 }),
    "circuits.podiums.delete": (id) => caller.circuits.podiums.delete({ id }),
    "clubs.update": (id) => caller.clubs.update({ id, name: "x" }),
    "clubs.delete": (id) => caller.clubs.delete({ id }),
    "cups.update": (id) => caller.cups.update({ id, prizePool: 1 }),
    "cups.delete": (id) => caller.cups.delete({ id }),
    "events.update": (id) => caller.events.update({ id, name: "x" }),
    "events.delete": (id) => caller.events.delete({ id }),
    "events.setLinks": (id) => caller.events.setLinks({ eventId: id, links: [] }),
    "insignias.update": (id) => caller.insignias.update({ id, level: 1 }),
    "insignias.delete": (id) => caller.insignias.delete({ id }),
    "links.updateGroup": (id) => caller.links.updateGroup({ id, label: "x" }),
    "links.deleteGroup": (id) => caller.links.deleteGroup({ id }),
    "links.updateLink": (id) => caller.links.updateLink({ id, label: "x" }),
    "links.deleteLink": (id) => caller.links.deleteLink({ id }),
    "locations.update": (id) => caller.locations.update({ id, name: "x", type: "city" }),
    "locations.delete": (id) => caller.locations.delete({ id }),
    "norms.update": (id) => caller.norms.update({ id, name: "x" }),
    "norms.delete": (id) => caller.norms.delete({ id }),
    "players.update": (id) => caller.players.update({ id, rapid: 1500 }),
    "playersToInsignias.unlink": (id) => caller.playersToInsignias.unlink({ id }),
    "playersToRoles.unlink": (id) => caller.playersToRoles.unlink({ id }),
    "playersToTitles.unlink": (id) => caller.playersToTitles.unlink({ id }),
    "posts.update": (id) => caller.posts.update({ id, published: true }),
    "posts.delete": (id) => caller.posts.delete({ id }),
    "roles.update": (id) => caller.roles.update({ id, name: "x" }),
    "roles.delete": (id) => caller.roles.delete({ id }),
    "titles.update": (id) => caller.titles.update({ id, name: "x" }),
    "titles.delete": (id) => caller.titles.delete({ id }),
    "tournamentPodiums.update": (id) => caller.tournamentPodiums.update({ id, playerId, tournamentId: fixtures.tournamentId, place: 1 }),
    "tournamentPodiums.delete": (id) => caller.tournamentPodiums.delete({ id }),
    "tournaments.update": (id) => caller.tournaments.update({ id, name: "x" }),
    "tournaments.delete": (id) => caller.tournaments.delete({ id }),
    "tvSergipe.update": (id) => caller.tvSergipe.update({ id, clubId: fixtures.clubId, playerId, ageGroup: "8", sex: "male", modality: "individual", place: 1 }),
    "tvSergipe.delete": (id) => caller.tvSergipe.delete({ id }),
  };

  for (const [procedure, call] of Object.entries(byId)) {
    test(`${procedure} returns NOT_FOUND for a missing id and BAD_REQUEST for an invalid one`, async () => {
      await expect(call(MISSING_ID)).rejects.toMatchObject({ code: "NOT_FOUND" });
      await expect(call(0)).rejects.toMatchObject({ code: "BAD_REQUEST" });
    });
  }
});
