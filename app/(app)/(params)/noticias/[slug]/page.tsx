import { unstable_ViewTransition as ViewTransition } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarIcon, NewspaperIcon } from "lucide-react";

import { getPosts, getPostBySlug } from "@/db/queries";
import { siteConfig } from "@/lib/site";
import { MDX } from "@/components/mdx";

export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await getPosts();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Record<string, string | string[] | undefined>>;
}): Promise<Metadata> {
  const resolvedParams = await params;
  const posts = await getPostBySlug(resolvedParams.slug as string)();

  if (!posts) {
    return {
      title: "Notícia não encontrada",
    };
  }

  const { title, image, content } = posts;

  return {
    title,
    description: content,
    openGraph: {
      title,
      description: content,
      siteName: title,
      url: `${siteConfig.url}/noticias/${resolvedParams.slug}`,
      images: [
        {
          url: image,
          width: 1200,
          height: 600,
        },
      ],
    },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<Record<string, string | string[] | undefined>>;
}) {
  const resolvedParams = await params;
  const data = await getPostBySlug(resolvedParams.slug as string)();

  if (!data) {
    notFound();
  }

  return (
    <section className="m-auto w-11/12 max-w-2xl pt-12 pb-20">
      <div className="inline-block rounded-md bg-primary-foreground p-2.5 text-muted-foreground">
        <NewspaperIcon height={16} width={16} />
      </div>

      <ViewTransition name={`title-${data?.slug}`}>
        <h1 className="text-balance font-semibold text-2xl text-primary mt-2 tracking-tighter">
          {data?.title}
        </h1>
      </ViewTransition>

      {data?.createdAt && (
        <div className="mt-2 flex items-center gap-2 text-muted-foreground text-sm">
          {formatDate(data.createdAt)}
        </div>
      )}

      <ViewTransition name={`image-${data?.slug}`}>
        {data?.image && (
          // biome-ignore lint/performance/noImgElement: No
          <img
            alt={data.title}
            className="m-auto mt-6 h-full w-full max-w-xl rounded-lg"
            src={data.image}
          />
        )}
      </ViewTransition>

      <div className="mt-6">
        {data?.content && <MDX content={data.content} />}
      </div>
    </section>
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
        <CalendarIcon height={16} width={16} />
        <span className="mt-[1px]">{fullDate}</span>
      </p>
      <div className="h-1 w-1 rounded-full bg-muted-foreground" />
      <p>{formattedDate}</p>
    </>
  );
}
