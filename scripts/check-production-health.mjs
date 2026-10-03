// Production health check for scheduled alerting (.github/workflows/production-health.yml).
// Reads the last hour of Cloudflare analytics and exits non-zero (a failed
// workflow run notifies the repository owner) when:
//   - 5xx responses exceed MAX_5XX_RATIO of at least MIN_REQUESTS requests,
//   - 429 responses exceed MAX_429 (rate-limit spike),
//   - the Worker threw uncaught exceptions.
// Requires CLOUDFLARE_API_TOKEN (Account Analytics:Read, Zone Analytics:Read),
// CLOUDFLARE_ACCOUNT_ID, and CLOUDFLARE_ZONE_ID. Prints counts only.
const env = process.env;
const token = env.CLOUDFLARE_API_TOKEN;
const accountTag = env.CLOUDFLARE_ACCOUNT_ID;
const zoneTag = env.CLOUDFLARE_ZONE_ID;
const host = env.HEALTH_HOST ?? "www.fsx.org.br";
const scripts = (env.HEALTH_SCRIPTS ?? "fsx-web-raphael").split(",");
const windowMinutes = Number(env.HEALTH_WINDOW_MINUTES ?? 60);
const MAX_5XX_RATIO = Number(env.MAX_5XX_RATIO ?? 0.02);
const MIN_REQUESTS = Number(env.MIN_REQUESTS ?? 50);
const MAX_429 = Number(env.MAX_429 ?? 200);

if (!token || !accountTag || !zoneTag) {
  console.error("Set CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID, and CLOUDFLARE_ZONE_ID.");
  process.exit(2);
}

const end = new Date();
const start = new Date(end.getTime() - windowMinutes * 60_000);

const query = `query Health($accountTag: string!, $zoneTag: string!, $start: Time!, $end: Time!, $host: string!, $scripts: [string!]) {
  viewer {
    zones(filter: { zoneTag: $zoneTag }) {
      httpRequestsAdaptiveGroups(
        limit: 1000
        filter: { datetime_geq: $start, datetime_lt: $end, clientRequestHTTPHost: $host, requestSource: "eyeball" }
      ) {
        count
        dimensions { edgeResponseStatus }
      }
    }
    accounts(filter: { accountTag: $accountTag }) {
      workersInvocationsAdaptive(
        limit: 1000
        filter: { datetime_geq: $start, datetime_leq: $end, scriptName_in: $scripts }
      ) {
        sum { requests errors }
        dimensions { scriptName }
      }
    }
  }
}`;

const response = await fetch("https://api.cloudflare.com/client/v4/graphql", {
  method: "POST",
  headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  body: JSON.stringify({
    query,
    variables: { accountTag, zoneTag, start: start.toISOString(), end: end.toISOString(), host, scripts },
  }),
});
const payload = await response.json();
if (!response.ok || payload.errors?.length) {
  console.error("Cloudflare analytics query failed:", JSON.stringify(payload.errors ?? response.status));
  process.exit(2);
}

const groups = payload.data.viewer.zones[0]?.httpRequestsAdaptiveGroups ?? [];
const total = groups.reduce((sum, group) => sum + group.count, 0);
const serverErrors = groups
  .filter((group) => group.dimensions.edgeResponseStatus >= 500)
  .reduce((sum, group) => sum + group.count, 0);
const rateLimited = groups
  .filter((group) => group.dimensions.edgeResponseStatus === 429)
  .reduce((sum, group) => sum + group.count, 0);

const invocations = payload.data.viewer.accounts[0]?.workersInvocationsAdaptive ?? [];
const workerErrors = Object.fromEntries(scripts.map((name) => [name, 0]));
for (const row of invocations) workerErrors[row.dimensions.scriptName] += row.sum.errors;

const ratio = total ? serverErrors / total : 0;
console.info(
  `Last ${windowMinutes} min on ${host}: ${total} requests, ${serverErrors} 5xx (${(ratio * 100).toFixed(2)}%), ${rateLimited} 429; ` +
    `worker exceptions: ${Object.entries(workerErrors).map(([name, count]) => `${name}=${count}`).join(", ")}`,
);

const alerts = [];
if (total >= MIN_REQUESTS && ratio > MAX_5XX_RATIO) {
  alerts.push(`5xx rate ${(ratio * 100).toFixed(2)}% exceeds ${(MAX_5XX_RATIO * 100).toFixed(2)}%`);
}
if (rateLimited > MAX_429) alerts.push(`${rateLimited} rate-limited (429) responses exceed ${MAX_429}`);
for (const [name, count] of Object.entries(workerErrors)) {
  if (count > 0) alerts.push(`${name} threw ${count} uncaught exception(s)`);
}

if (alerts.length) {
  console.error(`Production health alert:\n${alerts.map((alert) => `  - ${alert}`).join("\n")}`);
  process.exit(1);
}
console.info("Production health OK.");
