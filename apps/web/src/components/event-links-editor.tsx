import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete03Icon } from "@hugeicons/core-free-icons";

import { EVENT_LINK_TYPES, type EventLinkType } from "@fsx/api/event-link-types";

import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";

export interface EventLinkDraft {
  id?: number;
  type: EventLinkType;
  href: string;
  sortOrder: number;
}

interface EventLinksEditorProps {
  value: EventLinkDraft[];
  onChange: (links: EventLinkDraft[]) => void;
}

export function EventLinksEditor({ value, onChange }: EventLinksEditorProps) {
  const update = (index: number, patch: Partial<EventLinkDraft>) => {
    onChange(value.map((link, i) => (i === index ? { ...link, ...patch } : link)));
  };

  const remove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const add = () => {
    onChange([
      ...value,
      { type: "regulation", href: "", sortOrder: value.length },
    ]);
  };

  return (
    <div className="space-y-3">
      <Label>Links</Label>
      <p className="text-xs text-muted-foreground">
        Deixe a URL em branco para sinalizar que ainda não está disponível ("em breve").
      </p>
      {value.length === 0 && (
        <p className="text-sm text-muted-foreground">
          Nenhum link. Adicione regulamento, formulário, resultados, etc.
        </p>
      )}
      {value.map((link, i) => (
        <div key={i} className="flex flex-wrap items-end gap-2 rounded-lg border p-3">
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Tipo</Label>
            <select
              value={link.type}
              onChange={(e) => update(i, { type: e.target.value as EventLinkType })}
              className="h-8 rounded-md border border-input bg-background px-2 text-sm"
            >
              {EVENT_LINK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex min-w-[200px] flex-[1.6] flex-col gap-1">
            <Label className="text-xs text-muted-foreground">URL</Label>
            <Input
              type="url"
              placeholder="https://... (opcional)"
              value={link.href}
              onChange={(e) => update(i, { href: e.target.value })}
            />
          </div>
          <div className="flex w-20 flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Ordem</Label>
            <Input
              type="number"
              value={String(link.sortOrder)}
              onChange={(e) => update(i, { sortOrder: Number(e.target.value) })}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Remover link ${link.type}`}
            onClick={() => remove(i)}
          >
            <HugeiconsIcon
              className="size-4 text-destructive"
              icon={Delete03Icon}
              strokeWidth={2}
            />
          </Button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={add}>
        <HugeiconsIcon className="size-4" icon={Add01Icon} strokeWidth={2} />
        Add link
      </Button>
    </div>
  );
}
