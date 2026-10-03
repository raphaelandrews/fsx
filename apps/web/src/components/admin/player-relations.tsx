import { useState } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { ColumnDef } from "@tanstack/react-table";

import { Button } from "@fsx/ui/components/button";

import { NATIVE_SELECT_CLASS } from "@/components/admin/entity-form";
import { AdminSection } from "@/components/admin/form-layout";
import { ConfirmDeleteButton } from "@/components/confirm-delete-button";
import { DataTable } from "@/components/data-table/data-table";
import { useAdminMutation } from "@/lib/admin-mutations";
import { useTRPC } from "@/utils/trpc";

type Assigned = { linkId: number; name: string; detail?: string };

interface RelationSectionProps {
  title: string;
  description: string;
  noun: string;
  options: { id: number; name: string }[];
  assigned: Assigned[];
  onAssign: (optionId: number) => void;
  onRemove: (linkId: number) => void;
  assigning: boolean;
  removing: boolean;
}

function RelationSection({
  title,
  description,
  noun,
  options,
  assigned,
  onAssign,
  onRemove,
  assigning,
  removing,
}: RelationSectionProps) {
  const [selected, setSelected] = useState("");
  const assignedNames = new Set(assigned.map((item) => item.name));
  const available = options.filter((option) => !assignedNames.has(option.name));
  const selectId = `assign-${noun}`;

  const columns: ColumnDef<Assigned>[] = [
    {
      id: "name",
      header: "Name",
      cell: ({ row }) => <span className="font-medium">{row.original.name}</span>,
    },
    {
      id: "detail",
      header: "Details",
      cell: ({ row }) => (
        <span className="text-muted-foreground">{row.original.detail ?? "—"}</span>
      ),
    },
    {
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex justify-end">
          <ConfirmDeleteButton
            label="Remove"
            confirmLabel="Remove"
            title={`Remove this ${noun}?`}
            description={`“${row.original.name}” will no longer be assigned to this player. You can assign it again later.`}
            pending={removing}
            onConfirm={() => onRemove(row.original.linkId)}
          />
        </div>
      ),
    },
  ];

  return (
    <AdminSection
      title={title}
      description={description}
      actions={
        <form
          className="flex items-center gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            if (!selected) return;
            onAssign(Number(selected));
            setSelected("");
          }}
        >
          <label htmlFor={selectId} className="sr-only">
            {`Assign a ${noun}`}
          </label>
          <select
            id={selectId}
            value={selected}
            onChange={(event) => setSelected(event.target.value)}
            className={`${NATIVE_SELECT_CLASS} w-56`}
            disabled={available.length === 0}
          >
            <option value="">
              {available.length ? `Select a ${noun}...` : `No ${noun}s left to assign`}
            </option>
            {available.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name}
              </option>
            ))}
          </select>
          <Button type="submit" variant="outline" disabled={!selected || assigning}>
            Assign
          </Button>
        </form>
      }
    >
      <DataTable
        columns={columns}
        data={assigned}
        clientPagination={false}
        emptyState={`No ${noun}s assigned.`}
      />
    </AdminSection>
  );
}

export function PlayerTitlesSection({ playerId }: { playerId: number }) {
  const trpc = useTRPC();
  const { data: titles } = useSuspenseQuery(trpc.titles.list.queryOptions());
  const { data: links } = useSuspenseQuery(
    trpc.playersToTitles.listByPlayer.queryOptions({ playerId }),
  );
  const assign = useAdminMutation(trpc.playersToTitles.link.mutationOptions(), {
    invalidates: "playersToTitles",
    success: "Title assigned",
    failure: "Failed to assign title",
  });
  const remove = useAdminMutation(trpc.playersToTitles.unlink.mutationOptions(), {
    invalidates: "playersToTitles",
    success: "Title removed",
    failure: "Failed to remove title",
  });
  return (
    <RelationSection
      title="Titles"
      description="FSX, CBX, and FIDE titles shown on the profile and the titled-players page."
      noun="title"
      options={titles.map((title) => ({
        id: title.id,
        name: `${title.name} (${title.shortName})`,
      }))}
      assigned={links.map((link) => ({
        linkId: link.id,
        name: `${link.title?.name ?? "Title"} (${link.title?.shortName ?? ""})`,
        detail: link.title?.type === "internal" ? "FSX" : "CBX/FIDE",
      }))}
      onAssign={(titleId) => assign.mutate({ playerId, titleId })}
      onRemove={(id) => remove.mutate({ id })}
      assigning={assign.isPending}
      removing={remove.isPending}
    />
  );
}

export function PlayerRolesSection({ playerId }: { playerId: number }) {
  const trpc = useTRPC();
  const { data: roles } = useSuspenseQuery(trpc.roles.list.queryOptions());
  const { data: links } = useSuspenseQuery(
    trpc.playersToRoles.listByPlayer.queryOptions({ playerId }),
  );
  const assign = useAdminMutation(trpc.playersToRoles.link.mutationOptions(), {
    invalidates: "playersToRoles",
    success: "Role assigned",
    failure: "Failed to assign role",
  });
  const remove = useAdminMutation(trpc.playersToRoles.unlink.mutationOptions(), {
    invalidates: "playersToRoles",
    success: "Role removed",
    failure: "Failed to remove role",
  });
  return (
    <RelationSection
      title="Roles"
      description="Board, arbiter, and teacher positions shown on the members page."
      noun="role"
      options={roles.map((role) => ({ id: role.id, name: role.name }))}
      assigned={links.map((link) => ({
        linkId: link.id,
        name: link.role?.name ?? "Role",
        detail: link.role?.shortName,
      }))}
      onAssign={(roleId) => assign.mutate({ playerId, roleId })}
      onRemove={(id) => remove.mutate({ id })}
      assigning={assign.isPending}
      removing={remove.isPending}
    />
  );
}

export function PlayerInsigniasSection({ playerId }: { playerId: number }) {
  const trpc = useTRPC();
  const { data: insignias } = useSuspenseQuery(trpc.insignias.list.queryOptions());
  const { data: links } = useSuspenseQuery(
    trpc.playersToInsignias.listByPlayer.queryOptions({ playerId }),
  );
  const assign = useAdminMutation(trpc.playersToInsignias.link.mutationOptions(), {
    invalidates: "playersToInsignias",
    success: "Insignia assigned",
    failure: "Failed to assign insignia",
  });
  const remove = useAdminMutation(trpc.playersToInsignias.unlink.mutationOptions(), {
    invalidates: "playersToInsignias",
    success: "Insignia removed",
    failure: "Failed to remove insignia",
  });
  return (
    <RelationSection
      title="Insignias"
      description="Badges awarded to the player."
      noun="insignia"
      options={insignias.map((insignia) => ({ id: insignia.id, name: insignia.name }))}
      assigned={links.map((link) => ({
        linkId: link.id,
        name: link.insignia?.name ?? "Insignia",
        detail: link.insignia ? `Level ${link.insignia.level}` : undefined,
      }))}
      onAssign={(insigniaId) => assign.mutate({ playerId, insigniaId })}
      onRemove={(id) => remove.mutate({ id })}
      assigning={assign.isPending}
      removing={remove.isPending}
    />
  );
}
