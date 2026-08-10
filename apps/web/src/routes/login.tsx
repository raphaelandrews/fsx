import { Button } from "@fsx/ui/components/button";
import { Github01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute } from "@tanstack/react-router";

import { authClient } from "@/lib/auth-client";
import Loader from "@/components/loader";

export const Route = createFileRoute("/login")({
  component: RouteComponent,
});

function RouteComponent() {
  const { isPending } = authClient.useSession();

  if (isPending) {
    return <Loader />;
  }

  return (
    <div className="mx-auto w-full mt-10 max-w-md p-6">
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
  );
}
