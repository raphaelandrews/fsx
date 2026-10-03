import { readFileSync } from "node:fs";
import { fileURLToPath, URL as NodeURL } from "node:url";

import { Miniflare } from "miniflare";

import { inArray } from "drizzle-orm";

import { createDb } from "./index";
import { normalizeName } from "./normalize";
import * as schema from "./schema";

const wranglerConfigPath = fileURLToPath(
  new NodeURL("../../../apps/web/.alchemy/local/wrangler.jsonc", import.meta.url),
);
const d1PersistRoot = fileURLToPath(
  new NodeURL("../../../.alchemy/miniflare/v3", import.meta.url),
);

function readJsonc(path: string): any {
  const raw = readFileSync(path, "utf8");
  const stripped = raw
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/(^|[^:])\/\/.*$/gm, "$1")
    .replace(/,\s*([}\]])/g, "$1");
  return JSON.parse(stripped);
}

function getDatabaseId(): string {
  const config = readJsonc(wranglerConfigPath);
  const d1 = config.d1_databases?.find((db: any) => db.binding === "DB");
  if (!d1?.database_id) {
    throw new Error(
      `No D1 binding "DB" found in ${wranglerConfigPath}. Run "alchemy dev" first to generate the local config.`,
    );
  }
  return d1.database_id;
}

async function seed() {
  console.log("🌱 Seeding database...");

  const databaseId = getDatabaseId();
  const miniflare = new Miniflare({
    script: "",
    modules: true,
    defaultPersistRoot: d1PersistRoot,
    d1Persist: true,
    d1Databases: { DB: databaseId },
  });

  try {
    await miniflare.ready;
    const d1 = await miniflare.getD1Database("DB");
    const db = createDb(d1);

    console.log("  → locations");
    await db
      .insert(schema.locations)
      .values([
        { name: "Aracaju", type: "city" },
        { name: "São Cristóvão", type: "city" },
        { name: "Lagarto", type: "city" },
        { name: "Itabaiana", type: "city" },
        { name: "Sergipe", type: "state" },
      ])
      .onConflictDoNothing();
    const locationsByName = new Map(
      (await db.select().from(schema.locations)).map((row) => [row.name, row]),
    );
    const aracaju = locationsByName.get("Aracaju");
    const saoCristovao = locationsByName.get("São Cristóvão");
    const lagarto = locationsByName.get("Lagarto");
    const itabaiana = locationsByName.get("Itabaiana");

    console.log("  → clubs");
    await db
      .insert(schema.clubs)
      .values([
        { name: "Clube de Xadrez de Aracaju" },
        { name: "Xadrez UFS" },
        { name: "Clube de Xadrez de Lagarto" },
        { name: "Itabaiana Chess Club" },
      ])
      .onConflictDoNothing();
    const clubsByName = new Map((await db.select().from(schema.clubs)).map((row) => [row.name, row]));
    const clubAracaju = clubsByName.get("Clube de Xadrez de Aracaju");
    const clubUfs = clubsByName.get("Xadrez UFS");

    console.log("  → roles");
    await db
      .insert(schema.roles)
      .values([
        { name: "Presidente", shortName: "PRES", type: "management" },
        { name: "Vice-Presidente", shortName: "VICE", type: "management" },
        { name: "Secretário", shortName: "SEC", type: "management" },
        { name: "Árbitro Estadual", shortName: "AE", type: "referee" },
        { name: "Árbitro Nacional", shortName: "AN", type: "referee" },
        { name: "Professor", shortName: "PROF", type: "teacher" },
      ])
      .onConflictDoNothing();

    console.log("  → titles");
    await db
      .insert(schema.titles)
      .values([
        { name: "Mestre Nacional", shortName: "MN", type: "internal" },
        { name: "Mestre Internacional", shortName: "MI", type: "external" },
        { name: "Mestre FIDE", shortName: "MF", type: "external" },
        { name: "Candidato a Mestre", shortName: "CM", type: "external" },
        { name: "Mestre Feminina FIDE", shortName: "WFM", type: "external" },
      ])
      .onConflictDoNothing();

    console.log("  → players");
    const playerSeed = [
        {
          name: "Andrews Souza",
          verified: true,
          active: true,
          sex: "male",
          rapid: 2100,
          blitz: 2050,
          classic: 2150,
          locationId: aracaju?.id,
          clubId: clubAracaju?.id,
        },
        {
          name: "Maria Silva",
          verified: true,
          active: true,
          sex: "female",
          rapid: 1850,
          blitz: 1800,
          classic: 1900,
          locationId: aracaju?.id,
          clubId: clubUfs?.id,
        },
        {
          name: "Carlos Oliveira",
          verified: true,
          active: true,
          sex: "male",
          rapid: 1750,
          blitz: 1700,
          classic: 1780,
          locationId: saoCristovao?.id,
        },
        {
          name: "Ana Santos",
          verified: false,
          active: true,
          sex: "female",
          rapid: 1650,
          blitz: 1600,
          classic: 1680,
          locationId: lagarto?.id,
        },
        {
          name: "Pedro Lima",
          verified: false,
          active: false,
          sex: "male",
          rapid: 1550,
          blitz: 1500,
          classic: 1570,
          locationId: itabaiana?.id,
        },
      ];
    const playersByName = await ensurePlayers(db, playerSeed);
    const [andrews, maria, carlos, ana, pedro] = playerSeed.map((player) => playersByName.get(player.name));

    console.log("  → school results");
    await db
      .insert(schema.tvSergipe)
      .values([
        // Individual results
        { clubId: clubAracaju!.id, playerId: andrews?.id, ageGroup: "14", sex: "male", modality: "individual", place: 1, points: schema.PLACE_POINTS[1]! },
        { clubId: clubUfs!.id, playerId: maria?.id, ageGroup: "14", sex: "female", modality: "individual", place: 2, points: schema.PLACE_POINTS[2]! },
        { clubId: clubAracaju!.id, playerId: carlos?.id, ageGroup: "12", sex: "male", modality: "individual", place: 3, points: schema.PLACE_POINTS[3]! },
        { clubId: clubUfs!.id, playerId: ana?.id, ageGroup: "12", sex: "female", modality: "individual", place: 4, points: schema.PLACE_POINTS[4]! },
        { clubId: clubAracaju!.id, playerId: pedro?.id, ageGroup: "16", sex: "male", modality: "individual", place: 5, points: schema.PLACE_POINTS[5]! },
        // Team results
        { clubId: clubAracaju!.id, teamName: "A", ageGroup: "14", sex: "male", modality: "team", place: 1, points: schema.PLACE_POINTS[1]! },
        { clubId: clubAracaju!.id, teamName: "B", ageGroup: "14", sex: "male", modality: "team", place: 2, points: schema.PLACE_POINTS[2]! },
        { clubId: clubUfs!.id, teamName: "A", ageGroup: "12", sex: "female", modality: "team", place: 1, points: schema.PLACE_POINTS[1]! },
      ])
      .onConflictDoNothing();

    await seedTrophyPreview(db);

    console.log("✅ Seed complete.");
  } finally {
    await miniflare.dispose();
  }
}

type Db = ReturnType<typeof createDb>;

// Player names are not unique, so match by name instead of relying on conflicts.
async function ensurePlayers(db: Db, players: Array<Omit<schema.NewPlayer, "normalizedName">>) {
  const names = players.map((player) => player.name);
  const existing = new Set(
    (await db.select({ name: schema.players.name }).from(schema.players).where(inArray(schema.players.name, names)))
      .map((row) => row.name),
  );
  const missing = players.filter((player) => !existing.has(player.name));
  if (missing.length > 0) {
    await db
      .insert(schema.players)
      .values(missing.map((player) => ({ ...player, normalizedName: normalizeName(player.name) })));
  }
  const rows = await db.select().from(schema.players).where(inArray(schema.players.name, names));
  return new Map(rows.map((row) => [row.name, row]));
}

// Championship IDs 1–6 select the podium icon in apps/web/src/components/player/player-profile.tsx.
const TROPHY_CHAMPIONSHIPS = [
  { id: 1, name: "Absoluto", ratingType: "classic" },
  { id: 2, name: "Rápido", ratingType: "rapid" },
  { id: 3, name: "Blitz", ratingType: "blitz" },
  { id: 4, name: "Feminino", ratingType: "classic" },
  { id: 5, name: "Equipes", ratingType: "rapid" },
  { id: 6, name: "Sub-18", ratingType: "classic" },
  { id: 7, name: "Sub-14", ratingType: "rapid" },
  { id: 8, name: "Escolar", ratingType: "rapid" },
  { id: 9, name: "Universitário", ratingType: "blitz" },
  { id: 10, name: "Veteranos", ratingType: "classic" },
] as const;

async function seedTrophyPreview(db: Db) {
  console.log("  → championships, tournaments, and champion");
  await db
    .insert(schema.championships)
    .values(TROPHY_CHAMPIONSHIPS.map(({ id, name }) => ({ id, name })))
    .onConflictDoNothing();

  const tournamentNames = TROPHY_CHAMPIONSHIPS.map(({ name }) => `Campeonato Sergipano ${name} 2026`);
  await db
    .insert(schema.tournaments)
    .values(
      TROPHY_CHAMPIONSHIPS.map(({ id, ratingType }, index) => ({
        name: tournamentNames[index]!,
        date: `2026-${String(index + 1).padStart(2, "0")}-15`,
        ratingType,
        championshipId: id,
      })),
    )
    .onConflictDoNothing();
  const tournaments = await db
    .select({ id: schema.tournaments.id })
    .from(schema.tournaments)
    .where(inArray(schema.tournaments.name, tournamentNames));

  const champion = (await ensurePlayers(db, [{
    name: "Teste Troféus",
    verified: true,
    active: true,
    sex: "male",
    rapid: 2000,
    blitz: 2000,
    classic: 2000,
  }])).get("Teste Troféus")!;

  await db
    .insert(schema.tournamentPodiums)
    .values(tournaments.map((tournament) => ({ playerId: champion.id, tournamentId: tournament.id, place: 1 })))
    .onConflictDoNothing();
  console.log(`    player "Teste Troféus" (id ${champion.id}) has ${tournaments.length} championship titles`);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
