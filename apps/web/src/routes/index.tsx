import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";

import { postsQueryOptions } from "@/actions/posts/postsQueryOptions";

import PostCard from "@/components/post-card";
import { Footer } from "@/components/footer";
import { Header } from "@/components/header";

export const Route = createFileRoute("/")({
  loader: ({ context: { queryClient } }) =>
    queryClient.ensureQueryData(postsQueryOptions),
  component: Home,
});

function Home() {
  const postsQuery = useSuspenseQuery(postsQueryOptions);
  const mainPosts = postsQuery.data.slice(0, 2);
  const posts = postsQuery.data.slice(0, 6);

  return (
    <>
      <Header />
      <div className="container relative min-h-[calc(100vh-9.5rem)]">
        <Outlet />
      </div>
      <Footer className="container flex-col justify-between md:flex-row" />
    </>
  );
}
