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

import {
  newsBySlugQueryOptions,
  NewsNotFoundError,
} from "~/queries/news-by-slug";

export const Route = createFileRoute("/noticias/$noticiaSlug")({
  loader: ({ context: { queryClient }, params: { noticiaSlug } }) => {
    return queryClient.ensureQueryData(newsBySlugQueryOptions(noticiaSlug));
  },
  errorComponent: NewsErrorComponent,
  component: NewsComponent,
});

export function NewsErrorComponent({ error }: ErrorComponentProps) {
  const router = useRouter();
  if (error instanceof NewsNotFoundError) {
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

function NewsComponent() {
  const newsSlug = Route.useParams().noticiaSlug;
  const { data: news } = useSuspenseQuery(newsBySlugQueryOptions(newsSlug));

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-bold underline">{news.title}</h1>
      <h2 className="text-xl font-bold underline">{news.content}</h2>
    </div>
  );
}
