import { type web as server } from "@fsx/infra/alchemy.run";

// This file infers types for the cloudflare:workers environment from your Alchemy Worker.
// @see https://alchemy.run/concepts/bindings/#type-safe-bindings

// alchemy.run.ts binds these two only when the variable is set, so they are not part of the inferred type.
export type CloudflareEnv = typeof server.Env & {
  TURNSTILE_SECRET_KEY?: string;
  CLOUDFLARE_CACHE_PURGE_TOKEN?: string;
};

declare global {
  type Env = CloudflareEnv;
}

declare module "cloudflare:workers" {
  namespace Cloudflare {
    export interface Env extends CloudflareEnv {}
  }
  // Provided by workerd; missing from the installed @cloudflare/workers-types.
  export function waitUntil(promise: Promise<unknown>): void;
}
