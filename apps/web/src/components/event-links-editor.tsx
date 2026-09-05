import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete03Icon } from "@hugeicons/core-free-icons";

import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";

import { LinkIconSelect } from "@/components/link-icon-select";
import { DEFAULT_LINK_ICON } from "@/lib/link-icons";

export interface EventLinkDraft {
  id?: number;
  label: string;
  href: string;
  icon: string;
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
      { label: "", href: "", icon: DEFAULT_LINK_ICON, sortOrder: value.length },
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
          <div className="flex min-w-[140px] flex-1 flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Rótulo</Label>
            <Input
              placeholder="Rótulo (ex: Regulamento)"
              value={link.label}
              onChange={(e) => update(i, { label: e.target.value })}
            />
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
          <div className="flex flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Ícone</Label>
            <LinkIconSelect value={link.icon} onChange={(svg) => update(i, { icon: svg })} />
          </div>
          <div className="flex w-20 flex-col gap-1">
            <Label className="text-xs text-muted-foreground">Ordem</Label>
            <Input
              type="number"
              value={String(link.sortOrder)}
              onChange={(e) => update(i, { sortOrder: Number(e.target.value) })}
            />
          </div>
          <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(i)}>
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
