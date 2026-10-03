import { createFileRoute } from "@tanstack/react-router";

import { handlePublicPlayerRequest } from "@fsx/api/public-api";

export const Route = createFileRoute("/api/v1/players/$id")({
  server: {
    handlers: {
      GET: ({ request, params }) => handlePublicPlayerRequest(request, params.id),
      OPTIONS: ({ request, params }) => handlePublicPlayerRequest(request, params.id),
    },
  },
});
