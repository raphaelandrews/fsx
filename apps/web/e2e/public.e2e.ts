import { expect, test } from "@playwright/test";

import { E2E_ORIGIN, PLAYER, POST } from "./fixtures";

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

test("redirects the legacy records URL to statistics", async ({ page }) => {
  await page.goto("/recordes", { waitUntil: "networkidle" });
  await expect(page).toHaveURL(/\/estatisticas$/);
  await expect(page.getByRole("heading", { name: "Estatísticas" })).toBeVisible();
});

test("statistics charts use grouped comparisons and a 100% tier bar", async ({ page }) => {
  await page.goto("/estatisticas", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Jogadores ativos por faixa de rating" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Torneios por nível" })).toBeVisible();
  await expect(page.getByRole("img", { name: "Jogadores ativos por faixa de rating e formato" })).toBeVisible();
  await expect(page.getByRole("img", { name: /Distribuição proporcional de .* torneios por nível/ })).toBeVisible();
  const formats = page.getByRole("list", { name: "Formatos de rating" });
  await expect(formats.getByText("Clássico")).toBeVisible();
  await expect(formats.getByText("Rápido")).toBeVisible();
  await expect(formats.getByText("Blitz")).toBeVisible();

  await page.setViewportSize({ width: 375, height: 812 });
  const ratingHeading = await page.getByRole("heading", { name: "Jogadores ativos por faixa de rating" }).boundingBox();
  const tiersHeading = await page.getByRole("heading", { name: "Torneios por nível" }).boundingBox();
  expect(ratingHeading).not.toBeNull();
  expect(tiersHeading).not.toBeNull();
  expect(tiersHeading!.y).toBeGreaterThan(ratingHeading!.y);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("player ranking positions are grouped in tiles below the ratings", async ({ page }) => {
  await page.goto(`/jogadores/${PLAYER.id}`, { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Posições no ranking" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Variação de rating" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Evolução de rating" })).toBeVisible();
  const evolutionChart = page.getByRole("img", { name: "Evolução do rating nos torneios recentes" });
  await expect(evolutionChart).toBeVisible();
  const yTicks = (await evolutionChart.locator("text").allTextContents())
    .map((label) => Number(label.replaceAll(",", "")))
    .filter(Number.isFinite);
  expect(yTicks.length).toBeGreaterThan(0);
  expect(Math.min(...yTicks)).toBeGreaterThan(0);
  const openPosition = page.getByText(/Absoluto #/).first();
  await expect(openPosition).toBeVisible();
  expect(await openPosition.evaluate((element) => getComputedStyle(element).fontSize)).toBe("16px");
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

test("an unknown record keeps the site navigation and points to the right section", async ({ page }) => {
  const response = await page.goto("/jogadores/999999", { waitUntil: "networkidle" });
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Página não encontrada" })).toBeFocused();
  await expect(page.getByText("Não encontramos este jogador.")).toBeVisible();
  await expect(page.getByRole("link", { name: /Federação Sergipana de Xadrez — início/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Ver ratings" })).toHaveAttribute("href", "/ratings");

  await page.getByRole("link", { name: "Voltar ao início" }).click();
  await expect(page).toHaveURL(/\/$/);
});

test("publishes an RSS feed with the news and announces it in the page head", async ({ page, request }) => {
  const response = await request.get("/rss.xml");
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toContain("application/rss+xml");
  const xml = await response.text();
  expect(xml).toContain('<rss version="2.0"');
  expect(xml).toContain(`/noticias/${POST.slug}`);

  await page.goto("/", { waitUntil: "networkidle" });
  await expect(page.locator('link[rel="alternate"][type="application/rss+xml"]')).toHaveAttribute("href", "/rss.xml");
});

test("browses the tournament archive, filters it, and opens a tournament", async ({ page }) => {
  await page.goto("/torneios");
  await expect(page.getByRole("heading", { level: 1, name: "Torneios" })).toBeVisible();
  const first = page.locator('main a[href^="/torneios/"]').first();
  await expect(first).toBeVisible();

  await page.getByRole("combobox", { name: "Ritmo" }).click();
  await page.getByRole("option", { name: "Rápido" }).click();
  await expect(page).toHaveURL(/ritmo=rapid/);
  await expect(page.getByRole("button", { name: "Limpar filtros" })).toBeVisible();
  await page.getByRole("button", { name: "Limpar filtros" }).click();
  await expect(page).not.toHaveURL(/ritmo=/);

  await first.click();
  await expect(page).toHaveURL(/\/torneios\/\d+$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
});

test("an unknown tournament keeps the site navigation", async ({ page }) => {
  const response = await page.goto("/torneios/999999");
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("link", { name: "Torneios" }).first()).toBeVisible();
});

test("the calendar lists this year's events by month", async ({ page }) => {
  await page.goto("/calendario");
  await expect(page.getByRole("heading", { level: 1, name: "Calendário" })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: "dezembro" })).toBeVisible();
  await expect(page.getByText("Evento Fixture")).toBeVisible();

  await page.getByRole("link", { name: "fevereiro" }).click();
  await expect(page).toHaveURL(/mes=2/);
  await expect(page.getByText(/^Nenhum evento em fevereiro de \d{4}\.$/)).toBeVisible();
});

test("shows the ranking history on a profile", async ({ page }) => {
  await page.goto(`/jogadores/${PLAYER.id}`);
  await expect(page.getByRole("heading", { name: "Posição no ranking" })).toBeVisible();
});

test("compares two players from a profile and keeps the pair in the URL", async ({ page }) => {
  await page.goto(`/jogadores/${PLAYER.id}`);
  await page.getByRole("link", { name: "Comparar com outro jogador" }).click();
  await expect(page).toHaveURL(new RegExp(`/comparar\\?a=${PLAYER.id}`));
  await page.waitForLoadState("networkidle");

  await page.getByLabel("Jogador 2").fill("Atleta Extra 1");
  await page.getByRole("option", { name: "Atleta Extra 1", exact: true }).first().click();
  await expect(page).toHaveURL(/b=\d+/);
  await expect(page.getByText("Torneios em comum", { exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Rating Rápido", exact: true })).toBeVisible();

  await page.getByRole("link", { name: "Inverter lados" }).click();
  await expect(page).toHaveURL(new RegExp(`b=${PLAYER.id}`));
});

test("share images: a profile points at a rendered 1200×630 PNG, and unknown subjects 404", async ({ page, request }) => {
  await page.goto(`/jogadores/${PLAYER.id}`);
  const content = await page.locator('meta[property="og:image"]').getAttribute("content");
  expect(content).toMatch(new RegExp(`/api/og/player/${PLAYER.id}\\.png\\?v=[0-9a-z]+$`));

  const response = await request.get(new URL(content!).pathname + new URL(content!).search);
  expect(response.status()).toBe(200);
  expect(response.headers()["content-type"]).toBe("image/png");
  expect(response.headers()["cache-control"]).toContain("immutable");
  const png = await response.body();
  expect(png.subarray(1, 4).toString()).toBe("PNG");
  const view = new DataView(png.buffer, png.byteOffset);
  expect([view.getUint32(16), view.getUint32(20)]).toEqual([1200, 630]);

  expect((await request.get("/api/og/player/999999.png")).status()).toBe(404);
  expect((await request.get("/api/og/player/abc.png")).status()).toBe(404);
  expect((await request.get("/api/og/other/1.png")).status()).toBe(404);
});
