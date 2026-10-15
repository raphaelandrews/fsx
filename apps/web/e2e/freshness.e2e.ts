import { expect, test, type Page } from "@playwright/test";

import { POST } from "./fixtures";
import { signInAsOwner } from "./session";

const EDITED_TITLE = "Notícia revisada";

// The slug is derived from the title, so restoring the title restores the slug.
async function renamePost(page: Page, title: string) {
  await page.goto("/dashboard/posts/1", { waitUntil: "networkidle" });
  await page.getByLabel("Title").fill(title);
  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText("Post updated")).toBeVisible();
}

async function newsViaClientNavigation(page: Page) {
  await page.goto("/", { waitUntil: "networkidle" });
  const response = page.waitForResponse((r) => r.url().includes("/api/trpc/posts.byPage"));
  await page.getByRole("link", { name: "Notícias", exact: true }).filter({ visible: true }).first().click();
  await response;
  await expect(page).toHaveURL(/\/noticias$/);
}

test("admin edits are immediate in the dashboard and eventually consistent for anonymous visitors", async ({
  browser,
}) => {
  const anonymous = await (await browser.newContext()).newPage();
  const adminContext = await browser.newContext();
  await signInAsOwner(adminContext);
  const admin = await adminContext.newPage();

  try {
    await newsViaClientNavigation(anonymous);
    await expect(anonymous.getByText(POST.title)).toBeVisible();

    await renamePost(admin, EDITED_TITLE);
    await admin.goto("/dashboard/posts", { waitUntil: "networkidle" });
    await expect(admin.getByRole("row", { name: new RegExp(EDITED_TITLE) })).toBeVisible();

    // Within the edge TTL the cached API response still carries the old title.
    await newsViaClientNavigation(anonymous);
    await expect(anonymous.getByText(POST.title)).toBeVisible();
    await expect(anonymous.getByText(EDITED_TITLE)).toBeHidden();

    // SSR reads D1 in-process, so a full page load is fresh immediately.
    await anonymous.goto("/noticias", { waitUntil: "networkidle" });
    await expect(anonymous.getByText(EDITED_TITLE)).toBeVisible();
  } finally {
    await renamePost(admin, POST.title);
    await adminContext.close();
  }
});
