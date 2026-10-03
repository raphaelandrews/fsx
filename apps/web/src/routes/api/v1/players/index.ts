import { createFileRoute } from "@tanstack/react-router";

import { handlePublicPlayersRequest } from "@fsx/api/public-api";

export const Route = createFileRoute("/api/v1/players/")({
  server: {
    handlers: {
      GET: ({ request }) => handlePublicPlayersRequest(request),
      OPTIONS: ({ request }) => handlePublicPlayersRequest(request),
    },
  },
});
