import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { Miniflare } from "miniflare";

import { createDb } from "./index";
import * as schema from "./schema";

const wranglerConfigPath = fileURLToPath(
  new URL("../../../apps/web/.alchemy/local/wrangler.jsonc", import.meta.url),
);
const d1PersistRoot = fileURLToPath(
  new URL("../../../.alchemy/miniflare/v3", import.meta.url),
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
    const [aracaju, saoCristovao, lagarto, itabaiana] = await db
      .insert(schema.locations)
      .values([
        { name: "Aracaju", type: "city" },
        { name: "São Cristóvão", type: "city" },
        { name: "Lagarto", type: "city" },
        { name: "Itabaiana", type: "city" },
        { name: "Sergipe", type: "state" },
      ])
      .onConflictDoNothing()
      .returning();

    console.log("  → clubs");
    const [clubAracaju, clubUfs] = await db
      .insert(schema.clubs)
      .values([
        { name: "Clube de Xadrez de Aracaju" },
        { name: "Xadrez UFS" },
        { name: "Clube de Xadrez de Lagarto" },
        { name: "Itabaiana Chess Club" },
      ])
      .onConflictDoNothing()
      .returning();

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
    const [andrews, maria, carlos, ana, pedro] = await db
      .insert(schema.players)
      .values([
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
      ])
      .onConflictDoNothing()
      .returning();

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
        { clubId: clubAracaju!.id, ageGroup: "14", sex: "male", modality: "team", place: 1, points: schema.PLACE_POINTS[1]! },
        { clubId: clubUfs!.id, ageGroup: "12", sex: "female", modality: "team", place: 1, points: schema.PLACE_POINTS[1]! },
      ])
      .onConflictDoNothing();

    console.log("✅ Seed complete.");
  } finally {
    await miniflare.dispose();
  }
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
