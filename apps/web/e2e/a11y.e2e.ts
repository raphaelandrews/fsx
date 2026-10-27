import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { PLAYER, POST } from "./fixtures";
import { signInAsOwner } from "./session";

// The app honors prefers-reduced-motion, so axe never samples mid-fade colors.
test.use({ reducedMotion: "reduce" });

// Best-practice rules about page structure: the outline a screen reader user navigates by.
const STRUCTURE_RULES = ["heading-order", "page-has-heading-one", "landmark-one-main", "region"];

async function expectNoSeriousViolations(page: Page, label: string) {
  // Contrast is only meaningful once finite enter animations (fades) have settled.
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every((animation) => animation.playState !== "running" || animation.effect?.getComputedTiming().iterations === Infinity),
  );
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .withRules(STRUCTURE_RULES)
    .analyze();
  const serious = results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical" || STRUCTURE_RULES.includes(violation.id))
    .map((violation) =>
      `${violation.id}: ${violation.help} → ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`,
    );
  expect(serious, `${label} accessibility violations`).toEqual([]);
}

const publicPages = ["/", "/ratings", "/comparar?a=1&b=2", "/noticias", `/noticias/${POST.slug}`, `/jogadores/${PLAYER.id}`, `/jogadores/${PLAYER.id}/temporada/2026`, "/comunicados", "/comunicados/1", "/titulados", "/membros", "/circuitos", "/campeoes", "/bullet", "/torneios", "/torneios/1", "/calendario", "/estatisticas", "/clubes", "/clubes/3", "/tv-sergipe", "/links", "/normas-tecnicas", "/sobre", "/swiss-manager", "/atualizar-cadastro", "/login"];

for (const path of publicPages) {
  test(`public page ${path} has no serious accessibility violations`, async ({ page }) => {
    await page.goto(path, { waitUntil: "networkidle" });
    await expectNoSeriousViolations(page, path);
  });
}

test("command menu dialog is accessible", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.keyboard.press("/");
  await expect(page.getByRole("dialog")).toBeVisible();
  await expectNoSeriousViolations(page, "command menu");
});

test.describe("dashboard", () => {
  test.beforeEach(async ({ context }) => {
    await signInAsOwner(context);
  });

  const dashboardPages = [
    "/dashboard",
    ...["announcements", "categories", "championships", "circuits", "clubs", "events", "insignias", "links", "locations", "norms", "players", "posts", "roles", "scoring-schemes", "titles", "tournament-podiums", "tournaments", "tv-sergipe"].flatMap(
      (section) => [`/dashboard/${section}`],
    ),
    `/dashboard/players/${PLAYER.id}`,
    `/dashboard/players/titles?playerId=${PLAYER.id}`,
    "/dashboard/posts/1",
    "/dashboard/announcements/1",
    "/dashboard/tournaments/1",
    "/dashboard/circuits/1",
    "/dashboard/events/1",
    "/dashboard/links/1",
    "/dashboard/tv-sergipe/1",
    "/dashboard/update-requests",
    "/dashboard/history",
    "/dashboard/post-preview/1",
    "/dashboard/backup",
    "/dashboard/cache",
    "/dashboard/swiss-manager",
    "/dashboard/user",
    "/rating-update",
  ];
  for (const path of dashboardPages) {
    test(`${path} has no serious accessibility violations`, async ({ page }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      await expectNoSeriousViolations(page, path);
    });
  }
});
