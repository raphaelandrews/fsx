import { createFileRoute } from "@tanstack/react-router";

import { FormSection } from "@/components/admin/form-layout";
import { AdminPageHeader } from "@/components/admin/page-header";
import { getUser } from "@/functions/get-user";

export const Route = createFileRoute("/_auth/dashboard/user/")({
  head: () => ({ meta: [{ title: "Account - Admin - FSX" }] }),
  loader: async () => ({ session: await getUser() }),
  component: RouteComponent,
});

const dateFormat = new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", dateStyle: "medium" });

function RouteComponent() {
  const { session } = Route.useLoaderData();
  if (!session) return null;

  const rows = [
    ["Name", session.user.name],
    ["Email", session.user.email],
    ["User ID", session.user.id],
    ["Created", dateFormat.format(new Date(session.user.createdAt))],
  ] as const;

  return (
    <>
      <AdminPageHeader
        title="Account"
        description="The GitHub account signed in to the dashboard."
      />
      <FormSection title="Session" description="Only the configured owner account can sign in.">
        <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-[8rem_minmax(0,1fr)]">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="break-all font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </FormSection>
    </>
  );
}
