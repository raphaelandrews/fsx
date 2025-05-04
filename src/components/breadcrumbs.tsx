import * as React from "react";
import { Link, useRouter } from "@tanstack/react-router";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "~/components/ui/breadcrumb";
import { cn } from "~/lib/utils";

const pathDisplayNames: Record<string, string> = {
  noticias: "Notícias",
  campeoes: "Campeões",
  titulados: "Titulados",
  comunicados: "Comunicados",
  circuitos: "Circuitos",
  ratings: "Ratings",
  membros: "Membros",
  sobre: "Sobre",
};

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

          return (
            <React.Fragment key={pathSegment}>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>
                  <Link
                    to={pathSegment}
                    className={cn(
                      "font-medium hover:underline underline-offset-2 transition",
                      `${
                        isLast
                          ? "text-foreground"
                          : "text-muted-foreground hover:text-foreground"
                      }`
                    )}
                    aria-current={isLast ? "page" : undefined}
                  >
                    {getDisplayName(segment)}
                  </Link>
                </BreadcrumbPage>
              </BreadcrumbItem>
            </React.Fragment>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
