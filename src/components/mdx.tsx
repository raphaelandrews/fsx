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
    <ClientOnly fallback={<Skeleton className="h-[200px] w-full" />}>
      <div data-color-mode="light" className="wmde-markdown-var">
        <MDEditorMarkdown source={content} style={{ whiteSpace: "pre-wrap" }} />
      </div>
    </ClientOnly>
  );
}
