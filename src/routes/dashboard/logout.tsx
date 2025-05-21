import { createFileRoute } from "@tanstack/react-router";
import { logoutFn } from "~/db/queries/auth/queries";

export const Route = createFileRoute("/dashboard/logout")({
  preload: false,
  loader: () => logoutFn(),
});
