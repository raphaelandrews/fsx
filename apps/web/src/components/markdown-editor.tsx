import { useCallback, useRef } from "react";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  BoldIcon,
  BulletIcon,
  CheckListIcon,
  CodeIcon,
  DivideIcon,
  Heading01Icon,
  Heading02Icon,
  Heading03Icon,
  ImageAddIcon,
  ItalicIcon,
  LeftToRightBlockQuoteIcon,
  LeftToRightListNumberIcon,
  Link01Icon,
  LayoutTableIcon,
  RedoIcon,
  StrikethroughIcon,
  UndoIcon,
} from "@hugeicons/core-free-icons";
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

interface SelectionResult {
  text: string;
  start: number;
  end: number;
}

type FormatCommand = (value: string, start: number, end: number) => SelectionResult;

function wrap(value: string, start: number, end: number, before: string, after: string, placeholder: string): SelectionResult {
  const selected = value.slice(start, end) || placeholder;
  const text = value.slice(0, start) + before + selected + after + value.slice(end);
  const selStart = start + before.length;
  return { text, start: selStart, end: selStart + selected.length };
}

function linePrefix(value: string, start: number, end: number, prefix: string): SelectionResult {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const nextNewline = value.indexOf("\n", end);
  const lineEnd = nextNewline === -1 ? value.length : nextNewline;
  const block = value.slice(lineStart, lineEnd);
  const lines = block.length === 0 ? [""] : block.split("\n");
  const prefixed = lines.map((line) => prefix + line).join("\n");
  const text = value.slice(0, lineStart) + prefixed + value.slice(lineEnd);
  return { text, start: lineStart, end: lineStart + prefixed.length };
}

function link(value: string, start: number, end: number): SelectionResult {
  const selected = value.slice(start, end) || "texto do link";
  const text = value.slice(0, start) + `[${selected}](https://)` + value.slice(end);
  const selStart = start + 1;
  return { text, start: selStart, end: selStart + selected.length };
}

function image(value: string, start: number, end: number): SelectionResult {
  const alt = value.slice(start, end) || "descrição";
  const text = value.slice(0, start) + `![${alt}](url)` + value.slice(end);
  const selStart = start + 2;
  return { text, start: selStart, end: selStart + alt.length };
}

function table(value: string, start: number): SelectionResult {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const block =
    "| Coluna 1 | Coluna 2 |\n" +
    "| --- | --- |\n" +
    "| Célula | Célula |\n" +
    "| Célula | Célula |\n";
  const text = value.slice(0, lineStart) + block + value.slice(lineStart);
  return { text, start: lineStart + block.length, end: lineStart + block.length };
}

function horizontalRule(value: string, start: number): SelectionResult {
  const lineStart = value.lastIndexOf("\n", start - 1) + 1;
  const prefix = lineStart === 0 ? "" : "\n";
  const block = `${prefix}---\n`;
  const text = value.slice(0, lineStart) + block + value.slice(lineStart);
  const selStart = lineStart + block.length;
  return { text, start: selStart, end: selStart };
}

export function MarkdownEditor({
  id,
  value,
  onChange,
  placeholder,
  rows = 10,
}: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Value history so undo/redo covers both typing and toolbar actions. A backup
  // is kept in a ref so callbacks never read a stale `value` prop.
  const valueRef = useRef(value);
  const historyRef = useRef<{ past: string[]; future: string[] }>({ past: [], future: [] });
  valueRef.current = value;

  const commit = useCallback(
    (next: string) => {
      if (next === valueRef.current) return;
      const history = historyRef.current;
      history.past.push(valueRef.current);
      if (history.past.length > 200) history.past.shift();
      history.future = [];
      valueRef.current = next;
      onChange(next);
    },
    [onChange],
  );

  const focusAtEnd = useCallback((len: number) => {
    requestAnimationFrame(() => {
      const el = textareaRef.current;
      if (el) {
        el.focus();
        el.setSelectionRange(len, len);
      }
    });
  }, []);

  const undo = useCallback(() => {
    const history = historyRef.current;
    if (history.past.length === 0) return;
    const prev = history.past.pop()!;
    history.future.push(valueRef.current);
    valueRef.current = prev;
    onChange(prev);
    focusAtEnd(prev.length);
  }, [onChange, focusAtEnd]);

  const redo = useCallback(() => {
    const history = historyRef.current;
    if (history.future.length === 0) return;
    const next = history.future.pop()!;
    history.past.push(valueRef.current);
    valueRef.current = next;
    onChange(next);
    focusAtEnd(next.length);
  }, [onChange, focusAtEnd]);

  const applyCommand = useCallback(
    (command: FormatCommand) => {
      const el = textareaRef.current;
      if (!el) return;
      const result = command(valueRef.current, el.selectionStart ?? 0, el.selectionEnd ?? 0);
      commit(result.text);
      requestAnimationFrame(() => {
        const next = textareaRef.current;
        if (next) {
          next.focus();
          next.setSelectionRange(result.start, result.end);
        }
      });
    },
    [commit],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      const key = e.key.toLowerCase();
      if (key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
        return;
      }
      if (key === "y") {
        e.preventDefault();
        redo();
        return;
      }
      const commandByKey: Record<string, FormatCommand> = {
        b: (v, s, e) => wrap(v, s, e, "**", "**", "texto"),
        i: (v, s, e) => wrap(v, s, e, "*", "*", "texto"),
        k: link,
      };
      const command = commandByKey[key];
      if (command) {
        e.preventDefault();
        applyCommand(command);
      }
    },
    [undo, redo, applyCommand],
  );

  const formatTools: { label: string; icon: typeof BoldIcon; command: FormatCommand }[] = [
    { label: "Negrito", icon: BoldIcon, command: (v, s, e) => wrap(v, s, e, "**", "**", "texto") },
    { label: "Itálico", icon: ItalicIcon, command: (v, s, e) => wrap(v, s, e, "*", "*", "texto") },
    { label: "Tachado", icon: StrikethroughIcon, command: (v, s, e) => wrap(v, s, e, "~~", "~~", "texto") },
    { label: "Título", icon: Heading01Icon, command: (v, s, e) => linePrefix(v, s, e, "# ") },
    { label: "Subtítulo", icon: Heading02Icon, command: (v, s, e) => linePrefix(v, s, e, "## ") },
    { label: "Título 3", icon: Heading03Icon, command: (v, s, e) => linePrefix(v, s, e, "### ") },
    { label: "Lista", icon: BulletIcon, command: (v, s, e) => linePrefix(v, s, e, "- ") },
    { label: "Lista numerada", icon: LeftToRightListNumberIcon, command: (v, s, e) => linePrefix(v, s, e, "1. ") },
    { label: "Tarefa", icon: CheckListIcon, command: (v, s, e) => linePrefix(v, s, e, "- [ ] ") },
    { label: "Citação", icon: LeftToRightBlockQuoteIcon, command: (v, s, e) => linePrefix(v, s, e, "> ") },
    { label: "Código", icon: CodeIcon, command: (v, s, e) => wrap(v, s, e, "`", "`", "código") },
    { label: "Link", icon: Link01Icon, command: link },
    { label: "Imagem", icon: ImageAddIcon, command: image },
    { label: "Tabela", icon: LayoutTableIcon, command: (v, s) => table(v, s) },
    { label: "Linha", icon: DivideIcon, command: (v, s) => horizontalRule(v, s) },
  ];

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex flex-wrap items-center gap-1 border-b bg-muted/40 px-2 py-1">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={undo}
          title="Desfazer (Ctrl+Z)"
          aria-label="Desfazer"
          className="size-8 px-0 text-muted-foreground hover:text-foreground"
        >
          <HugeiconsIcon className="size-4" icon={UndoIcon} strokeWidth={2} />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={redo}
          title="Refazer (Ctrl+Shift+Z)"
          aria-label="Refazer"
          className="size-8 px-0 text-muted-foreground hover:text-foreground"
        >
          <HugeiconsIcon className="size-4" icon={RedoIcon} strokeWidth={2} />
        </Button>
        <div className="mx-1 h-5 w-px bg-border" />
        {formatTools.map((tool) => (
          <Button
            key={tool.label}
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => applyCommand(tool.command)}
            title={tool.label}
            aria-label={tool.label}
            className="size-8 px-0 text-muted-foreground hover:text-foreground"
          >
            <HugeiconsIcon className="size-4" icon={tool.icon} strokeWidth={2} />
          </Button>
        ))}
        <span className="ml-auto pr-1 text-xs text-muted-foreground">Markdown</span>
      </div>

      {/* Live split: source + preview side by side on large screens, stacked
          (source on top, preview below) on small screens. */}
      <div className="grid md:grid-cols-2">
        <Textarea
          ref={textareaRef}
          id={id}
          rows={rows}
          value={value}
          onChange={(e) => commit(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          style={{ fieldSizing: "fixed" }}
          className="h-64 w-full resize-none rounded-none border-0 px-3 py-2 focus-visible:ring-0 md:h-96"
        />
        <div className="h-64 overflow-y-auto border-t px-4 py-3 md:h-96 md:border-l md:border-t-0">
          {value ? (
            <Markdown content={value} />
          ) : (
            <p className="text-sm text-muted-foreground">A pré-visualização aparecerá aqui…</p>
          )}
        </div>
      </div>
    </div>
  );
}
