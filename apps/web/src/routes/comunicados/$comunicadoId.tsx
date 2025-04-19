import * as React from "react";
import {
  ErrorComponent,
  type ErrorComponentProps,
  createFileRoute,
  useRouter,
} from "@tanstack/react-router";
import {
  useQueryErrorResetBoundary,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { API_BASE_URL } from "~/lib/utils";

import { createAnnouncementQueries } from "@fsx/engine/queries";

const { announcementByIdQueryOptions } = createAnnouncementQueries({
  apiUrl: API_BASE_URL,
});

export const Route = createFileRoute("/comunicados/$comunicadoId")({
  loader: ({ context: { queryClient }, params: { comunicadoId } }) => {
    return queryClient.ensureQueryData(
      announcementByIdQueryOptions(Number(comunicadoId))
    );
  },
  errorComponent: AnnouncementErrorComponent,
  component: AnnouncementComponent,
});

export function AnnouncementErrorComponent({ error }: ErrorComponentProps) {
  const router = useRouter();
  if (error) {
    return <div>{error.message}</div>;
  }
  const queryErrorResetBoundary = useQueryErrorResetBoundary();

  React.useEffect(() => {
    queryErrorResetBoundary.reset();
  }, [queryErrorResetBoundary]);

  return (
    <div>
      {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
      <button
        onClick={() => {
          router.invalidate();
        }}
      >
        retry
      </button>
      <ErrorComponent error={error} />
    </div>
  );
}

function AnnouncementComponent() {
  const announcementId = Route.useParams().comunicadoId;
  const { data: announcement } = useSuspenseQuery(
    announcementByIdQueryOptions(Number(announcementId))
  );

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-bold underline">{announcement.id}</h1>
      <h2 className="text-xl font-bold underline">{announcement.content}</h2>
    </div>
  );
}
