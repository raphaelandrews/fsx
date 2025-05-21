import React from "react";
import { useQuery } from "@tanstack/react-query";
import { ErrorComponent, createFileRoute } from "@tanstack/react-router";
import { CalendarIcon, NewspaperIcon } from "lucide-react";

import { postBySlugQueryOptions } from "~/db/queries";
import { siteConfig } from "~/utils/config";

import { MDX } from "~/components/mdx";
import { NotFound } from "~/components/not-found";
import { Skeleton } from "~/components/ui/skeleton";

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
  return (
    <section className="w-11/12 max-w-2xl pt-6 sm:pt-12 pb-20 m-auto">
      <div className="inline-block p-2.5 text-muted-foreground rounded-md bg-primary-foreground">
        <NewspaperIcon width={16} height={16} />
      </div>

      <Post />
    </section>
  );
}

function Post() {
  const postsSlug = Route.useParams().noticiaSlug;
  const { data, isLoading } = useQuery(postBySlugQueryOptions(postsSlug));

  if (isLoading) {
    return <PostSkeleton />;
  }

  return (
    <>
      <h1 className="font-semibold text-primary text-2xl tracking-tighter mt-2">
        {data?.title}
      </h1>

      {data?.createdAt && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
          {formatDate(data?.createdAt as Date)}
        </div>
      )}

      {data?.image && (
        <img
          src={data?.image}
          alt={data?.title}
          className="w-full max-w-xl h-full mt-6 rounded-lg m-auto"
        />
      )}

      <div className="mt-6">
        {data?.content && <MDX content={data.content} />}
      </div>
    </>
  );
}

function PostSkeleton() {
  return (
    <>
      <Skeleton className="h-8 w-3/4 mt-2" />

      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-2">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-1 w-1 rounded-full" />
        <Skeleton className="h-6 w-20" />
      </div>

      <div className="mt-6">
        <Skeleton className="w-full max-w-xl h-[288px] rounded-lg m-auto" />
      </div>

      <div className="mt-6 space-y-4">
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-5/6" />
        <Skeleton className="h-6 w-4/6" />
        <Skeleton className="h-6 w-full" />
        <Skeleton className="h-6 w-3/4" />
      </div>
    </>
  );
}

function formatDate(date: Date) {
  const currentDate = new Date();
  const targetDate = new Date(date);
  targetDate.setUTCHours(targetDate.getUTCHours() + 3);

  const diffTime = Math.abs(currentDate.getTime() - targetDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  let months = (currentDate.getFullYear() - targetDate.getFullYear()) * 12;
  months += currentDate.getMonth() - targetDate.getMonth();

  if (currentDate.getDate() < targetDate.getDate()) {
    months--;
  }

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  let formattedDate = "";

  if (years > 0) {
    formattedDate = `${years} ano${years > 1 ? "s" : ""}`;
    if (remainingMonths > 0) {
      formattedDate += ` e ${remainingMonths} ${
        remainingMonths > 1 ? "meses" : "mês"
      }`;
    }
  } else if (months > 0) {
    formattedDate = `${months} ${months > 1 ? "meses" : "mês"}`;
  } else if (diffDays > 0) {
    formattedDate = `${diffDays} dia${diffDays > 1 ? "s" : ""}`;
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
