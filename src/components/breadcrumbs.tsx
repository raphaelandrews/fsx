import * as React from "react";
import { Link, useRouter } from "@tanstack/react-router";

import { cn } from "~/lib/utils";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";

const pathDisplayNames: Record<string, string> = {
  noticias: "Notícias",
  campeoes: "Campeões",
  titulados: "Titulados",
  comunicados: "Comunicados",
  circuitos: "Circuitos",
  ratings: "Ratings",
  jogadores: "Jogadores",
  membros: "Membros",
  sobre: "Sobre",
};

const nonLinkablePaths = ['jogadores'];

export function Breadcrumbs() {
  const router = useRouter();
  const [path, setPath] = React.useState(router.state.location.pathname);

  React.useEffect((): (() => void) => {
    function handleRouteChange() {
      setPath(router.state.location.pathname);
    }

    const unsubscribe = router.subscribe("onResolved", handleRouteChange);
    return () => {
      unsubscribe();
    };
  }, [router]);

  const segments = path.split("/").filter((segment) => segment !== "");

  const getDisplayName = (segment: string) => {
    return pathDisplayNames[segment] || segment;
  };

  return (
    <Breadcrumb className="hidden md:block">
      <BreadcrumbList>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>
            <Link
              to="/"
              className={cn(
                "font-medium hover:underline underline-offset-2 transition",
                `${
                  segments.length === 0
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground"
                }`
              )}
            >
              Home
            </Link>
          </BreadcrumbPage>
        </BreadcrumbItem>
        {segments.map((segment, index) => {
          const pathSegment = `/${segments.slice(0, index + 1).join("/")}`;
          const isLast = index === segments.length - 1;
          const isNonLinkable = nonLinkablePaths.includes(segment);

          return (
            <React.Fragment key={pathSegment}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  {isNonLinkable ? (
                    <span
                      className={cn(
                        "font-medium underline-offset-2 max-w-[200px] truncate block",
                        isLast ? "text-foreground" : "text-muted-foreground"
                      )}
                      title={getDisplayName(segment)}
                    >
                      {getDisplayName(segment)}
                    </span>
                  ) : (
                    <Link
                      to={pathSegment}
                      className={cn(
                        "font-medium hover:underline underline-offset-2 transition max-w-[200px] truncate block",
                        isLast
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      title={getDisplayName(segment)}
                      aria-current={isLast ? "page" : undefined}
                    >
                      {getDisplayName(segment)}
                    </Link>
                  )}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
