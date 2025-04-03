import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, Outlet, createFileRoute } from "@tanstack/react-router";

import { postsQueryOptions } from "@/actions/posts/postsQueryOptions";

export const Route = createFileRoute("/noticias")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(postsQueryOptions),
  component: PostsLayoutComponent,
});

function PostsLayoutComponent() {
  const postsQuery = useSuspenseQuery(postsQueryOptions);
  const posts = postsQuery.data;

  return (
    <div className="p-2 flex gap-2">
      <ul className="list-disc pl-4">
        {[...posts, { id: "i-do-not-exist", title: "Non-existent Post" }].map(
          (post) => {
            return (
              <li key={post.id} className="whitespace-nowrap">
                <Link
                  to="/noticias/$noticiaId"
                  params={{
                    noticiaId: post.id,
                  }}
                  className="block py-1 text-blue-600 hover:opacity-75"
                  activeProps={{ className: "font-bold underline" }}
                >
                  <div>{post.title}</div>
                </Link>
              </li>
            );
          }
        )}
      </ul>
      <hr />
      <Outlet />
    </div>
  );
}
