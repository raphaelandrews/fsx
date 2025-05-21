import { useQuery } from "@tanstack/react-query";
import {
  createFileRoute,
  ErrorComponent,
  useNavigate,
  useSearch,
} from "@tanstack/react-router";
import { BarChart2Icon, InfoIcon } from "lucide-react";
import { z } from "zod";

import {
  playersWithFiltersQueryOptions,
  type PlayersFilters,
} from "~/db/queries";
import { siteConfig } from "~/utils/config";

import { Announcement } from "~/components/announcement";
import { NotFound } from "~/components/not-found";
import { DataTable } from "~/components/ratings/data-table";
import {
  columnsClassic,
  columnsRapid,
  columnsBlitz,
} from "~/components/ratings/columns";

import { Button } from "~/components/ui/button";
import {
  PageHeader,
  PageHeaderDescription,
  PageHeaderHeading,
} from "~/components/ui/page-header";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

const searchSchema = z
  .object({
    page: z.number().catch(1).default(1),
    limit: z.number().optional().catch(undefined),
    sortBy: z.enum(["rapid", "blitz", "classic"]).optional().catch(undefined),
    sex: z.union([z.boolean(), z.null()]).optional().catch(undefined),
    titles: z.array(z.string()).optional().catch([]),
    clubs: z.array(z.string()).optional().catch([]),
    groups: z.array(z.string()).optional().catch([]),
    locations: z.array(z.string()).optional().catch([]),
  })
  .transform((val) => ({
    ...val,
    page: Math.max(1, val.page),
  }));

export const Route = createFileRoute("/_default/ratings/")({
  validateSearch: (search) => searchSchema.parse(search),
  loaderDeps: ({ search }) => search,
  loader: async ({ context: { queryClient }, deps }) => {
    await queryClient.ensureQueryData(playersWithFiltersQueryOptions(deps));
  },
  head: () => ({
    meta: [
      {
        title: `Ratings | ${siteConfig.name}`,
        description: "Ratings da FSX",
        ogUrl: `${siteConfig.url}/rating`,
        image: `${siteConfig.url}/og/og-rating.jpg`,
      },
    ],
  }),
  errorComponent: ErrorComponent,
  notFoundComponent: () => <NotFound />,
  component: RouteComponent,
});

function RouteComponent() {
  const search = useSearch({ from: "/_default/ratings/" });
  const navigate = useNavigate();

  const defaultTab = search.sortBy || "rapid";
  const pageSize = search.limit || 20;

  const handleTabChange = (value: string) => {
    const validValue = ["classic", "rapid", "blitz"].includes(value)
      ? (value as "classic" | "rapid" | "blitz")
      : "rapid";

    navigate({
      to: "/ratings",
      search: (prev) => ({
        ...prev,
        sortBy: validValue,
        page: 1,
      }),
    });
  };

  const filters: PlayersFilters = {
    page: search.page,
    limit: search.limit,
    sortBy: search.sortBy || defaultTab,
    sex: search.sex,
    titles: search.titles,
    clubs: search.clubs,
    groups: search.groups,
    locations: search.locations,
  };

  const { data, isLoading } = useQuery(playersWithFiltersQueryOptions(filters));

  const players = data?.players ?? [];
  const totalPages = data?.pagination?.totalPages ?? 0;

  return (
    <>
      <PageHeader>
        <Announcement icon={BarChart2Icon} />
        <PageHeaderHeading>Ratings</PageHeaderHeading>
        <PageHeaderDescription>
          Confira as tabelas de rating.
        </PageHeaderDescription>
      </PageHeader>

      <Tabs defaultValue={defaultTab} onValueChange={handleTabChange}>
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-3 mb-4">
          <TabsList>
            <TabsTrigger value="classic" className="w-20 sm:w-24">
              Clássico
            </TabsTrigger>
            <TabsTrigger value="rapid" className="w-20 sm:w-24">
              Rápido
            </TabsTrigger>
            <TabsTrigger value="blitz" className="w-20 sm:w-24">
              Blitz
            </TabsTrigger>
          </TabsList>
          <Info />
        </div>

        <TabsContent value="classic">
          <DataTable
            data={players}
            columns={columnsClassic}
            totalPages={totalPages}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="rapid">
          <DataTable
            data={players}
            columns={columnsRapid}
            totalPages={totalPages}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="blitz">
          <DataTable
            data={players}
            columns={columnsBlitz}
            totalPages={totalPages}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </>
  );
}

const Info = () => {
  return (
    <div className="flex items-center gap-5">
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-8 h-8 rounded-full p-0">
            <InfoIcon className="h-4 w-4 text-primary" />
            <span className="sr-only">Open popover</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent>
          <div className="flex justify-start items-start gap-2 text-sm">
            <BarChart2Icon className="w-4 h-4 min-w-[1rem] rounded text-primary" />
            <div className="flex flex-col gap-2">
              <p>
                Na tabela de rating constam apenas os jogadores ativos na FSX.
              </p>
              <p>
                É considerado jogador ativo o enxadrista que participou de ao
                menos um torneio nos últimos dois anos.
              </p>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
};
