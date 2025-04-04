import * as React from "react";
import {
  ErrorComponent,
  type ErrorComponentProps,
  createFileRoute,
  useRouter,
} from "@tanstack/react-router";
import {
  useQueryErrorResetBoundary,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { PostNotFoundError } from "@/actions/posts/posts";
import { postQueryOptions } from "@/actions/posts/postsQueryOptions";

export const Route = createFileRoute("/noticias/$noticiaId")({
  loader: ({ context: { queryClient }, params: { noticiaId } }) => {
    return queryClient.ensureQueryData(postQueryOptions(noticiaId));
  },
  errorComponent: PostErrorComponent,
  component: PostComponent,
});

export function PostErrorComponent({ error }: ErrorComponentProps) {
  const router = useRouter();
  if (error instanceof PostNotFoundError) {
    return <div>{error.message}</div>;
  }
  const queryErrorResetBoundary = useQueryErrorResetBoundary();

  React.useEffect(() => {
    queryErrorResetBoundary.reset();
  }, [queryErrorResetBoundary]);

  return (
    <div>
      {/* biome-ignore lint/a11y/useButtonType: <explanation> */}
      <button
        onClick={() => {
          router.invalidate();
        }}
      >
        retry
      </button>
      <ErrorComponent error={error} />
    </div>
  );
}

function PostComponent() {
  const postId = Route.useParams().noticiaId;
  const { data: post } = useSuspenseQuery(postQueryOptions(postId));

  return (
    <div className="space-y-2">
      <h4 className="text-xl font-bold underline">{post.title}</h4>
    </div>
  );
}
