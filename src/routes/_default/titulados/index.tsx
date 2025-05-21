import { useQuery } from "@tanstack/react-query";
import { createFileRoute, ErrorComponent } from "@tanstack/react-router";
import { BookmarkIcon } from "lucide-react";

import { titledPlayersQueryOptions } from "~/db/queries";
import { siteConfig } from "~/utils/config";

import { columns } from "~/components/titulados/components/columns";
import { DataTable } from "~/components/titulados/components/data-table";
import { Announcement } from "~/components/announcement";
import { NotFound } from "~/components/not-found";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "~/components/ui/page-header";

export const Route = createFileRoute("/_default/titulados/")({
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(titledPlayersQueryOptions());
  },
  head: () => ({
    meta: [
      {
        title: `Titulados | ${siteConfig.name}`,
        description: "Titulados FSX",
        ogUrl: `${siteConfig.url}/titulados`,
        image: `${siteConfig.url}/og/og.jpg`,
      },
    ],
  }),
  errorComponent: ErrorComponent,
  notFoundComponent: () => <NotFound />,
  component: RouteComponent,
});

function RouteComponent() {
  const { data, error } = useQuery(titledPlayersQueryOptions());

  if (error) {
    return <ErrorComponent error={error} />;
  }

  return (
    <>
      <PageHeader>
        <Announcement icon={BookmarkIcon} />
        <PageHeaderHeading>Titulados</PageHeaderHeading>
        <PageHeaderDescription>
          Jogadores titulados da FSX.
        </PageHeaderDescription>
      </PageHeader>

      <DataTable data={data ? data : []} columns={columns} />
    </>
  );
}
