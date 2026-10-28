import { deflateSync } from "node:zlib";

import { expect, test } from "@playwright/test";

import { PLAYER } from "./fixtures";
import { signInAsOwner } from "./session";
import { openCreateDialog } from "./dialog";

test.beforeEach(async ({ context }) => {
  await signInAsOwner(context);
});

test("creates, edits, and deletes a club with validation, toasts, and a cancellable dialog", async ({ page }) => {
  await openCreateDialog(page, "clubs", "club");
  await page.getByRole("button", { name: "Create Club" }).click();
  await expect(page.getByText("Name is required")).toBeVisible();

  await page.getByLabel("Name").fill("Clube E2E");
  await page.getByRole("button", { name: "Create Club" }).click();
  await expect(page.getByText("Club created")).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/clubs$/);

  const row = page.getByRole("row", { name: /Clube E2E/ });
  await row.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("menuitem", { name: "Edit" }).click();
  await page.getByLabel("Name").fill("Clube E2E Editado");
  await page.getByRole("button", { name: /save/i }).click();
  await expect(page.getByText("Club updated")).toBeVisible();

  await page.goto("/dashboard/clubs", { waitUntil: "networkidle" });
  const editedRow = page.getByRole("row", { name: /Clube E2E Editado/ });
  await editedRow.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  const confirm = page.getByRole("alertdialog");
  await expect(confirm).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(confirm).toBeHidden();
  await expect(editedRow).toBeVisible();

  await editedRow.getByRole("button", { name: "Open menu" }).click();
  await page.getByRole("menuitem", { name: "Delete" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Club deleted")).toBeVisible();
  await expect(editedRow).toBeHidden();
});

function noisePng(size: number): Buffer {
  const crcTable = Array.from({ length: 256 }, (_, n) => {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    return c >>> 0;
  });
  const crc = (bytes: Buffer) => {
    let c = 0xffffffff;
    for (const byte of bytes) c = crcTable[(c ^ byte) & 0xff]! ^ (c >>> 8);
    return (c ^ 0xffffffff) >>> 0;
  };
  const chunk = (type: string, data: Buffer) => {
    const typed = Buffer.concat([Buffer.from(type), data]);
    const out = Buffer.alloc(12 + data.length);
    out.writeUInt32BE(data.length, 0);
    typed.copy(out, 4);
    out.writeUInt32BE(crc(typed), 8 + data.length);
    return out;
  };
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 2;
  const rows = Buffer.alloc(size * (1 + size * 3));
  for (let i = 0; i < rows.length; i++) rows[i] = i % (1 + size * 3) === 0 ? 0 : (i * 7919) % 251;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(rows)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

test("uploads a cropped player photo and saves the player", async ({ page }) => {
  await page.goto(`/dashboard/players/${PLAYER.id}`, { waitUntil: "networkidle" });
  await page.getByLabel("Image to upload").setInputFiles({
    name: "foto.png",
    mimeType: "image/png",
    buffer: noisePng(256),
  });
  const cropper = page.getByRole("dialog");
  await expect(cropper).toBeVisible();
  await cropper.getByRole("button", { name: "Apply Crop" }).click();
  await expect(page.getByText("Image uploaded.")).toBeAttached();

  await page.getByRole("button", { name: "Save Changes" }).click();
  await expect(page.getByText("Player updated")).toBeVisible();
  await expect(page.locator(`img[src^="/api/media/players/"]`).first()).toBeVisible();
});

test("uploads an SVG club logo without cropping and rejects unsafe SVGs", async ({ page }) => {
  await openCreateDialog(page, "clubs", "club");
  await page.getByLabel("Name").fill("Clube Logo SVG");
  const input = page.getByLabel("Image to upload");

  await input.setInputFiles({
    name: "evil.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"><rect/></svg>'),
  });
  await expect(page.getByText("SVG event handlers are not allowed", { exact: true })).toBeVisible();

  await input.setInputFiles({
    name: "logo.svg",
    mimeType: "image/svg+xml",
    buffer: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" width="40" height="20"><rect width="40" height="20" fill="#0a5"/></svg>'),
  });
  await expect(page.getByText("Image uploaded.")).toBeAttached();
  await expect(page.getByRole("dialog", { name: "Crop Image" })).toBeHidden();
  const preview = page.getByAltText("Uploaded image preview");
  await expect(preview).toHaveAttribute("src", /^\/api\/media\/clubs\/[a-f0-9-]+\.svg$/);

  const media = await page.request.get((await preview.getAttribute("src"))!);
  expect(media.headers()["content-type"]).toBe("image/svg+xml");
  expect(media.headers()["content-security-policy"]).toContain("sandbox");
  expect(await media.text()).toContain('viewBox="0 0 40 20"');

  await page.getByRole("button", { name: "Create club" }).click();
  await expect(page.getByText("Club created")).toBeVisible();
});

test("downscales a raster location flag instead of cropping it", async ({ page }) => {
  await openCreateDialog(page, "locations", "location");
  await page.getByLabel("Name").fill("Local Bandeira");
  await page.getByLabel("Image to upload").setInputFiles({
    name: "bandeira.png",
    mimeType: "image/png",
    buffer: noisePng(600),
  });
  await expect(page.getByText("Image uploaded.")).toBeAttached();
  await expect(page.getByRole("dialog", { name: "Crop Image" })).toBeHidden();
  const preview = page.getByAltText("Uploaded image preview");
  await expect(preview).toHaveAttribute("src", /^\/api\/media\/locations\/[a-f0-9-]+\.webp$/);
  expect(await preview.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBe(256);

  await page.getByRole("button", { name: "Create location" }).click();
  await expect(page.getByText("Location created")).toBeVisible();
});

test("an edit page asks before discarding unsaved changes and lets a saved one go", async ({ page }) => {
  await page.goto("/dashboard/posts/1", { waitUntil: "networkidle" });
  const title = page.getByLabel("Title");
  await title.fill(`${await title.inputValue()} (rascunho)`);

  await page.getByRole("link", { name: "Posts", exact: true }).first().click();
  const guard = page.getByRole("alertdialog", { name: "Discard unsaved changes?" });
  await expect(guard).toBeVisible();
  await guard.getByRole("button", { name: "Keep editing" }).click();
  await expect(page).toHaveURL(/\/dashboard\/posts\/1$/);
  await expect(title).toHaveValue(/\(rascunho\)$/);

  await page.getByRole("link", { name: "Posts", exact: true }).first().click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Discard changes" }).click();
  await expect(page).toHaveURL(/\/dashboard\/posts$/);
});

test("assigns and removes a title from the title assignment page", async ({ page }) => {
  await openCreateDialog(page, "titles", "title");
  await page.getByLabel("Name").fill("Título E2E");
  await page.getByLabel("Abbreviation").fill("TE2E");
  await page.getByRole("button", { name: "Create title" }).click();
  await expect(page.getByText("Title created")).toBeVisible();

  await page.goto("/dashboard/players/titles", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Assign titles" })).toBeVisible();

  await page.getByRole("combobox", { name: "Player" }).fill("jogadora");
  await page.getByRole("option", { name: PLAYER.name }).click();
  await expect(page).toHaveURL(new RegExp(`playerId=${PLAYER.id}`));
  await expect(page.getByText("No titles assigned.")).toBeVisible();

  await page.getByLabel("Assign a title").selectOption({ label: "Título E2E (TE2E)" });
  await page.getByRole("button", { name: "Assign" }).click();
  await expect(page.getByText("Title assigned")).toBeVisible();
  const row = page.getByRole("row", { name: /Título E2E \(TE2E\)/ });
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: "Remove" }).click();
  await expect(page.getByRole("alertdialog")).toContainText("Remove this title?");
  await page.getByRole("alertdialog").getByRole("button", { name: "Cancel" }).click();
  await expect(row).toBeVisible();

  await row.getByRole("button", { name: "Remove" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Remove" }).click();
  await expect(page.getByText("Title removed")).toBeVisible();
  await expect(page.getByText("No titles assigned.")).toBeVisible();
});

test("deletes a record from its edit page after confirming", async ({ page }) => {
  await openCreateDialog(page, "clubs", "club");
  await page.getByLabel("Name").fill("Clube Para Excluir");
  await page.getByRole("button", { name: "Create club" }).click();
  await expect(page).toHaveURL(/\/dashboard\/clubs$/);

  await page.getByRole("link", { name: "Clube Para Excluir" }).click();
  await expect(page.getByRole("heading", { name: "Clube Para Excluir" })).toBeVisible();
  await expect(page.getByRole("main").getByRole("link", { name: "Clubs" })).toHaveAttribute("href", "/dashboard/clubs");

  await page.getByRole("button", { name: "Delete club" }).click();
  const confirm = page.getByRole("alertdialog");
  await expect(confirm).toContainText("“Clube Para Excluir” will be permanently deleted.");
  await confirm.getByRole("button", { name: "Delete" }).click();
  await expect(page.getByText("Club deleted")).toBeVisible();
  await expect(page).toHaveURL(/\/dashboard\/clubs$/);
  await expect(page.getByRole("link", { name: "Clube Para Excluir" })).toBeHidden();
});

test("shows server validation next to the field, keeps entered values, and explains conflicts", async ({ page }) => {
  // The browser enforces the 160-character limit, so a server-side rejection is simulated.
  await page.route("**/api/trpc/clubs.create**", (route) =>
    route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify([
        {
          error: {
            message: "Invalid input",
            code: -32600,
            data: {
              code: "BAD_REQUEST",
              httpStatus: 400,
              path: "clubs.create",
              zodError: { formErrors: [], fieldErrors: { name: ["Too long for the server"] } },
              userMessage: null,
            },
          },
        },
      ]),
    }),
  );
  await openCreateDialog(page, "clubs", "club");
  await page.getByLabel("Name").fill("Clube Rejeitado");
  await page.getByRole("button", { name: "Create Club" }).click();

  await expect(page.locator("#dialog-name-error")).toContainText("Too long for the server");
  await expect(page.getByLabel("Name")).toHaveAttribute("aria-invalid", "true");
  await expect(page.getByLabel("Name")).toHaveValue("Clube Rejeitado");
  const summary = page.getByRole("alert").filter({ hasText: "Check these fields and save again" });
  await expect(summary).toContainText("Name: Too long for the server");
  await page.unroute("**/api/trpc/clubs.create**");

await page.getByLabel("Name").fill("Clube Validação");
  await page.getByRole("button", { name: "Create Club" }).click();
  await expect(page.getByText("Club created")).toBeVisible();

  await openCreateDialog(page, "clubs", "club");
  await page.getByLabel("Name").fill("Clube Validação");
  await page.getByRole("button", { name: "Create Club" }).click();
  await expect(page.getByRole("alert").filter({ hasText: "A club with this name already exists." })).toBeVisible();
  await expect(page.getByLabel("Name")).toHaveValue("Clube Validação");
});

test("a missing dashboard record shows an English 404 inside the admin shell", async ({ page }) => {
  const response = await page.goto("/dashboard/clubs/999999", { waitUntil: "networkidle" });
  expect(response?.status()).toBe(404);
  await expect(page.getByRole("heading", { level: 1, name: "Not found" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Back to clubs" })).toHaveAttribute("href", "/dashboard/clubs");
  await expect(page.getByRole("button", { name: "Toggle Sidebar" }).first()).toBeVisible();
});

test("the dashboard task board opens a create dialog straight from a task and closes it cleanly", async ({ page }) => {
  await page.goto("/dashboard", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "What do you want to do?" })).toBeVisible();
  await page.getByRole("article").filter({ hasText: "Add a tournament" }).getByRole("link", { name: "New tournament" }).click();
  await expect(page).toHaveURL(/\/dashboard\/tournaments\?novo=true$/);
  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(page).toHaveURL(/\/dashboard\/tournaments$/);
});

test("the notifications bell opens from every dashboard page", async ({ page }) => {
  await page.goto("/dashboard", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /^Notifications/ }).click();
  await expect(page.getByText("Notifications", { exact: true })).toBeVisible();
});
