import { OPENAPI_DOCUMENT } from "@fsx/api/openapi";
import { createOpenAPIPage } from "fumadocs-openapi/ui";

const OpenAPIPage = createOpenAPIPage();

// The spec's server is relative ("/") for clients that import openapi.json;
// from the docs domain, "Send" must call the production site.
const document = {
  ...OPENAPI_DOCUMENT,
  servers: [{ url: "https://www.fsx.org.br", description: "Production" }],
};

// The page renders only the operations it is given, so list every one.
const operations = Object.entries(OPENAPI_DOCUMENT.paths).flatMap(([path, item]) =>
  Object.keys(item).map((method) => ({ path, method: method as "get" })),
);

export function ApiReference() {
  return (
    <OpenAPIPage
      payload={{ bundled: document as never }}
      operations={operations}
      showTitle
      showDescription
    />
  );
}
