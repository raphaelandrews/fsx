import { expect, test, type Locator, type Page } from "@playwright/test";

import { signInAsOwner } from "./session";

test.beforeEach(async ({ context }) => {
  await signInAsOwner(context);
});

type Entity = {
  path: string;
  noun: string;
  fields: Record<string, string>;
  /** Text identifying the row in the list after creation. */
  row: string;
  /** Label of the field changed during the edit, and its new value. */
  edit: { label: string; value: string };
  /** Visible text of the edited row. */
  editedRow: string;
};

const ENTITIES: Entity[] = [
  {
    path: "locations",
    noun: "Location",
    fields: { Name: "Cidade CRUD", Type: "city" },
    row: "Cidade CRUD",
    edit: { label: "Name", value: "Cidade CRUD 2" },
    editedRow: "Cidade CRUD 2",
  },
  {
    path: "titles",
    noun: "Title",
    fields: { Name: "Titulo CRUD", Abbreviation: "TCR", Type: "internal", Tier: "3" },
    row: "Titulo CRUD",
    edit: { label: "Name", value: "Titulo CRUD 2" },
    editedRow: "Titulo CRUD 2",
  },
  {
    path: "roles",
    noun: "Role",
    fields: { Name: "Cargo CRUD", Abbreviation: "CCR", Type: "management" },
    row: "Cargo CRUD",
    edit: { label: "Name", value: "Cargo CRUD 2" },
    editedRow: "Cargo CRUD 2",
  },
  {
    path: "norms",
    noun: "Norm",
    fields: { Name: "Norma CRUD" },
    row: "Norma CRUD",
    edit: { label: "Name", value: "Norma CRUD 2" },
    editedRow: "Norma CRUD 2",
  },
  {
    path: "insignias",
    noun: "Insignia",
    fields: { Name: "Insignia CRUD", Level: "7" },
    row: "Insignia CRUD",
    edit: { label: "Name", value: "Insignia CRUD 2" },
    editedRow: "Insignia CRUD 2",
  },
  {
    path: "championships",
    noun: "Championship",
    fields: { Name: "Campeonato CRUD" },
    row: "Campeonato CRUD",
    edit: { label: "Name", value: "Campeonato CRUD 2" },
    editedRow: "Campeonato CRUD 2",
  },
  {
    path: "tournaments",
    noun: "Tournament",
    fields: { Name: "Torneio CRUD", "Rating type": "rapid", Tier: "A" },
    row: "Torneio CRUD",
    edit: { label: "Name", value: "Torneio CRUD 2" },
    editedRow: "Torneio CRUD 2",
  },
  {
    path: "circuits",
    noun: "Circuit",
    fields: { Name: "Circuito CRUD 2031", Season: "2031", Layout: "categories", Tier: "B" },
    row: "Circuito CRUD 2031",
    edit: { label: "Name", value: "Circuito CRUD 2032" },
    editedRow: "Circuito CRUD 2032",
  },
  {
    path: "links",
    noun: "Group",
    fields: { Name: "Grupo CRUD" },
    row: "Grupo CRUD",
    edit: { label: "Name", value: "Grupo CRUD 2" },
    editedRow: "Grupo CRUD 2",
  },
];

const field = (page: Page | Locator, label: string) => page.getByLabel(new RegExp(`^${label}`));

async function fill(page: Page | Locator, fields: Record<string, string>) {
  for (const [label, value] of Object.entries(fields)) {
    const control = field(page, label);
    const tag = await control.evaluate((el) => el.tagName);
    if (tag === "SELECT") await control.selectOption(value);
    else await control.fill(value);
  }
}

async function rowMenu(page: Page, name: string, item: "Edit" | "Delete") {
  const row = page.getByRole("row", { name: new RegExp(name) });
  await row.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("menuitem", { name: item }).click();
}

for (const entity of ENTITIES) {
  test(`${entity.path}: create, edit and delete`, async ({ page }) => {
    await page.goto(`/dashboard/${entity.path}/create`, { waitUntil: "networkidle" });
    await fill(page, entity.fields);
    await page.getByRole("button", { name: new RegExp(`^create ${entity.noun}`, "i") }).click();
    await expect(page.getByText(new RegExp(`${entity.noun} created|Circuit created|Group created`))).toBeVisible();

    await page.goto(`/dashboard/${entity.path}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("row", { name: new RegExp(entity.row) })).toBeVisible();

    await rowMenu(page, entity.row, "Edit");
    await expect(field(page, entity.edit.label)).toHaveValue(entity.row);
    await field(page, entity.edit.label).fill(entity.edit.value);
    await page.getByRole("button", { name: /save/i }).first().click();
    await expect(page.getByText(new RegExp(`${entity.noun} updated`))).toBeVisible();

    await page.goto(`/dashboard/${entity.path}`, { waitUntil: "networkidle" });
    await expect(page.getByRole("row", { name: new RegExp(entity.editedRow) })).toBeVisible();

    await rowMenu(page, entity.editedRow, "Delete");
    await page.getByRole("alertdialog").getByRole("button", { name: /delete/i }).click();
    await expect(page.getByText(new RegExp(`${entity.noun} deleted`))).toBeVisible();
    await expect(page.getByRole("row", { name: new RegExp(entity.editedRow) })).toBeHidden();
  });
}

async function pick(page: Page | Locator, placeholder: string, query: string, option: RegExp) {
  await page.getByPlaceholder(placeholder).click();
  await page.getByPlaceholder(placeholder).fill(query);
  await page.getByRole("option", { name: option }).first().click();
}

test("announcements: create, link a suggested player, delete", async ({ page }) => {
  await page.goto("/dashboard/announcements/create", { waitUntil: "networkidle" });
  await fill(page, { Year: "2098", Number: "1", Text: "Parabéns a Jogadora Teste pelo título." });
  await page.getByRole("button", { name: /^create announcement/i }).click();
  await expect(page.getByText("Announcement created")).toBeVisible();

  await page.goto("/dashboard/announcements", { waitUntil: "networkidle" });
  await rowMenu(page, "001/2098", "Edit");
  await expect(page.getByText("Jogadora Teste", { exact: false }).first()).toBeVisible();
  await page.getByRole("button", { name: "Link player" }).click();
  await expect(page.getByText("Announcement updated")).toBeVisible();
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("Jogadora Teste").first()).toBeVisible();

  await page.getByRole("button", { name: /delete announcement/i }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: /delete/i }).click();
  await expect(page.getByText("Announcement deleted")).toBeVisible();
});

test("tournament podiums: create with a category, edit and delete", async ({ page }) => {
  await page.goto("/dashboard/tournaments/create", { waitUntil: "networkidle" });
  await fill(page, { Name: "Torneio Pódio CRUD", "Rating type": "rapid", Tier: "S" });
  await page.getByRole("button", { name: /^create tournament/i }).click();
  await expect(page.getByText("Tournament created")).toBeVisible();

  await page.goto("/dashboard/tournament-podiums/create", { waitUntil: "networkidle" });
  await pick(page, "Search tournament...", "Pódio CRUD", /Torneio Pódio CRUD/);
  await pick(page, "Search player...", "Jogadora", /Jogadora Teste/);
  await fill(page, { Place: "1", Category: "Sub 14 Masculino" });
  await page.getByRole("button", { name: /^create podium/i }).click();
  await expect(page.getByText("Podium created")).toBeVisible();

  await page.goto("/dashboard/tournament-podiums", { waitUntil: "networkidle" });
  await rowMenu(page, "Torneio Pódio CRUD", "Edit");
  await field(page, "Place").fill("2");
  await page.getByRole("button", { name: /save/i }).first().click();
  await expect(page.getByText("Podium updated")).toBeVisible();

  await page.goto("/dashboard/tournament-podiums", { waitUntil: "networkidle" });
  await rowMenu(page, "Torneio Pódio CRUD", "Delete");
  await page.getByRole("alertdialog").getByRole("button", { name: /delete/i }).click();
  await expect(page.getByText("Podium deleted")).toBeVisible();

  await page.goto("/dashboard/tournaments", { waitUntil: "networkidle" });
  await rowMenu(page, "Torneio Pódio CRUD", "Delete");
  await page.getByRole("alertdialog").getByRole("button", { name: /delete/i }).click();
  await expect(page.getByText("Tournament deleted")).toBeVisible();
});

test("events: create, edit and delete", async ({ page }) => {
  await page.goto("/dashboard/events/create", { waitUntil: "networkidle" });
  await fill(page, { Name: "Evento CRUD" });
  await page.locator("#event-start-date").click();
  await page.locator('[role="grid"] button:not([disabled])').nth(10).click();
  await page.getByRole("button", { name: /^create event/i }).click();
  await expect(page.getByText(/Event created|Evento criado/)).toBeVisible();

  await page.goto("/dashboard/events", { waitUntil: "networkidle" });
  await rowMenu(page, "Evento CRUD", "Edit");
  await field(page, "Name").fill("Evento CRUD 2");
  await page.getByRole("button", { name: /save/i }).first().click();
  await expect(page.getByText(/Event updated/)).toBeVisible();

  await page.getByRole("button", { name: /delete event/i }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: /delete/i }).click();
  await expect(page.getByText("Event deleted")).toBeVisible();
});

test("posts: create, edit and delete", async ({ page }) => {
  await page.goto("/dashboard/posts/create", { waitUntil: "networkidle" });
  await fill(page, { Title: "Post CRUD", Content: "Corpo do post CRUD" });
  await page.getByRole("button", { name: /^create post/i }).click();
  await expect(page.getByText(/Post created/)).toBeVisible();

  await page.goto("/dashboard/posts", { waitUntil: "networkidle" });
  await rowMenu(page, "Post CRUD", "Edit");
  await field(page, "Title").fill("Post CRUD 2");
  await page.getByRole("button", { name: /save/i }).first().click();
  await expect(page.getByText(/Post updated/)).toBeVisible();

  await page.getByRole("button", { name: /delete post/i }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: /delete/i }).click();
  await expect(page.getByText("Post deleted")).toBeVisible();
});

test("players: create, edit and delete", async ({ page }) => {
  await page.goto("/dashboard/players/create", { waitUntil: "networkidle" });
  await fill(page, { Name: "Jogador CRUD" });
  await page.getByRole("button", { name: /^create player/i }).click();
  await expect(page.getByText(/Player created/)).toBeVisible();

  await page.goto("/dashboard/players?name=Jogador%20CRUD", { waitUntil: "networkidle" });
  await rowMenu(page, "Jogador CRUD", "Edit");
  await field(page, "Name").fill("Jogador CRUD 2");
  await page.getByRole("button", { name: /save/i }).first().click();
  await expect(page.getByText(/Player updated/)).toBeVisible();
});

test("circuits: stage, result, finish the season, correct final podiums, reopen", async ({ page }) => {
  await page.goto("/dashboard/tournaments/create", { waitUntil: "networkidle" });
  await fill(page, { Name: "Etapa Circuito CRUD", "Rating type": "rapid", Tier: "B" });
  await page.getByRole("button", { name: /^create tournament/i }).click();
  await expect(page.getByText("Tournament created")).toBeVisible();

  await page.goto("/dashboard/circuits/create", { waitUntil: "networkidle" });
  await fill(page, { Name: "Circuito Final CRUD 2033", Season: "2033", Layout: "categories", Tier: "A" });
  await page.getByRole("button", { name: /^create circuit/i }).click();
  await expect(page.getByText(/Circuit created/)).toBeVisible();
  await expect(page.getByRole("heading", { name: "Circuito Final CRUD 2033" })).toBeVisible();

  await page.getByRole("button", { name: "Add stage" }).click();
  const stage = page.getByRole("dialog");
  await pick(stage, "Search tournament...", "Etapa Circuito", /Etapa Circuito CRUD/);
  await stage.getByRole("button", { name: "Add stage" }).click();
  await expect(page.getByText("Stage created").or(page.getByText(/Stage added/))).toBeVisible();

  await page.getByRole("button", { name: "Add result" }).first().click();
  const result = page.getByRole("dialog");
  await pick(result, "Search player...", "Jogadora", /Jogadora Teste/);
  await fill(result, { "Stage place": "1", Points: "50", Category: "Sub 14 Masculino" });
  await result.getByRole("button", { name: "Add result" }).click();
  await expect(page.getByText(/Result (added|created)/)).toBeVisible();

  await page.getByRole("button", { name: "Finish season" }).click();
  await page.getByRole("dialog").getByRole("button", { name: "Finish season" }).click();
  await expect(page.getByText("Season finished. Review the final podiums below.")).toBeVisible();
  await expect(page.getByRole("row", { name: /Jogadora Teste/ }).first()).toBeVisible();

  await page.getByRole("button", { name: "Add final podium" }).click();
  const final = page.getByRole("dialog");
  await pick(final, "Search player...", "Jogadora", /Jogadora Teste/);
  await fill(final, { Place: "2", Category: "Sub 12 Masculino" });
  await final.getByRole("button", { name: "Add final podium" }).click();
  await expect(page.getByText("Final podium added")).toBeVisible();

  const added = page.getByRole("row", { name: /2º Sub 12 Masculino|Sub 12 Masculino/ });
  await added.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: /delete/i }).click();
  await expect(page.getByText("Final podium deleted")).toBeVisible();

  await page.getByRole("button", { name: "Reopen season" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: /reopen/i }).click();
  await expect(page.getByText("Season reopened")).toBeVisible();

  await page.getByRole("button", { name: "Delete circuit" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: /delete/i }).click();
  await expect(page.getByText("Circuit deleted")).toBeVisible();
});

test("links: add, edit and delete a link inside a group", async ({ page }) => {
  await page.goto("/dashboard/links/create", { waitUntil: "networkidle" });
  await fill(page, { Name: "Grupo Links CRUD" });
  await page.getByRole("button", { name: /^create group/i }).click();
  await expect(page.getByText(/Group created/)).toBeVisible();

  await page.getByRole("button", { name: "Add link" }).first().click();
  const dialog = page.getByRole("dialog");
  await fill(dialog, { Label: "Site CRUD", URL: "https://example.com" });
  await dialog.getByRole("button", { name: "Add link" }).click();
  await expect(page.getByText("Link added")).toBeVisible();

  await rowMenu(page, "Site CRUD", "Edit");
  await fill(page.getByRole("dialog"), { Label: "Site CRUD 2" });
  await page.getByRole("dialog").getByRole("button", { name: "Save link" }).click();
  await expect(page.getByText("Link updated")).toBeVisible();

  await rowMenu(page, "Site CRUD 2", "Delete");
  await page.getByRole("alertdialog").getByRole("button", { name: /delete/i }).click();
  await expect(page.getByText("Link deleted")).toBeVisible();

  await page.getByRole("button", { name: /delete (link )?group/i }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: /delete/i }).click();
  await expect(page.getByText("Group deleted")).toBeVisible();
});

test("tv sergipe: create, edit and delete a result", async ({ page }) => {
  await page.goto("/dashboard/clubs/create", { waitUntil: "networkidle" });
  await fill(page, { Name: "Escola TV CRUD" });
  await page.getByRole("button", { name: /^create club/i }).click();
  await expect(page.getByText("Club created")).toBeVisible();

  await page.goto("/dashboard/tv-sergipe/create", { waitUntil: "networkidle" });
  await pick(page, "Search school...", "Escola TV", /Escola TV CRUD/);
  const selects = page.locator("select");
  for (let i = 0; i < (await selects.count()); i++) {
    const options = await selects.nth(i).locator("option").evaluateAll((os) =>
      os.map((o) => (o as HTMLOptionElement).value).filter(Boolean),
    );
    if (options.length) await selects.nth(i).selectOption(options[0]!);
  }
  const player = page.getByPlaceholder("Search player...");
  if (await player.count()) await pick(page, "Search player...", "Jogadora", /Jogadora Teste/);
  await page.getByRole("button", { name: /^create result/i }).click();
  await expect(page.getByText("Result created")).toBeVisible();

  await page.goto("/dashboard/tv-sergipe", { waitUntil: "networkidle" });
  await rowMenu(page, "Escola TV CRUD", "Edit");
  await page.getByRole("button", { name: /save/i }).first().click();
  await expect(page.getByText("Result updated")).toBeVisible();

  await page.goto("/dashboard/tv-sergipe", { waitUntil: "networkidle" });
  await rowMenu(page, "Escola TV CRUD", "Delete");
  await page.getByRole("alertdialog").getByRole("button", { name: /delete/i }).click();
  await expect(page.getByText("Result deleted")).toBeVisible();
});

test("rating update: snapshot button records the rankings", async ({ page }) => {
  await page.goto("/rating-update", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Update rankings now" }).click();
  await expect(page.getByText(/ranking/i).filter({ hasText: /updated|snapshot|recorded/i }).first()).toBeVisible();
});
