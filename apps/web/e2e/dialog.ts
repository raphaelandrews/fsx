import type { Page } from "@playwright/test";

export async function openCreateDialog(page: Page, path: string, noun: string) {
  await page.goto(`/dashboard/${path}`, { waitUntil: "networkidle" });
  await page.getByRole("button", { name: new RegExp(`^new ${noun}`, "i") }).click();
  return page.getByRole("dialog");
}
