import { createFileRoute } from "@tanstack/react-router";
import { handleMediaRequest } from "@fsx/api/media-handler";

export const Route = createFileRoute("/api/media/$")({
  server: {
    handlers: {
      GET: ({ request }) => handleMediaRequest(request),
      HEAD: ({ request }) => handleMediaRequest(request),
    },
  },
});
