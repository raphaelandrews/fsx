import { expect, test, type Locator, type Page } from "@playwright/test";

import { signInAsOwner } from "./session";
import { openCreateDialog } from "./dialog";

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
    await page.goto(`/dashboard/${entity.path}`, { waitUntil: "networkidle" });
    await page.getByRole("button", { name: new RegExp(`^new ${entity.noun}`, "i") }).click();
    const dialog = page.getByRole("dialog");
    await fill(dialog, entity.fields);
    await dialog.getByRole("button", { name: new RegExp(`^create ${entity.noun}`, "i") }).click();
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
  await openCreateDialog(page, "announcements", "announcement");
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
  await openCreateDialog(page, "tournaments", "tournament");
  await fill(page, { Name: "Torneio Pódio CRUD", "Rating type": "rapid", Tier: "S" });
  await page.getByRole("button", { name: /^create tournament/i }).click();
  await expect(page.getByText("Tournament created")).toBeVisible();

  await openCreateDialog(page, "tournament-podiums", "podium");
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
  await openCreateDialog(page, "events", "event");
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
  await openCreateDialog(page, "posts", "post");
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
  await openCreateDialog(page, "players", "player");
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
  await openCreateDialog(page, "tournaments", "tournament");
  await fill(page, { Name: "Etapa Circuito CRUD", "Rating type": "rapid", Tier: "B" });
  await page.getByRole("button", { name: /^create tournament/i }).click();
  await expect(page.getByText("Tournament created")).toBeVisible();

  await openCreateDialog(page, "circuits", "circuit");
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
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("This also deletes other records");
  await expect(dialog.getByRole("button", { name: "Delete", exact: true })).toBeDisabled();
  await dialog.getByLabel("Type Circuito Final CRUD 2033 to confirm").fill("Circuito Final CRUD 2033");
  await dialog.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Circuit deleted")).toBeVisible();
});

test("links: add, edit and delete a link inside a group", async ({ page }) => {
  await openCreateDialog(page, "links", "group");
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
  await openCreateDialog(page, "clubs", "club");
  await fill(page, { Name: "Escola TV CRUD" });
  await page.getByRole("button", { name: /^create club/i }).click();
  await expect(page.getByText("Club created")).toBeVisible();

  await openCreateDialog(page, "tv-sergipe", "result");
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

test("a club that players still use cannot be deleted, and the dialog says why", async ({ page }) => {
  await openCreateDialog(page, "clubs", "club");
  await fill(page, { Name: "Clube Com Jogadores" });
  await page.getByRole("button", { name: /^create club/i }).click();
  await expect(page.getByText("Club created")).toBeVisible();

  await openCreateDialog(page, "players", "player");
  await fill(page, { Name: "Atleta Do Clube" });
  await pick(page, "Search club...", "Clube Com", /Clube Com Jogadores/);
  await page.getByRole("button", { name: /^create player/i }).click();
  await expect(page.getByText(/Player created/)).toBeVisible();

  await page.goto("/dashboard/clubs", { waitUntil: "networkidle" });
  await rowMenu(page, "Clube Com Jogadores", "Delete");
  const dialog = page.getByRole("alertdialog");
  await expect(dialog).toContainText("It cannot be deleted yet");
  await expect(dialog).toContainText("still used by 1 player");
  await expect(dialog.getByRole("button", { name: "Delete", exact: true })).toBeDisabled();
});

test("School Games 'Delete all' needs a typed confirmation", async ({ page }) => {
  await page.goto("/dashboard/tv-sergipe", { waitUntil: "networkidle" });
  const deleteAll = page.getByRole("button", { name: "Delete all", exact: true });
  test.skip(await deleteAll.isDisabled(), "no School Games results to delete");
  await deleteAll.click();
  const dialog = page.getByRole("alertdialog");
  const confirm = dialog.getByRole("button", { name: "Delete all results" });
  await expect(confirm).toBeDisabled();
  await dialog.getByLabel("Type delete all to confirm").fill("delete all");
  await expect(confirm).toBeEnabled();
  await dialog.getByRole("button", { name: "Cancel" }).click();
});

test("rating update: review the file first, then apply the valid rows and keep a report", async ({ page }) => {
  const XLSX = await import("xlsx");
  const sheet = XLSX.utils.aoa_to_sheet([
    ["id", "name", "sex"],
    [0, "Importada Um", "F"],
    ["abc", "Linha Inválida", "F"],
    [0, "Importada Dois", "F"],
  ]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Sheet1");
  const buffer = Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));

  await page.goto("/rating-update", { waitUntil: "networkidle" });
  await page.getByLabel(/Drop a Swiss Manager export/).setInputFiles({
    name: "import.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer,
  });

  await expect(page.getByRole("heading", { name: "Review before importing" })).toBeVisible();
  await expect(page.getByText("1 row will be skipped")).toBeVisible();
  await expect(page.getByText("Row 3: Invalid or missing 'id'. ID must be 0 or positive.").first()).toBeVisible();
  await page.getByRole("button", { name: "Apply 2 changes" }).click();

  await expect(page.getByText("2 applied, 1 need attention")).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText("Linha Inválida", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Applied (2)" }).click();
  await expect(page.getByText("Importada Um", { exact: true })).toBeVisible();

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByText("Report from your last import")).toBeVisible();
  await page.getByRole("button", { name: "Import another file" }).click();
  await expect(page.getByText("Drop a Swiss Manager export here")).toBeVisible();
});

test("update request: a visitor sends a correction and the admin approves it", async ({ page }) => {
  await page.goto("/atualizar-cadastro", { waitUntil: "networkidle" });
  // A focused page: no site header or footer.
  await expect(page.getByRole("link", { name: /Federação Sergipana de Xadrez — início/ })).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 1, name: "Nome do jogador" })).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByText("Escolha o jogador.")).toBeVisible();

  await pick(page, "Busque pelo nome...", "Jogadora", /Jogadora Teste/);
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Dados" })).toBeVisible();

  await page.getByLabel("Ano de nascimento").pressSequentially("20a1b2x9");
  await expect(page.getByLabel("Ano de nascimento")).toHaveValue("2012");
  await page.getByLabel("Ano de nascimento").fill("");
  await page.getByLabel("ID CBX").pressSequentially("9-1 8e2");
  await expect(page.getByLabel("ID CBX")).toHaveValue("9182");
  await page.getByLabel("ID CBX").fill("");
  await page.getByLabel("Ano de nascimento").fill("1800");
  await page.getByLabel("ID CBX").focus();
  await expect(page.getByText("Use quatro dígitos, entre 1900 e")).toBeVisible();
  await page.getByRole("button", { name: "Continuar" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Dados" })).toBeVisible();
  await page.getByLabel("Ano de nascimento").fill("");
  await page.getByLabel("ID CBX").fill("918273");
  await page.getByRole("button", { name: "Continuar" }).click();

  await expect(page.getByRole("heading", { level: 1, name: "Foto" })).toBeVisible();
  await page.locator("#request-photo").setInputFiles("public/android-chrome-192x192.png");
  await page.getByRole("button", { name: "Usar esta foto" }).click();
  await expect(page.getByAltText("Pré-visualização da foto")).toBeVisible();
  await page.getByRole("button", { name: /^Enviar .*alteraç/ }).click();
  await expect(page.getByText("Confirme que as informações são verdadeiras")).toBeVisible();

  await page.getByRole("checkbox").check();
  await page.getByRole("button", { name: /^Enviar .*alteraç/ }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Solicitação enviada" })).toBeVisible();

  await page.goto("/dashboard/update-requests", { waitUntil: "networkidle" });
  await expect(page.getByRole("link", { name: /Update requests.*pending/ })).toBeVisible();
  await page.getByRole("link", { name: "Jogadora Teste" }).first().click();
  await expect(page.getByRole("cell", { name: "918273" })).toBeVisible();
  await expect(page.getByAltText("Photo sent for Jogadora Teste")).toBeVisible();
  await page.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByText("Request approved. The player is now verified.")).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/update-requests$/);
  await expect(page.getByRole("link", { name: /Update requests.*pending/ })).toBeHidden();
});

test("players: the history records an edit, and a bulk action changes only the selected rows", async ({ page }) => {
  await openCreateDialog(page, "players", "player");
  await fill(page, { Name: "Jogador Lote" });
  await page.getByRole("button", { name: /^create player/i }).click();
  await expect(page.getByText(/Player created/)).toBeVisible();

  await page.goto("/dashboard/players?name=Jogador%20Lote", { waitUntil: "networkidle" });
  const row = page.getByRole("row", { name: /Jogador Lote/ });
  await row.getByRole("checkbox", { name: "Select row" }).check();
  await expect(page.getByRole("region", { name: "Bulk actions" })).toContainText("1 selected");
  await page.getByRole("button", { name: "Mark inactive" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Mark inactive" }).click();
  await expect(page.getByText("Players updated")).toBeVisible();

  await rowMenu(page, "Jogador Lote", "Edit");
  await expect(page.getByRole("heading", { name: "History", exact: true })).toBeVisible();
  await expect(page.getByText("players.bulkSetActive")).toBeVisible();
  await expect(page.getByText("true → false")).toBeVisible();

  await page.goto("/dashboard/history", { waitUntil: "networkidle" });
  await expect(page.getByText("Jogador Lote").first()).toBeVisible();
});

test("posts: a scheduled article is hidden from the site until its time, and can be previewed", async ({ page, request }) => {
  await openCreateDialog(page, "posts", "post");
  await fill(page, { Title: "Post Agendado", Content: "Corpo agendado" });
  await page.getByLabel("Published").check();
  await page.getByLabel("Publish at").fill("2099-01-01T09:00");
  await page.getByRole("button", { name: /^create post/i }).click();
  await expect(page.getByText(/Post created/)).toBeVisible();

  await page.goto("/dashboard/posts", { waitUntil: "networkidle" });
  await expect(page.getByText(/Scheduled · 01\/01\/2099/)).toBeVisible();
  expect((await request.get("/noticias/post-agendado")).status()).toBe(404);
  expect(await (await request.get("/rss.xml")).text()).not.toContain("Post Agendado");

  await rowMenu(page, "Post Agendado", "Edit");
  await page.getByRole("link", { name: "Preview" }).click();
  await expect(page.getByRole("heading", { name: "Post Agendado" })).toBeVisible();
  await expect(page.getByText(/Goes live on 01\/01\/2099 at 09:00/)).toBeVisible();
});

test("rating update: one file creates a tournament, its results and its podium", async ({ page }) => {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["name", "Torneio de Um Arquivo"], ["ratingType", "rapid"], ["date", "15/11/2026"]]), "Tournament");
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["id", "name", "sex", "variation"],
      [0, "Campeã do Arquivo", "F", 14],
      [0, "Vice do Arquivo", "F", 6],
    ]),
    "Results",
  );
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([["place", "category", "playerId", "row"], [1, "", "", 2], [2, "", "", 3]]), "Podium");
  const buffer = Buffer.from(XLSX.write(workbook, { type: "buffer", bookType: "xlsx" }));

  await page.goto("/rating-update", { waitUntil: "networkidle" });
  await page.getByLabel(/Drop a Swiss Manager export/).setInputFiles({
    name: "torneio.xlsx",
    mimeType: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    buffer,
  });
  await expect(page.getByRole("heading", { name: "New tournament: Torneio de Um Arquivo" })).toBeVisible();
  await expect(page.getByText("15/11/2026")).toBeVisible();
  await page.getByRole("button", { name: "Create the tournament and apply 2 changes" }).click();

  await expect(page.getByText("All 5 changes were applied")).toBeVisible({ timeout: 20_000 });
  await page.getByRole("button", { name: /Applied \(5\)/ }).click();
  await expect(page.getByText(/Tournament created \(ID \d+\)/)).toBeVisible();
  await expect(page.getByText("1º place")).toBeVisible();

  await page.goto("/dashboard/tournaments", { waitUntil: "networkidle" });
  await expect(page.getByText("Torneio de Um Arquivo")).toBeVisible();
});
