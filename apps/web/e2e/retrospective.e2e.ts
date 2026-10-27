import { expect, test } from "@playwright/test";

import { PLAYER } from "./fixtures";

test("season retrospective renders slides that can be browsed", async ({ page }) => {
  await page.goto(`/jogadores/${PLAYER.id}/temporada/2026`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Gerar retrospectiva" }).click();
  const dialog = page.getByRole("dialog", { name: /Retrospectiva 2026/ });
  const slides = dialog.locator("img");
  await expect(slides.first()).toBeVisible();
  expect(await slides.count()).toBeGreaterThanOrEqual(2);
  await expect(dialog.getByText(/^1 de \d+$/)).toBeVisible();
  await dialog.getByRole("button", { name: "Próxima imagem" }).click();
  await expect(dialog.getByText(/^2 de \d+$/)).toBeVisible();
  if (process.env.RETRO_SHOT) {
    await page.waitForTimeout(600);
    await page.screenshot({ path: process.env.RETRO_SHOT });
  }
});
