import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_public/recordes")({
  beforeLoad: () => {
    throw redirect({ to: "/estatisticas", replace: true, statusCode: 308 });
  },
});
