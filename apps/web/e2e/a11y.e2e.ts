import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { PLAYER, POST } from "./fixtures";
import { signInAsOwner } from "./session";

// The app honors prefers-reduced-motion, so axe never samples mid-fade colors.
test.use({ reducedMotion: "reduce" });

async function expectNoSeriousViolations(page: Page, label: string) {
  // Contrast is only meaningful once finite enter animations (fades) have settled.
  await page.waitForFunction(() =>
    document
      .getAnimations()
      .every((animation) => animation.playState !== "running" || animation.effect?.getComputedTiming().iterations === Infinity),
  );
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const serious = results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) =>
      `${violation.id}: ${violation.help} → ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`,
    );
  expect(serious, `${label} accessibility violations`).toEqual([]);
}

const publicPages = ["/", "/ratings", "/noticias", `/noticias/${POST.slug}`, `/jogadores/${PLAYER.id}`, "/comunicados", "/comunicados/1", "/titulados", "/membros", "/circuitos", "/campeoes", "/tv-sergipe", "/links", "/normas-tecnicas", "/sobre", "/swiss-manager", "/login"];

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
    ...["announcements", "championships", "circuits", "clubs", "events", "insignias", "links", "locations", "norms", "players", "posts", "roles", "titles", "tournament-podiums", "tournaments", "tv-sergipe"].flatMap(
      (section) => [`/dashboard/${section}`, `/dashboard/${section}/create`],
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
