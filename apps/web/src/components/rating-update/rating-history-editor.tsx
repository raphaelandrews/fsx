import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { EntityFormDialog } from "@/components/admin/entity-form";
import { AdminSection } from "@/components/admin/form-layout";
import { DataTable } from "@/components/data-table/data-table";
import { DataTablePagination } from "@/components/data-table/data-table-pagination";
import { DataTableRowActions } from "@/components/data-table/data-table-row-actions";
import { useAdminMutation } from "@/lib/admin-mutations";
import { useTRPC } from "@/utils/trpc";

type RatingType = "blitz" | "rapid" | "classic";

const RATING_TYPE_LABELS: Record<RatingType, string> = {
  blitz: "Blitz",
  rapid: "Rapid",
  classic: "Classic",
};

interface RatingHistoryEditorProps {
  playerId: number;
  onRatingChange: (ratingType: RatingType, rating: number) => void;
}

const signed = (value: number) => `${value > 0 ? "+" : ""}${value}`;

export function RatingHistoryEditor({ playerId, onRatingChange }: RatingHistoryEditorProps) {
  const trpc = useTRPC();
  const { data: history } = useSuspenseQuery(
    trpc.playersTournament.listByPlayer.queryOptions({ playerId }),
  );
  const [editing, setEditing] = useState<(typeof history)[number] | null>(null);

  const correctMutation = useAdminMutation(
    trpc.playersTournament.correctVariation.mutationOptions(),
    {
      invalidates: "playersTournament",
      success: "Variation corrected",
      failure: "Failed to correct the variation",
      reloadOnConflict: true,
      onSuccess: (data) => {
        onRatingChange(data.ratingType, data.rating);
        setEditing(null);
      },
    },
  );
  const removeMutation = useAdminMutation(trpc.playersTournament.remove.mutationOptions(), {
    invalidates: "playersTournament",
    success: "Result removed and rating reverted",
    failure: "Failed to remove the result",
    onSuccess: (data) => onRatingChange(data.ratingType, data.rating),
  });

  const columns: ColumnDef<(typeof history)[number]>[] = [
    {
      id: "tournament",
      header: "Tournament",
      cell: ({ row }) => (
        <div>
          <div className="font-medium">{row.original.tournament?.name ?? "Unknown tournament"}</div>
          {row.original.tournament?.date ? (
            <div className="text-muted-foreground text-xs">{row.original.tournament.date}</div>
          ) : null}
        </div>
      ),
    },
    {
      id: "type",
      header: "Type",
      cell: ({ row }) =>
        RATING_TYPE_LABELS[row.original.ratingType as RatingType] ?? row.original.ratingType,
    },
    {
      id: "before",
      header: () => <span className="block text-right">Before</span>,
      cell: ({ row }) => (
        <span className="block text-right tabular-nums">{row.original.oldRating}</span>
      ),
    },
    {
      id: "variation",
      header: () => <span className="block text-right">Variation</span>,
      cell: ({ row }) => (
        <span className="block text-right tabular-nums">{signed(row.original.variation)}</span>
      ),
    },
    {
      id: "after",
      header: () => <span className="block text-right">After</span>,
      cell: ({ row }) => (
        <span className="block text-right tabular-nums">
          {row.original.oldRating + row.original.variation}
        </span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => {
        const result = row.original;
        const name = result.tournament?.name ?? "this tournament";
        const type = RATING_TYPE_LABELS[result.ratingType as RatingType] ?? result.ratingType;
        return (
          <DataTableRowActions
            id={result.id}
            noun="result"
            editLabel="Correct variation"
            onEdit={() => setEditing(result)}
            deleteLabel="Remove"
            deleteDescription={`The ${signed(result.variation)} from “${name}” will be subtracted from the current ${type} rating, and later results will be rebased.`}
            isDeleting={removeMutation.isPending}
            onDelete={() => removeMutation.mutate({ id: result.id })}
          />
        );
      },
    },
  ];

  return (
    <AdminSection
      title="Rating history"
      description="Correcting or removing a result also updates the current rating and the starting rating of every later result of the same type."
    >
      <DataTable
        columns={columns}
        data={history}
        emptyState="No rated tournaments yet."
        pagination={(table) => <DataTablePagination table={table} />}
      />
      <EntityFormDialog
        open={editing !== null}
        onOpenChange={(open) => !open && setEditing(null)}
        title="Correct variation"
        description={
          editing
            ? `${editing.tournament?.name ?? "Tournament"} · started at ${editing.oldRating}`
            : undefined
        }
        fields={[
          {
            name: "variation",
            label: "Variation",
            kind: "number",
            required: true,
            min: -4000,
            max: 4000,
          },
        ]}
        defaultValues={{ variation: String(editing?.variation ?? 0) }}
        onSubmit={(values) =>
          editing && correctMutation.mutate({ id: editing.id, variation: Number(values.variation) })
        }
        error={correctMutation.error}
        pending={correctMutation.isPending}
        submitLabel="Save variation"
      />
    </AdminSection>
  );
}
