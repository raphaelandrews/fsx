
import { Markdown as MarkdownRenderer } from "@tanstack/markdown/react";

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  return (
    <div className="prose max-w-none sm:prose-lg [&_:is(p,li)]:leading-relaxed">
      <MarkdownRenderer>{content}</MarkdownRenderer>
    </div>
  );
}
