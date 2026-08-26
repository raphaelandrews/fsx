
import { Markdown as MarkdownRenderer } from "@tanstack/markdown/react";

interface MarkdownProps {
  content: string;
}

export function Markdown({ content }: MarkdownProps) {
  return (
    <div className="prose max-w-none">
      <MarkdownRenderer>{content}</MarkdownRenderer>
    </div>
  );
}
