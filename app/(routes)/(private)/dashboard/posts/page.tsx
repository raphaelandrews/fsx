import { notFound } from "next/navigation";
import { desc } from "drizzle-orm";

import { db } from "@/db";
import type { Posts } from "@/db/queries";
import { posts } from "@/db/schema";

import PostRefreshOnce from "./components/post-refresh-once";
import PostTableTitle from "./components/post-table-title";
import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";

export default async function Page() {
  let data: Posts[] | null = null;
  let error: unknown | null = null;

  try {
    const rawData = await db
      .select()
      .from(posts)
      .orderBy(desc(posts.createdAt));

    data = rawData.map((post) => ({
      id: post.id,
      title: post.title,
      image: post.image,
      slug: post.slug,
      createdAt: post.createdAt ?? "",
    }));
  } catch (e) {
    console.error("Error fetching posts:", e);
    error = e;
  }

  if (!data || error || data.length === 0) {
    notFound();
  }

  return (
    <>
      <div className="mx-auto max-w-5xl p-4 sm:p-6 lg:p-8">
        <PostTableTitle />
        <DataTable data={data} columns={columns} />
        <PostRefreshOnce />
      </div>
    </>
  );
}
