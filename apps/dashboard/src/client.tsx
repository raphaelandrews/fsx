/// <reference types="vinxi/types/client" />
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start";
import { createRouter } from "./router";

import { ThemeProvider } from "./components/theme-provider";

const router = createRouter();

hydrateRoot(
  document,
  <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
    <StartClient router={router} />
  </ThemeProvider>
);
