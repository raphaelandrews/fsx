import { createFileRoute } from "@tanstack/react-router";

import { Login } from "~/components/dashboard/login";

export const Route = createFileRoute("/dashboard/login")({
  component: LoginComp,
});

function LoginComp() {
  return <Login />;
}
