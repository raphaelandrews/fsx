/// <reference types="vinxi/types/client" />
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start";
import { Analytics } from "@vercel/analytics/react";

import { createRouter } from "./router";
import { Providers } from "./components/providers";

const router = createRouter();

hydrateRoot(
  document,
  <>
    <Providers>
      <StartClient router={router} />
    </Providers>
    <Analytics />
  </>
);
