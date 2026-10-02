import { describe, expect, test } from "bun:test";

import { ADMIN_QUERY_DEPENDENTS, type AdminDomain } from "./admin-mutations";

const domains = Object.keys(ADMIN_QUERY_DEPENDENTS) as AdminDomain[];

describe("admin invalidation map", () => {
  test("every domain with its own queries invalidates itself", () => {
    for (const domain of domains.filter((domain) => domain !== "playersTournament")) {
      expect(ADMIN_QUERY_DEPENDENTS[domain] as readonly string[]).toContain(domain);
    }
  });

  test("player-facing edits refresh player lists and details", () => {
    for (const domain of ["players", "playersToTitles", "playersToRoles", "playersToInsignias", "playersTournament", "clubs", "locations", "titles"] as const) {
      expect(ADMIN_QUERY_DEPENDENTS[domain] as readonly string[]).toContain("players");
    }
  });

  test("player edits refresh every public view that embeds player rows", () => {
    expect(ADMIN_QUERY_DEPENDENTS.players).toEqual(expect.arrayContaining([
      "topPlayers",
      "titledPlayers",
      "champions",
      "circuits",
      "roles",
      "tournaments",
      "tournamentPodiums",
      "cups",
      "tvSergipe",
      "swissManager",
    ]));
  });
});
