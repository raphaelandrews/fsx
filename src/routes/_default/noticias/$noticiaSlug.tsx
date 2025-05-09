import {
  ErrorComponent,
  type ErrorComponentProps,
  HeadContent,
  createFileRoute,
} from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";

import { newsBySlugQueryOptions } from "~/db/queries";
import { siteConfig } from "~/utils/config";
import { seo } from "~/utils/seo";

import { NotFound } from "~/components/not-found";

export const Route = createFileRoute("/_default/noticias/$noticiaSlug")({
  loader: async ({ context: { queryClient }, params: { noticiaSlug } }) => {
    const data = await queryClient.ensureQueryData(
      newsBySlugQueryOptions(noticiaSlug)
    );

    return {
      data,
    };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          ...seo({
            title: `${loaderData.data.title} | ${siteConfig.name}`,
            description: loaderData.data.content,
            ogUrl: `${siteConfig.url}/noticias/${loaderData.data.slug}`,
            image: loaderData.data.image,
            imageWidth: "1920",
            imageHeight: "1080",
          }),
        ]
      : undefined,
  }),
  errorComponent: NewsErrorComponent,
  notFoundComponent: () => <NotFound />,
  component: RouteComponent,
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
    <>
      <HeadContent />
      <div className="space-y-2">
        <h1 className="text-xl font-bold underline">{data?.title}</h1>
        <h2 className="text-xl font-bold underline">{data?.content}</h2>
      </div>
    </>
  );
}
