import { ErrorComponent, createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarIcon, NewspaperIcon } from "lucide-react";

import { postBySlugQueryOptions } from "~/db/queries";
import { siteConfig } from "~/utils/config";

import { MDX } from "~/components/mdx";
import { NotFound } from "~/components/not-found";

export const Route = createFileRoute("/_params/noticias/$noticiaSlug")({
  loader: async ({ context: { queryClient }, params: { noticiaSlug } }) => {
    const data = await queryClient.ensureQueryData(
      postBySlugQueryOptions(noticiaSlug)
    );

    return {
      data,
    };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          {
            title: `${loaderData.data.title} | ${siteConfig.name}`,
            description: loaderData.data.content,
            ogUrl: `${siteConfig.url}/noticias/${loaderData.data.slug}`,
            image: loaderData.data.image,
          },
        ]
      : undefined,
  }),
  errorComponent: ErrorComponent,
  notFoundComponent: () => <NotFound />,
  component: RouteComponent,
});

function RouteComponent() {
  const postsSlug = Route.useParams().noticiaSlug;
  const { data, isLoading } = useQuery(postBySlugQueryOptions(postsSlug));

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <section className="w-11/12 max-w-2xl pt-6 sm:pt-12 pb-20 m-auto">
      <div className="inline-block p-2.5 text-muted-foreground rounded-md bg-primary-foreground">
        <NewspaperIcon width={16} height={16} />
      </div>

      <h1 className="font-semibold text-primary text-2xl tracking-tighter mt-2">
        {data?.title}
      </h1>

      {data?.createdAt && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
          {formatDate(data.createdAt)}
        </div>
      )}

      {data?.image && (
        <img
          src={data.image}
          alt={data.title}
          className="w-full max-w-xl h-full mt-6 rounded-lg m-auto"
        />
      )}

      <div className="mt-6">
        {data?.content && <MDX content={data.content} />}
      </div>
    </section>
  );
}

function formatDate(date: string) {
  const currentDate = new Date();

  const targetDate = new Date(date);

  targetDate.setUTCHours(targetDate.getUTCHours() + 3);

  const yearsAgo = currentDate.getFullYear() - targetDate.getFullYear();
  const monthsAgo = currentDate.getMonth() - targetDate.getMonth();
  const monthsYearsAgo = currentDate.getMonth() - targetDate.getMonth() + 12;
  const daysAgo = currentDate.getDate() - targetDate.getDate();

  let formattedDate = "";

  if (yearsAgo > 0) {
    formattedDate = `${yearsAgo} ano${yearsAgo > 1 ? "s" : ""} ${monthsAgo} ${monthsAgo > 1 ? "meses" : "mês"}`;
  } else if (monthsAgo > 0) {
    formattedDate = `${monthsAgo} ${monthsAgo > 1 ? "meses" : "mês"} ${daysAgo} dia${daysAgo > 1 ? "s" : ""}`;
  } else if (daysAgo > 0) {
    formattedDate = `${daysAgo} dia${daysAgo > 1 ? "s" : ""}`;
  } else {
    formattedDate = "Hoje";
  }

  const fullDate = targetDate.toLocaleString("pt-BR", {
    timeZone: "UTC",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <>
      <p className="flex items-center gap-2">
        <CalendarIcon width={16} height={16} />
        <span className="mt-[1px]">{fullDate}</span>
      </p>
      <div className="w-1 h-1 rounded-full bg-muted-foreground" />
      <p>{formattedDate}</p>
    </>
  );
}
