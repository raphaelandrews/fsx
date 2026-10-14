import { test } from "@playwright/test";
import { signInAsOwner } from "./session";
test("shot", async ({ page, context }) => {
  await signInAsOwner(context);
  await page.setViewportSize({ width: 1400, height: 900 });
  await page.goto("/dashboard/posts", { waitUntil: "networkidle" });
  await page.screenshot({ path: "/tmp/claude-1000/-home-raphael-Documents-projects-fsx/a8bc805f-ebaf-42cd-bab2-e47902d21b62/scratchpad/a1.png" });
  await page.goto("/dashboard/players/titles", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "System" }).click();
  await page.screenshot({ path: "/tmp/claude-1000/-home-raphael-Documents-projects-fsx/a8bc805f-ebaf-42cd-bab2-e47902d21b62/scratchpad/a2.png" });
});
