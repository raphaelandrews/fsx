import { fileURLToPath, URL as NodeURL } from "node:url";

import { config } from "dotenv";

config({ path: fileURLToPath(new NodeURL("../../../.env", import.meta.url)) });
config();

const runtimeEnv = typeof process === "undefined" ? {} : process.env;

export const env = new Proxy({} as Env, {
  get(_target, prop) {
    if (typeof prop !== "string") {
      return undefined;
    }

    return runtimeEnv[prop];
  },
});
