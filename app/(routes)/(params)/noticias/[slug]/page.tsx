import type { Metadata, ResolvingMetadata } from "next";
import { notFound } from "next/navigation";
import { CalendarIcon, NewspaperIcon } from "lucide-react";

import { getNews, getNewsBySlug } from "@/db/queries";
import { siteConfig } from "@/lib/site";
import { MDX } from "@/components/mdx";

export const dynamicParams = true;

export async function generateStaticParams() {
  const posts = await getNews();

  return posts.map((post) => ({
    slug: post.slug,
  }));
}

type Props = {
  params: Promise<Record<string, string | string[] | undefined>>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata(
  { params, searchParams }: Props,
  parent: ResolvingMetadata
): Promise<Metadata> {
  const resolvedParams = await params;
  const posts = await getNewsBySlug(resolvedParams.slug as string);

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
      type: "website",
      locale: "pt_BR",
      title,
      description: content ?? undefined,
      siteName: "FSX | Notícias",
      url: `${siteConfig.url}/noticias/${resolvedParams.slug}`,
      images: [
        {
          url: image ?? "",
          width: 1800,
          height: 900,
        },
      ],
    },
  };
}

export default async function Page({ params }: Props) {
  const resolvedParams = await params;
  const data = await getNewsBySlug(resolvedParams.slug as string);

  if (!data) {
    notFound();
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
