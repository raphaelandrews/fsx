import { Button, buttonVariants } from "@fsx/ui/components/button";
import { cn } from "@fsx/ui/lib/utils";
import { useRouter } from "@tanstack/react-router";

function CenteredState({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh w-full flex-col items-center justify-center gap-2 px-4 text-center">
      {children}
    </div>
  );
}

export function NotFound() {
  return (
    <CenteredState>
      <h1 className="font-bold text-4xl">404</h1>
      <p className="text-muted-foreground">Página não encontrada</p>
      <a
        href="/"
        className={cn(buttonVariants({ size: "pill" }), "mt-4 active:scale-[0.96]")}
      >
        Voltar ao início
      </a>
    </CenteredState>
  );
}

export function ErrorFallback({
  homeHref = "/",
  homeLabel = "Voltar ao início",
}: {
  homeHref?: string;
  homeLabel?: string;
}) {
  const router = useRouter();

  return (
    <CenteredState>
      <h1 className="font-bold text-4xl">500</h1>
      <p className="text-muted-foreground">Algo deu errado. Tente novamente mais tarde.</p>
      <div className="mt-4 flex flex-wrap justify-center gap-2">
        <Button size="pill" onClick={() => void router.invalidate()}>
          Tentar novamente
        </Button>
        <a
          href={homeHref}
          className={cn(buttonVariants({ variant: "outline", size: "pill" }), "active:scale-[0.96]")}
        >
          {homeLabel}
        </a>
      </div>
    </CenteredState>
  );
}
