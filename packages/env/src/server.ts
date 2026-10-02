/// <reference types="@cloudflare/workers-types" />
import type { CloudflareEnv } from "../env.d.ts";

export type WorkerEnvironment = CloudflareEnv;
// For Cloudflare Workers, env is accessed via cloudflare:workers module
// Types are defined in env.d.ts based on your alchemy.run.ts bindings
export { env, waitUntil } from "cloudflare:workers";
