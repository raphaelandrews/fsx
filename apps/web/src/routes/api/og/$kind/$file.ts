import { createFileRoute } from "@tanstack/react-router";

import { handleOgRequest } from "@/server/og-handler";

export const Route = createFileRoute("/api/og/$kind/$file")({
  server: {
    handlers: {
      GET: ({ request, params }) => handleOgRequest(request, params.kind, params.file),
      HEAD: ({ request, params }) => handleOgRequest(request, params.kind, params.file),
    },
  },
});
