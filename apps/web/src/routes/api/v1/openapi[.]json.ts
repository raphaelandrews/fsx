import { createFileRoute } from "@tanstack/react-router";

import { handleOpenApiRequest } from "@fsx/api/openapi";

export const Route = createFileRoute("/api/v1/openapi.json")({
  server: {
    handlers: {
      GET: ({ request }) => handleOpenApiRequest(request),
      OPTIONS: ({ request }) => handleOpenApiRequest(request),
    },
  },
});
