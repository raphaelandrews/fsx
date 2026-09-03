import { useState } from "react";

import { Button } from "@fsx/ui/components/button";
import { Textarea } from "@fsx/ui/components/textarea";

import { Markdown } from "@/components/markdown";

interface MarkdownEditorProps {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
}

export function MarkdownEditor({
  id,
  value,
  onChange,
  placeholder,
  rows = 10,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<"write" | "preview">("write");

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex items-center gap-1 border-b bg-muted/40 px-2 py-1">
        <Button
          type="button"
          variant={mode === "write" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setMode("write")}
        >
          Escrever
        </Button>
        <Button
          type="button"
          variant={mode === "preview" ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setMode("preview")}
        >
          Visualizar
        </Button>
        <span className="ml-auto pr-1 text-xs text-muted-foreground">Markdown</span>
      </div>
      {mode === "write" ? (
        <Textarea
          id={id}
          rows={rows}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="rounded-none border-0 focus-visible:ring-0"
        />
      ) : (
        <div className="min-h-60 px-4 py-3">
          {value ? <Markdown content={value} /> : <p className="text-sm text-muted-foreground">Nada para visualizar…</p>}
        </div>
      )}
    </div>
  );
}
