import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

import { PLAYER } from "./fixtures";
import { signInAsOwner } from "./session";

async function focusRingVisible(page: Page): Promise<boolean> {
  return page.evaluate(() => {
    const element = document.activeElement as HTMLElement | null;
    if (!element || element === document.body) return false;
    const style = getComputedStyle(element);
    const outlined = style.outlineStyle !== "none" && Number.parseFloat(style.outlineWidth) > 0;
    const ringed = style.boxShadow !== "none" && style.boxShadow !== "";
    return outlined || ringed;
  });
}

test.describe("dashboard keyboard and layout", () => {
  test.beforeEach(async ({ context }) => {
    await signInAsOwner(context);
  });

  test("row menus close on Escape and return focus to their trigger", async ({ page }) => {
    await page.goto("/dashboard/clubs/create", { waitUntil: "networkidle" });
    await page.getByLabel("Name").fill("Clube Teclado");
    await page.getByRole("button", { name: "Create Club" }).click();
    await expect(page).toHaveURL(/\/dashboard\/clubs$/);

    const trigger = page.getByRole("row", { name: /Clube Teclado/ }).getByRole("button", { name: "Open menu" });
    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(page.getByRole("menu")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("menu")).toBeHidden();
    await expect(trigger).toBeFocused();
    expect(await focusRingVisible(page)).toBe(true);
  });

  test("empty collections explain themselves and link to the create form", async ({ page }) => {
    await page.goto("/dashboard/norms", { waitUntil: "networkidle" });
    await expect(page.getByText("No norms yet.")).toBeVisible();
    await page.getByRole("link", { name: "Create the first one" }).click();
    await expect(page).toHaveURL(/\/dashboard\/norms\/create$/);
  });

  for (const path of ["/dashboard/clubs", "/dashboard/players", "/dashboard/tournaments", "/dashboard/tv-sergipe"]) {
    test(`${path} does not scroll the page sideways at 375 px`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(path, { waitUntil: "networkidle" });
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, "page-level horizontal overflow in px").toBeLessThanOrEqual(0);
    });
  }
});

test("keyboard focus is visible on public navigation", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.keyboard.press("Tab");
  expect(await focusRingVisible(page)).toBe(true);
});

test("pagination keeps keyboard focus and announces the new page", async ({ page }) => {
  await page.goto("/ratings", { waitUntil: "networkidle" });
  const next = page.getByRole("link", { name: "Próxima página" });
  await next.focus();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/page=2/);
  const nav = page.getByRole("navigation", { name: "Paginação" });
  await expect(nav.getByText("Página 2 de 2")).toBeAttached();
  expect(await nav.evaluate((element) => element.contains(document.activeElement))).toBe(true);
});

test.describe("dark theme", () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => window.localStorage.setItem("fsx-theme", "dark"));
  });
  test.use({ reducedMotion: "reduce" });

  for (const path of ["/", "/ratings", `/jogadores/${PLAYER.id}`, "/noticias", "/estatisticas", "/login"]) {
    test(`${path} meets AA contrast in the dark theme`, async ({ page }) => {
      await page.goto(path, { waitUntil: "networkidle" });
      await expect(page.locator("html")).toHaveClass(/dark/);
      const results = await new AxeBuilder({ page }).withRules(["color-contrast"]).analyze();
      const failures = results.violations.flatMap((violation) =>
        violation.nodes.map((node) => `${node.target.join(" ")}: ${node.any[0]?.message ?? ""}`),
      );
      expect(failures).toEqual([]);
    });
  }
});

test("pagination links work before hydration and point at clean URLs", async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto("/ratings");
  const next = page.getByRole("link", { name: "Próxima página" });
  await expect(next).toHaveAttribute("href", "/ratings?page=2");
  await next.click();
  await expect(page).toHaveURL(/\/ratings\?page=2$/);
  await expect(page.getByText("Atleta Extra 5", { exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Página anterior" })).toHaveAttribute("href", "/ratings");
  await context.close();
});

test("public pages do not shift layout while loading", async ({ page }) => {
  await page.addInitScript(() => {
    const state = window as unknown as { __cls: number };
    state.__cls = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as unknown as Array<{ value: number; hadRecentInput: boolean }>) {
        if (!entry.hadRecentInput) state.__cls += entry.value;
      }
    }).observe({ type: "layout-shift", buffered: true });
  });
  for (const path of ["/", "/ratings", "/noticias", `/jogadores/${PLAYER.id}`, "/tv-sergipe"]) {
    await page.goto(path, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    expect(cls, `${path} cumulative layout shift`).toBeLessThan(0.1);
  }
});
