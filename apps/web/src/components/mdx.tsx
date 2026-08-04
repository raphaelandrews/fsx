"use client";

import { Markdown } from "@tanstack/markdown/react";

interface MDXProps {
  content: string;
}

export function MDX({ content }: MDXProps) {
  return (
    <div className="prose dark:prose-invert max-w-none">
      <Markdown>{content}</Markdown>
    </div>
  );
}
