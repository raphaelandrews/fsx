import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete03Icon } from "@hugeicons/core-free-icons";

import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";

export interface EventLinkDraft {
  id?: number;
  label: string;
  href: string;
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
    onChange([...value, { label: "", href: "" }]);
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
        <div key={i} className="grid grid-cols-[1fr_2fr_auto] items-center gap-2">
          <Input
            aria-label="Rótulo do link"
            placeholder="Rótulo (ex: Regulamento)"
            value={link.label}
            onChange={(e) => update(i, { label: e.target.value })}
          />
          <Input
            aria-label="URL do link"
            type="url"
            placeholder="https://... (opcional)"
            value={link.href}
            onChange={(e) => update(i, { href: e.target.value })}
          />
          <Button type="button" size="icon-sm" variant="ghost" onClick={() => remove(i)}>
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
