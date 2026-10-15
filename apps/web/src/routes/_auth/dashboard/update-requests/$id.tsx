import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";

import { Badge } from "@fsx/ui/components/badge";
import { Button } from "@fsx/ui/components/button";

import { ConfirmDeleteButton } from "@/components/admin/confirm-delete-button";
import { InlineAlert } from "@/components/admin/inline-alert";
import { AdminPageHeader } from "@/components/admin/page-header";
import { RejectRequestDialog } from "@/components/admin/reject-request-dialog";
import { useAdminMutation } from "@/lib/admin-mutations";
import { orNotFound } from "@/lib/errors";
import { parseDbTimestamp } from "@/lib/format";
import { idParams } from "@/lib/route-params";
import { useTRPC } from "@/lib/trpc";

export const Route = createFileRoute("/_auth/dashboard/update-requests/$id")({
  params: idParams,
  head: () => ({ meta: [{ title: "Review update request - Admin - FSX" }] }),
  loader: ({ context, params }) =>
    orNotFound(context.queryClient.ensureQueryData(context.trpc.playerRequests.byId.queryOptions({ id: params.id }))),
  component: RouteComponent,
});

const sentAt = new Intl.DateTimeFormat("en-GB", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Sao_Paulo" });
const show = (value: string | number | null | undefined) => (value === null || value === undefined || value === "" ? "—" : String(value));

function RouteComponent() {
  const { id } = Route.useParams();
  const trpc = useTRPC();
  const navigate = useNavigate();
  const { data: request } = useSuspenseQuery(trpc.playerRequests.byId.queryOptions({ id }));
  const { player } = request;
  const pending = request.status === "pending";

  const photo = useQuery({ ...trpc.playerRequests.photo.queryOptions({ id }), enabled: request.photoKey !== null });
  const toList = () => navigate({ to: "/dashboard/update-requests" });
  const approve = useAdminMutation(trpc.playerRequests.approve.mutationOptions(), {
    invalidates: "playerRequests",
    awaitInvalidation: true,
    success: "Request approved. The player is now verified.",
    failure: "Failed to approve the request",
    onSuccess: toList,
  });
  const reject = useAdminMutation(trpc.playerRequests.reject.mutationOptions(), {
    invalidates: "playerRequests",
    awaitInvalidation: true,
    success: "Request rejected",
    failure: "Failed to reject the request",
    onSuccess: toList,
  });
  const remove = useAdminMutation(trpc.playerRequests.delete.mutationOptions(), {
    invalidates: "playerRequests",
    success: "Request deleted",
    failure: "Failed to delete the request",
    onSuccess: toList,
  });

  const rows = [
    { label: "Birth year", current: player.birthYear, proposed: request.birthYear },
    { label: "Club", current: player.club?.name, proposed: request.club?.name },
    { label: "Location", current: player.location?.name, proposed: request.location?.name },
    { label: "CBX ID", current: player.cbxId, proposed: request.cbxId },
    { label: "FIDE ID", current: player.fideId, proposed: request.fideId },
  ].filter((row) => row.proposed !== null && row.proposed !== undefined);

  return (
    <>
      <AdminPageHeader
        backTo="/dashboard/update-requests"
        backLabel="Update requests"
        title={player.name}
        description={`Sent ${sentAt.format(parseDbTimestamp(request.createdAt))}. Approving applies the fields below and marks the player as verified.`}
        actions={
          pending ? (
            <>
              <RejectRequestDialog playerName={player.name} pending={reject.isPending} onReject={(note) => reject.mutate({ id, reviewNote: note })} />
              <Button loading={approve.isPending} onClick={() => approve.mutate({ id })}>
                Approve
              </Button>
            </>
          ) : (
            <ConfirmDeleteButton
              label="Delete request"
              title="Delete this request?"
              itemName={player.name}
              description="Its proposed data and any pending photo are removed with it."
              pending={remove.isPending}
              onConfirm={() => remove.mutate({ id })}
            />
          )
        }
      />

      <div className="space-y-6">
        {!pending ? (
          <InlineAlert tone={request.status === "approved" ? "success" : "warning"} title={request.status === "approved" ? "Approved" : "Rejected"}>
            {request.reviewedAt ? sentAt.format(parseDbTimestamp(request.reviewedAt)) : null}
            {request.reviewNote ? ` · ${request.reviewNote}` : null}
          </InlineAlert>
        ) : null}

        <section aria-labelledby="changes-heading" className="space-y-2">
          <h2 id="changes-heading" className="font-semibold text-lg">
            Proposed changes
          </h2>
          <div className="overflow-x-auto rounded-2xl border bg-background">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/40 text-left text-muted-foreground">
                <tr>
                  <th scope="col" className="px-3 py-2 font-medium">Field</th>
                  <th scope="col" className="px-3 py-2 font-medium">Now</th>
                  <th scope="col" className="px-3 py-2 font-medium">Proposed</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {rows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row" className="px-3 py-2 text-left font-medium">{row.label}</th>
                    <td className="px-3 py-2 text-muted-foreground">{show(row.current)}</td>
                    <td className="px-3 py-2 font-semibold">{show(row.proposed)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!player.verified ? null : <Badge variant="secondary">Already verified</Badge>}
        </section>

        {request.photoKey ? (
          <section aria-labelledby="photo-heading" className="space-y-2">
            <h2 id="photo-heading" className="font-semibold text-lg">
              Photo
            </h2>
            {photo.data ? (
              <div className="flex flex-wrap items-center gap-4">
                <img src={photo.data.dataUrl} alt={`Photo sent for ${player.name}`} className="size-32 rounded-avatar object-cover" />
                <p className="max-w-sm text-muted-foreground text-sm">
                  Approving replaces the player’s current photo with this one. Rejecting or deleting the request deletes it.
                </p>
              </div>
            ) : photo.isLoading ? (
              <p className="text-muted-foreground text-sm">Loading the photo…</p>
            ) : (
              <InlineAlert tone="warning" title="The photo is no longer available">
                Photos not reviewed within 30 days are deleted. Approving still applies the other fields.
              </InlineAlert>
            )}
          </section>
        ) : null}
      </div>
    </>
  );
}
