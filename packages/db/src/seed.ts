import { config } from "dotenv";

import { createDb } from "./index";
import * as schema from "./schema";

config({ path: "../../apps/web/.env" });
config({ path: "../../.env" });

async function seed() {
  console.log("🌱 Seeding database...");

  const db = createDb();

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
      { role: "Presidente", shortRole: "PRES", type: "management" },
      { role: "Vice-Presidente", shortRole: "VICE", type: "management" },
      { role: "Secretário", shortRole: "SEC", type: "management" },
      { role: "Árbitro Estadual", shortRole: "AE", type: "referee" },
      { role: "Árbitro Nacional", shortRole: "AN", type: "referee" },
      { role: "Professor", shortRole: "PROF", type: "teacher" },
    ])
    .onConflictDoNothing();

  console.log("  → titles");
  await db
    .insert(schema.titles)
    .values([
      { title: "Mestre Nacional", shortTitle: "MN", type: "internal" },
      { title: "Mestre Internacional", shortTitle: "MI", type: "external" },
      { title: "Mestre FIDE", shortTitle: "MF", type: "external" },
      { title: "Candidato a Mestre", shortTitle: "CM", type: "external" },
      { title: "Mestre Feminina FIDE", shortTitle: "WFM", type: "external" },
    ])
    .onConflictDoNothing();

  console.log("  → players");
  await db
    .insert(schema.players)
    .values([
      {
        name: "Andrews Souza",
        verified: true,
        active: true,
        sex: false,
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
        sex: true,
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
        sex: false,
        rapid: 1750,
        blitz: 1700,
        classic: 1780,
        locationId: saoCristovao?.id,
      },
      {
        name: "Ana Santos",
        verified: false,
        active: true,
        sex: true,
        rapid: 1650,
        blitz: 1600,
        classic: 1680,
        locationId: lagarto?.id,
      },
      {
        name: "Pedro Lima",
        verified: false,
        active: false,
        sex: false,
        rapid: 1550,
        blitz: 1500,
        classic: 1570,
        locationId: itabaiana?.id,
      },
    ])
    .onConflictDoNothing();

  console.log("✅ Seed complete.");
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
