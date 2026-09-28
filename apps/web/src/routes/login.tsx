import { Button } from "@fsx/ui/components/button";
import { Github01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute, redirect } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import { getUser } from "@/functions/get-user";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Login - FSX" }] }),
  // Resolve the session on the server before rendering, so the form paints
  // immediately instead of flashing a client-side loading spinner.
  beforeLoad: async () => {
    const session = await getUser();
    if (session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="flex min-h-dvh w-full items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-center text-3xl font-bold">Sign In</h1>
        <p className="mb-6 text-center text-muted-foreground">
          Entre com sua conta do GitHub para acessar o painel administrativo.
        </p>

        <Button
          variant="outline"
          className="w-full"
          onClick={() =>
            authClient.signIn.social({
              provider: "github",
              callbackURL: "/dashboard",
            })
          }
        >
          <HugeiconsIcon icon={Github01Icon} className="mr-2 size-4" />
          Entrar com GitHub
        </Button>
      </div>
    </div>
  );
}
