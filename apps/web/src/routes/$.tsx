import { createFileRoute } from "@tanstack/react-router";

import { NotFound } from "@/components/not-found";

export const Route = createFileRoute("/$")({
  head: () => ({ meta: [{ title: "404 - FSX" }] }),
  component: NotFound,
});
