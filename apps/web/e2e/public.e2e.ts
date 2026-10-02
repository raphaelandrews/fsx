import { expect, test } from "@playwright/test";

import { PLAYER } from "./fixtures";

test("navigates to the ratings and opens a player sheet", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.getByRole("link", { name: "Rating", exact: true }).filter({ visible: true }).first().click();
  await expect(page).toHaveURL(/\/ratings$/);

  await page.getByRole("button", { name: `Ver perfil de ${PLAYER.name}` }).click();
  const sheet = page.getByRole("dialog");
  await expect(sheet.getByText(PLAYER.name).first()).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(sheet).toBeHidden();
});

test("searches players from the keyboard command menu and opens the profile", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  await page.keyboard.press("/");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.type("jogadora");
  await expect(dialog.getByText(PLAYER.name)).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();

  await page.keyboard.press("/");
  await page.keyboard.type("jogadora");
  await dialog.getByText(PLAYER.name).click();
  await expect(page).toHaveURL(new RegExp(`/jogadores/${PLAYER.id}$`));
  await expect(page.getByRole("heading", { name: PLAYER.name })).toBeVisible();
});

test("renders the not-found page for unknown URLs", async ({ page }) => {
  const response = await page.goto("/pagina-que-nao-existe", { waitUntil: "networkidle" });
  expect(response?.status()).toBe(404);
  await expect(page.getByText(/não encontrada/i).first()).toBeVisible();
});

test("redirects anonymous visitors to login and starts the GitHub OAuth flow", async ({ page }) => {
  await page.goto("/dashboard", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/login$/);

  let authorizeUrl: URL | undefined;
  await page.route("https://github.com/**", (route) => {
    authorizeUrl = new URL(route.request().url());
    return route.abort();
  });
  await page.getByRole("button", { name: "Entrar com GitHub" }).click();
  await expect.poll(() => authorizeUrl?.pathname).toBe("/login/oauth/authorize");
  expect(authorizeUrl?.searchParams.get("client_id")).toBe("e2e-client");
});
