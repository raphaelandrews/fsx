// Serves the built app (worker + static assets) with seeded fixtures for Playwright.
import { E2E_ORIGIN, E2E_PORT } from "../e2e/fixtures";
import { startWorker } from "./worker-harness";

const miniflare = await startWorker({ origin: E2E_ORIGIN, port: E2E_PORT, assets: true });
await miniflare.ready;
console.log(`e2e server ready at ${E2E_ORIGIN}`);

const stop = async () => {
  await miniflare.dispose();
  process.exit(0);
};
process.on("SIGTERM", stop);
process.on("SIGINT", stop);
