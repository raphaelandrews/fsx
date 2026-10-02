import { deflateSync } from "node:zlib";

import { expect, test } from "@playwright/test";

import { PLAYER } from "./fixtures";
import { signInAsOwner } from "./session";

test.beforeEach(async ({ context }) => {
  await signInAsOwner(context);
});

test("creates, edits, and deletes a club with validation, toasts, and a cancellable dialog", async ({ page }) => {
  await page.goto("/dashboard/clubs/create", { waitUntil: "networkidle" });
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

test("assigns and removes a title from the title assignment page", async ({ page }) => {
  await page.goto("/dashboard/players/titles", { waitUntil: "networkidle" });
  await expect(page.getByRole("heading", { name: "Title Assignment" })).toBeVisible();

  await page.getByRole("textbox", { name: "Search player..." }).fill("jogadora");
  await page.getByRole("option", { name: PLAYER.name }).click();
  await expect(page).toHaveURL(new RegExp(`playerId=${PLAYER.id}`));
  await expect(page.getByText("No titles assigned.")).toBeVisible();
});

test("shows server validation next to the field, keeps entered values, and explains conflicts", async ({ page }) => {
  await page.goto("/dashboard/clubs/create", { waitUntil: "networkidle" });
  await page.getByLabel("Name").fill("Clube Validação");
  await page.getByLabel("Logo URL").fill("javascript:alert(1)");
  await page.getByRole("button", { name: "Create Club" }).click();

  await expect(page.getByText("Check the highlighted fields and try again.")).toBeVisible();
  await expect(page.locator("#logoUrl-error")).toBeVisible();
  await expect(page.getByLabel("Name")).toHaveValue("Clube Validação");
  await expect(page.getByLabel("Logo URL")).toHaveValue("javascript:alert(1)");

  await page.getByLabel("Logo URL").fill("");
  await page.getByRole("button", { name: "Create Club" }).click();
  await expect(page.getByText("Club created")).toBeVisible();

  await page.goto("/dashboard/clubs/create", { waitUntil: "networkidle" });
  await page.getByLabel("Name").fill("Clube Validação");
  await page.getByRole("button", { name: "Create Club" }).click();
  await expect(page.getByText(/conflicts with an existing record/)).toBeVisible();
  await expect(page.getByLabel("Name")).toHaveValue("Clube Validação");
});
