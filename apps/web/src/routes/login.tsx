import { Button } from "@fsx/ui/components/button";
import { Github01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { authClient } from "@/lib/auth-client";
import { buildSeo, withBrand } from "@/lib/seo";

export const Route = createFileRoute("/login")({
  head: () =>
    buildSeo({
      title: withBrand("Entrar"),
      description: "Acesso restrito à administração da Federação Sergipana de Xadrez.",
      path: "/login",
      noindex: true,
      canonical: false,
    }),
  // Resolve the session on the server before rendering, so the form paints
  // immediately instead of flashing a client-side loading spinner.
  beforeLoad: async () => {
    const { getUser } = await import("@/server/get-user");
    const session = await getUser();
    if (session) {
      throw redirect({ to: "/dashboard" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const [pending, setPending] = useState(false);
  return (
    <main className="flex min-h-dvh w-full items-center justify-center p-6">
      <div className="w-full max-w-md">
        <h1 className="mb-2 text-center text-3xl font-bold">Entrar</h1>
        <p className="mb-6 text-center text-muted-foreground">
          Entre com sua conta do GitHub para acessar o painel administrativo.
        </p>

        <Button
          variant="outline"
          className="w-full"
          loading={pending}
          onClick={async () => {
            setPending(true);
            const { error } = await authClient.signIn.social({
              provider: "github",
              callbackURL: "/dashboard",
            });
            if (error) {
              setPending(false);
              toast.error(error.message || "Não foi possível entrar com o GitHub.");
            }
          }}
        >
          <HugeiconsIcon icon={Github01Icon} className="mr-2 size-4" />
          Entrar com GitHub
        </Button>
      </div>
    </main>
  );
}
