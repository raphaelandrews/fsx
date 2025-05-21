import { lazy } from "react";
import { ClientOnly } from "~/components/client-only";
import { Skeleton } from "~/components/ui/skeleton";

const MDEditorMarkdown = lazy(() =>
  import("@uiw/react-md-editor").then((mod) => ({
    default: mod.default.Markdown,
  }))
);

export function MDX({ content }: { content: string }) {
  return (
    <ClientOnly fallback={<MDXSkeleton />}>
      <div data-color-mode="light" className="wmde-markdown-var">
        <MDEditorMarkdown source={content} style={{ whiteSpace: "pre-wrap" }} />
      </div>
    </ClientOnly>
  );
}

function MDXSkeleton() {
  return (
    <div className="mt-6 space-y-4">
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-5/6" />
      <Skeleton className="h-6 w-4/6" />
      <Skeleton className="h-6 w-full" />
      <Skeleton className="h-6 w-3/4" />
    </div>
  );
}
