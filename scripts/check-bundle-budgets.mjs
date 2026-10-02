import { readdir, readFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

const clientAssets = fileURLToPath(new URL("../apps/web/dist/client/assets/", import.meta.url));
const budgets = {
  totalGzipBytes: 1_500_000,
  largestChunkGzipBytes: 200_000,
  initialEntryGzipBytes: 160_000,
  xlsxGzipBytes: 170_000,
  ratingUpdateGzipBytes: 60_000,
  playerProfileGzipBytes: 50_000,
};

async function listJavaScript(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const paths = await Promise.all(entries.map(async (entry) => {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) return listJavaScript(path);
    return entry.isFile() && entry.name.endsWith(".js") ? [path] : [];
  }));
  return paths.flat();
}

const files = await listJavaScript(clientAssets);
if (files.length === 0) throw new Error("No client JavaScript bundles found; build the web app first.");

const assets = await Promise.all(files.map(async (path) => {
  const contents = await readFile(path);
  return {
    name: relative(clientAssets, path),
    gzipBytes: gzipSync(contents, { level: 9 }).byteLength,
  };
}));

const totalGzipBytes = assets.reduce((total, asset) => total + asset.gzipBytes, 0);
const largestChunk = assets.reduce((largest, asset) => asset.gzipBytes > largest.gzipBytes ? asset : largest);
const initialEntry = assets.find((asset) => /^index-[^/]+\.js$/.test(asset.name));
const failures = [];

function check(name, measured, maximum) {
  if (measured === undefined) {
    failures.push(`${name}: bundle not found`);
  } else if (measured > maximum) {
    failures.push(`${name}: ${measured} bytes exceeds ${maximum}`);
  }
}

check("Total client JavaScript (gzip)", totalGzipBytes, budgets.totalGzipBytes);
check("Largest client chunk (gzip)", largestChunk.gzipBytes, budgets.largestChunkGzipBytes);
check("Initial client entry (gzip)", initialEntry?.gzipBytes, budgets.initialEntryGzipBytes);
check("Excel export chunk (gzip)", assets.find((asset) => asset.name.startsWith("xlsx-"))?.gzipBytes, budgets.xlsxGzipBytes);
check("Rating update route chunk (gzip)", assets.find((asset) => asset.name.startsWith("rating-update-"))?.gzipBytes, budgets.ratingUpdateGzipBytes);
check("Player profile route chunk (gzip)", assets.find((asset) => asset.name.startsWith("player-profile-"))?.gzipBytes, budgets.playerProfileGzipBytes);

console.info(`Client JavaScript: ${assets.length} chunks, ${totalGzipBytes} gzip bytes; largest ${largestChunk.name} (${largestChunk.gzipBytes} bytes).`);
if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
}
