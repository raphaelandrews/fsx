import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";

import { EntityForm, optionalNumber } from "@/components/admin/entity-form";
import { AdminPageHeader } from "@/components/admin/page-header";
import { useAdminMutation } from "@/lib/admin-mutations";
import { announcementSections } from "@/lib/admin-forms";
import { useTRPC } from "@/utils/trpc";

export const Route = createFileRoute("/_auth/dashboard/announcements/create")({
  head: () => ({ meta: [{ title: "New announcement - Admin - FSX" }] }),
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(context.trpc.announcements.list.queryOptions()),
  component: RouteComponent,
});

function RouteComponent() {
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { data: announcements } = useSuspenseQuery(trpc.announcements.list.queryOptions());

  const year = new Date().getFullYear();
  const nextNumber =
    announcements
      .filter((announcement) => announcement.year === year)
      .reduce((max, a) => Math.max(max, a.number), 0) + 1;

  const createMutation = useAdminMutation(trpc.announcements.create.mutationOptions(), {
    invalidates: "announcements",
    success: "Announcement created",
    failure: "Failed to create announcement",
    // Without a player, open the announcement so its suggested players show up.
    onSuccess: (created) => {
      const announcement = created[0];
      return announcement && announcement.playerId === null
        ? navigate({ to: "/dashboard/announcements/$id", params: { id: announcement.id } })
        : navigate({ to: "/dashboard/announcements" });
    },
  });

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/announcements"
        backLabel="Announcements"
        title="New announcement"
        description="The next number for this year is filled in for you."
      />
      <EntityForm
        sections={announcementSections(trpc)}
        defaultValues={{ year: String(year), number: String(nextNumber), content: "", playerId: "" }}
        onSubmit={(values) =>
          createMutation.mutate({
            year: Number(values.year),
            number: Number(values.number),
            content: values.content!,
            playerId: optionalNumber(values.playerId!),
          })
        }
        error={createMutation.error}
        pending={createMutation.isPending}
        submitLabel="Create announcement"
        cancelTo="/dashboard/announcements"
      />
    </>
  );
}
