import { expect, test, type Page } from "@playwright/test";

type TrpcCall = { procedures: string[]; method: string; status: number };

const MAX_REQUESTS_PER_NAVIGATION = 2;

function recordTrpc(page: Page) {
  const calls: TrpcCall[] = [];
  page.on("response", (response) => {
    const url = new URL(response.url());
    if (!url.pathname.startsWith("/api/trpc/")) return;
    calls.push({
      procedures: url.pathname.replace("/api/trpc/", "").split(","),
      method: response.request().method(),
      status: response.status(),
    });
  });
  return calls;
}

function expectPublicReads(calls: TrpcCall[]) {
  for (const call of calls) {
    expect(call.method, `${call.procedures.join(",")} method`).toBe("GET");
    expect([401, 403], `${call.procedures.join(",")} must not touch admin procedures`).not.toContain(call.status);
  }
  const procedures = calls.flatMap((call) => call.procedures);
  expect(new Set(procedures).size, `duplicate procedures: ${procedures.join(", ")}`).toBe(procedures.length);
}

for (const path of ["/", "/ratings", "/noticias", "/comunicados", "/jogadores/1"]) {
  test(`${path} hydrates from SSR data without refetching`, async ({ page }) => {
    const calls = recordTrpc(page);
    await page.goto(path, { waitUntil: "networkidle" });
    expect(calls.map((call) => call.procedures.join(","))).toEqual([]);
  });
}

test("client navigation stays within the request budget and reuses prefetched data", async ({ page }) => {
  await page.goto("/", { waitUntil: "networkidle" });
  const calls = recordTrpc(page);

  const ratings = page.getByRole("link", { name: "Rating", exact: true }).filter({ visible: true }).first();
  // waitForLoadState("networkidle") resolves at once on an already-idle page,
  // so wait for the intent-preload response itself.
  const prefetched = page.waitForResponse((response) => response.url().includes("players.withFilters"));
  await ratings.hover();
  await prefetched;
  const afterHover = calls.length;

  await ratings.click();
  await expect(page).toHaveURL(/\/ratings$/);
  await expect(page.getByRole("heading", { name: /Ratings/i }).first()).toBeVisible();
  await page.waitForTimeout(300);

  expect(calls.length, "clicking a hover-prefetched link must not refetch").toBe(afterHover);
  expect(calls.length).toBeLessThanOrEqual(MAX_REQUESTS_PER_NAVIGATION);
  expectPublicReads(calls);

  const news = recordTrpc(page);
  await page.getByRole("link", { name: "Notícias", exact: true }).filter({ visible: true }).first().click();
  await expect(page).toHaveURL(/\/noticias$/);
  await page.waitForLoadState("networkidle");
  expect(news.length).toBeLessThanOrEqual(MAX_REQUESTS_PER_NAVIGATION);
  expectPublicReads(news);
});

test("hovering the next-page button preloads that page so the click needs no request", async ({ page }) => {
  await page.goto("/ratings", { waitUntil: "networkidle" });
  const calls = recordTrpc(page);

  const next = page.getByRole("link", { name: "Próxima página" });
  const prefetched = page.waitForResponse(
    (response) => response.url().includes("players.withFilters") && response.url().includes("%22page%22%3A2"),
  );
  await next.hover();
  await prefetched;
  const afterHover = calls.length;

  await next.click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page.getByText("Atleta Extra 5", { exact: true })).toBeVisible();
  await page.waitForTimeout(300);
  expect(calls.length).toBe(afterHover);
  expectPublicReads(calls);
});
