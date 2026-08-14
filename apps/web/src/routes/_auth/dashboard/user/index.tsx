import { createFileRoute } from "@tanstack/react-router";
import { Card, CardHeader, CardTitle, CardContent } from "@fsx/ui/components/card";

import { getUser } from "@/functions/get-user";

export const Route = createFileRoute("/_auth/dashboard/user/")({
  head: () => ({ meta: [{ title: "User Profile - Admin - FSX" }] }),
  loader: async () => {
    const session = await getUser();
    return { session };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { session } = Route.useLoaderData();

  if (!session) {
    return <p>Not authenticated.</p>;
  }

  return (
    <div className="mx-auto max-w-lg">
      <h1 className="mb-6 font-bold text-2xl">User Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Session Info</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div>
            <span className="font-medium">Name:</span> {session.user.name}
          </div>
          <div>
            <span className="font-medium">Email:</span> {session.user.email}
          </div>
          <div>
            <span className="font-medium">ID:</span> {session.user.id}
          </div>
          <div>
            <span className="font-medium">Created:</span>{" "}
            {new Date(session.user.createdAt).toLocaleDateString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
