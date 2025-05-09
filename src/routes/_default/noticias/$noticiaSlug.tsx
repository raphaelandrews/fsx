import {
  ErrorComponent,
  type ErrorComponentProps,
  createFileRoute,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { newsBySlugQueryOptions } from "~/db/queries";
import { NotFound } from "~/components/not-found";

export const Route = createFileRoute("/_default/noticias/$noticiaSlug")({
  loader: async ({ context: { queryClient }, params: { noticiaSlug } }) => {
    await queryClient.ensureQueryData(newsBySlugQueryOptions(noticiaSlug));
  },
  component: RouteComponent,
  errorComponent: NewsErrorComponent,
  notFoundComponent: () => {
    return <NotFound>Notícia não encontrada</NotFound>;
  },
});

export function NewsErrorComponent({ error }: ErrorComponentProps) {
  return <ErrorComponent error={error} />;
}

function RouteComponent() {
  const newsSlug = Route.useParams().noticiaSlug;
  const { data, isLoading } = useQuery(newsBySlugQueryOptions(newsSlug));

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-2">
      <h1 className="text-xl font-bold underline">{data?.title}</h1>
      <h2 className="text-xl font-bold underline">{data?.content}</h2>
    </div>
  );
}
