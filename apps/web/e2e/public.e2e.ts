import { expect, test } from "@playwright/test";

import { E2E_ORIGIN, PLAYER } from "./fixtures";

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

test("downloads the Swiss Manager file without signing in", async ({ page }) => {
  await page.goto("/swiss-manager", { waitUntil: "networkidle" });
  const download = page.waitForEvent("download");
  await page.getByRole("button", { name: "Baixar Excel" }).click();
  expect((await download).suggestedFilename()).toMatch(/^swiss-manager-rapid-\d{4}-\d{2}-\d{2}\.xlsx$/);
  await expect(page.getByText(/\d+ jogador(es)? exportados?\./)).toBeVisible();
});

test("another website can read players and ratings from the public API", async ({ page }) => {
  // A real page served from 127.0.0.1 is a different origin from localhost on
  // the same loopback address; Chromium's local-network rules would block a
  // public or intercepted page from calling localhost at all.
  await page.goto(`${E2E_ORIGIN.replace("localhost", "127.0.0.1")}/robots.txt`);
  type Player = { id: number; name: string; classic: number; rapid: number; blitz: number };
  const result = await page.evaluate(async ({ origin, id }) => {
    const list = await fetch(`${origin}/api/v1/players`);
    const listBody = (await list.json()) as { count: number; players: Player[] };
    const one = await fetch(`${origin}/api/v1/players/${id}`);
    const oneBody = (await one.json()) as { player: Player };
    return { listStatus: list.status, count: listBody.count, first: listBody.players[0]!, oneStatus: one.status, player: oneBody.player };
  }, { origin: E2E_ORIGIN, id: PLAYER.id });
  expect(result.listStatus).toBe(200);
  expect(result.count).toBeGreaterThan(0);
  expect(Object.keys(result.first).sort()).toEqual(["blitz", "classic", "id", "name", "rapid"]);
  expect(result.oneStatus).toBe(200);
  expect(result.player).toMatchObject({ id: PLAYER.id, name: PLAYER.name });
});
