import { useState, type FormEvent } from "react";
import { Link, createFileRoute, useNavigate, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";
import z from "zod";

import { buttonVariants } from "@fsx/ui/components/button";
import { DropdownMenuItem } from "@fsx/ui/components/dropdown-menu";

import { AdminPageHeader } from "@/components/admin/page-header";
import { EmptyCollection } from "@/components/admin/empty-collection";
import { DataTable } from "@/components/data-table/data-table";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { Pagination } from "@/components/data-table/pagination";
import { RowLink } from "@/components/data-table/row-link";
import { SearchInput } from "@/components/data-table/search-input";
import { useTRPC } from "@/utils/trpc";

const PER_PAGE = 20;

const searchSchema = z.object({
  page: z.coerce.number().int().min(1).max(1_000).catch(1).optional(),
  name: z.string().trim().max(120).optional(),
});

export const Route = createFileRoute("/_auth/dashboard/players/")({
  head: () => ({ meta: [{ title: "Players - Admin - FSX" }] }),
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ page: search.page ?? 1, name: search.name }),
  loader: ({ context, deps }) =>
    context.queryClient.ensureQueryData(
      context.trpc.players.page.queryOptions({ page: deps.page, limit: PER_PAGE, name: deps.name }),
    ),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const router = useRouter();
  const navigate = useNavigate();
  const { page = 1, name } = Route.useSearch();

  const { data } = useSuspenseQuery(
    trpc.players.page.queryOptions({ page, limit: PER_PAGE, name }),
  );
  const { players, pagination } = data;

  const [searchInput, setSearchInput] = useState(name ?? "");

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    navigate({
      to: "/dashboard/players",
      search: { page: 1, name: searchInput.trim() || undefined },
    });
  };
  const pageSearch = (target: number) => ({ page: target, name });

  const columns: ColumnDef<(typeof players)[number]>[] = [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => <span className="tabular-nums text-muted-foreground">{row.original.id}</span>,
    },
    {
      accessorKey: "name",
      header: "Name",
      cell: ({ row }) => (
        <RowLink to="/dashboard/players/$id" id={row.original.id}>
          {row.original.name}
        </RowLink>
      ),
    },
    {
      accessorKey: "nickname",
      header: "Nickname",
      cell: ({ row }) => row.original.nickname ?? "—",
    },
    ...(["classic", "rapid", "blitz"] as const).map(
      (ratingType): ColumnDef<(typeof players)[number]> => ({
        accessorKey: ratingType,
        header: () => (
          <span className="block text-right">
            {ratingType[0]!.toUpperCase() + ratingType.slice(1)}
          </span>
        ),
        cell: ({ row }) => (
          <span className="block text-right tabular-nums">{row.original[ratingType]}</span>
        ),
      }),
    ),
    { id: "club", header: "Club", cell: ({ row }) => row.original.club?.name ?? "—" },
    { id: "location", header: "Location", cell: ({ row }) => row.original.location?.name ?? "—" },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <DataTableRowActions
          id={row.original.id}
          editTo="/dashboard/players/$id"
          noun="player"
          extraItems={
            <DropdownMenuItem
              render={
                <Link to="/dashboard/players/titles" search={{ playerId: row.original.id }} />
              }
            >
              Assign titles
            </DropdownMenuItem>
          }
        />
      ),
    },
  ];

  return (
    <>
      <AdminPageHeader
        title="Players"
        description={`${pagination.totalItems} registered players. Players are never deleted; mark them inactive instead.`}
        actions={
          <Link to="/dashboard/players/create" className={buttonVariants()}>
            New player
          </Link>
        }
      />
      <DataTable
        columns={columns}
        data={players}
        clientPagination={false}
        emptyState={
          name ? (
            `No players match “${name}”.`
          ) : (
            <EmptyCollection noun="players" createTo="/dashboard/players/create" />
          )
        }
        toolbar={() => (
          <form onSubmit={submitSearch} role="search" className="flex items-center gap-2">
            <SearchInput
              aria-label="Search players by name"
              placeholder="Search player..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
            />
          </form>
        )}
        pagination={() => (
          <Pagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            hasPreviousPage={pagination.hasPreviousPage}
            hasNextPage={pagination.hasNextPage}
            showLabel
            onPageChange={(target) =>
              navigate({ to: "/dashboard/players", search: pageSearch(target) })
            }
            onPagePreload={(target) =>
              void router.preloadRoute({ to: "/dashboard/players", search: pageSearch(target) })
            }
            getPageHref={(target) =>
              router.buildLocation({ to: "/dashboard/players", search: pageSearch(target) }).href
            }
          />
        )}
      />
    </>
  );
}
