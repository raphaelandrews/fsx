import { createFileRoute } from "@tanstack/react-router";

import { FileExportIcon } from "@hugeicons/core-free-icons";

import { PageHeader } from "@/components/page-header";
import { SwissManagerExport } from "@/components/swiss-manager/swiss-manager-export";
import { buildSeo, withBrand } from "@/lib/seo";

export const Route = createFileRoute("/_public/swiss-manager")({
  head: () =>
    buildSeo({
      title: withBrand("Swiss Manager"),
      description:
        "Baixe a lista de jogadores da FSX em Excel, no formato de importação do Swiss Manager.",
      path: "/swiss-manager",
      noindex: true,
      canonical: false,
    }),
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div>
      <PageHeader icon={FileExportIcon}
        title="Swiss Manager"
        description="Gere a lista de jogadores para importar no Swiss Manager."
      />
      <div className="flex justify-center">
        <SwissManagerExport locale="pt" />
      </div>
    </div>
  );
}
