import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { PLAYER, POST } from "./fixtures";
import { signInAsOwner } from "./session";

async function expectNoSeriousViolations(page: Page, label: string) {
  const results = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
  const serious = results.violations
    .filter((violation) => violation.impact === "serious" || violation.impact === "critical")
    .map((violation) =>
      `${violation.id}: ${violation.help} → ${violation.nodes.map((node) => node.target.join(" ")).join(", ")}`,
    );
  expect(serious, `${label} accessibility violations`).toEqual([]);
}

const publicPages = ["/", "/ratings", "/noticias", `/noticias/${POST.slug}`, `/jogadores/${PLAYER.id}`, "/comunicados", "/sobre", "/login"];

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

  for (const path of ["/dashboard", "/dashboard/clubs", "/dashboard/clubs/create", `/dashboard/players/${PLAYER.id}`, `/dashboard/players/titles?playerId=${PLAYER.id}`]) {
    test(`${path} has no serious accessibility violations`, async ({ page }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      await expectNoSeriousViolations(page, path);
    });
  }
});
