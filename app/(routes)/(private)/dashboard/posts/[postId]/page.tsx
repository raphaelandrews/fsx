import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";

import Editor from "./components/editor";
import { Separator } from "@/components/ui/separator";
import { db } from "@/db";
import { posts } from "@/db/schema";
import type { PostBySlug } from "@/db/queries";

async function getPost(postId: string): Promise<PostBySlug | null> {
  const data = await db
    .select()
    .from(posts)
    .where(eq(posts.id, postId))
    .limit(1);

  if (data.length === 0) {
    return null;
  }

  return data[0];
}

export default async function PostEditorPage({
  params,
}: {
  params: { postId: string };
}) {
  const post = await getPost(params.postId);

  if (!post) {
    return notFound();
  }

  return (
    <div className="max-w-5xl px-10">
      <div>
        <h3 className="text-lg font-medium">Editor</h3>
        <p className="py-2 text-sm text-muted-foreground">Update your post</p>
      </div>
      <Separator className="mb-5 max-w-2xl" />
      <Editor post={post} />
    </div>
  );
}
