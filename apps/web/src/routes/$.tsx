import { createFileRoute, notFound } from "@tanstack/react-router";

import { NotFound } from "@/components/not-found";

export const Route = createFileRoute("/$")({
  loader: () => {
    throw notFound();
  },
  component: NotFound,
});
