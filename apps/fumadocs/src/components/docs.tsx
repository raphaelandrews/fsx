import { navigate } from "astro:transitions/client";
import type { AstroProviderProps } from "fumadocs-core/framework/astro";
import type { Root } from "fumadocs-core/page-tree";
import { DocsLayout } from "fumadocs-ui/layouts/docs";
import { DocsPage, type DocsPageProps } from "fumadocs-ui/layouts/docs/page";
import { RootProvider } from "fumadocs-ui/provider/astro";
import { lazy, Suspense, type ReactNode } from "react";

import SearchDialog from "./search";

// Only the API Reference page loads the OpenAPI UI and its highlighter.
const ApiReference = lazy(() => import("./api-reference").then((module) => ({ default: module.ApiReference })));

export function Docs({
  tree,
  children,
  pathname,
  params,
  page,
  apiReference = false,
}: {
  tree: Root;
  children: ReactNode;
  pathname: string;
  params: AstroProviderProps["params"];
  page?: DocsPageProps;
  apiReference?: boolean;
}) {
  return (
    <RootProvider
      pathname={pathname}
      params={params}
      navigate={navigate}
      theme={{ enabled: false }}
      search={{ SearchDialog }}
    >
      <DocsLayout
        tree={tree}
        themeSwitch={{
          enabled: false,
        }}
        nav={{
          title: "FSX Docs",
        }}
      >
        <DocsPage {...page}>
          {children}
          {apiReference ? (
            <Suspense fallback={null}>
              <ApiReference />
            </Suspense>
          ) : null}
        </DocsPage>
      </DocsLayout>
    </RootProvider>
  );
}
