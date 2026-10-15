import { Outlet, createFileRoute } from "@tanstack/react-router";

import { idParams } from "@/lib/route-params";

export const Route = createFileRoute("/_public/jogadores/$id")({
  params: idParams,
  component: () => <Outlet />,
});
