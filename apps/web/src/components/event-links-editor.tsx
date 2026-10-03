import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete03Icon } from "@hugeicons/core-free-icons";

import { EVENT_LINK_TYPES, type EventLinkType } from "@fsx/api/event-link-types";

import { Button } from "@fsx/ui/components/button";
import { Input } from "@fsx/ui/components/input";
import { Label } from "@fsx/ui/components/label";

import { NATIVE_SELECT_CLASS } from "@/components/admin/entity-form";

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

const TYPE_LABELS: Record<EventLinkType, string> = {
  regulation: "Regulations",
  form: "Registration form",
  results: "Chess-Results",
};

// An event has at most one link of each type; rows are shown in list order.
export function EventLinksEditor({ value, onChange }: EventLinksEditorProps) {
  const reorder = (links: EventLinkDraft[]) =>
    links.map((link, index) => ({ ...link, sortOrder: index }));
  const update = (index: number, patch: Partial<EventLinkDraft>) =>
    onChange(reorder(value.map((link, i) => (i === index ? { ...link, ...patch } : link))));
  const remove = (index: number) => onChange(reorder(value.filter((_, i) => i !== index)));
  const unused = EVENT_LINK_TYPES.filter((type) => !value.some((link) => link.type === type.value));
  const add = () => {
    const next = unused[0];
    if (next)
      onChange(reorder([...value, { type: next.value, href: "", sortOrder: value.length }]));
  };

  return (
    <div className="space-y-3">
      {value.length === 0 ? <p className="text-muted-foreground text-sm">No links yet.</p> : null}
      {value.map((link, index) => (
        <div
          key={link.id ?? `new-${link.type}`}
          className="grid gap-3 sm:grid-cols-[12rem_minmax(0,1fr)_auto] sm:items-end"
        >
          <div className="space-y-1.5">
            <Label htmlFor={`event-link-type-${index}`}>Type</Label>
            <select
              id={`event-link-type-${index}`}
              value={link.type}
              onChange={(e) => update(index, { type: e.target.value as EventLinkType })}
              className={NATIVE_SELECT_CLASS}
            >
              {EVENT_LINK_TYPES.filter(
                (type) => type.value === link.type || unused.includes(type),
              ).map((type) => (
                <option key={type.value} value={type.value}>
                  {TYPE_LABELS[type.value]}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor={`event-link-url-${index}`}>URL</Label>
            <Input
              id={`event-link-url-${index}`}
              type="url"
              placeholder="Empty shows “coming soon”"
              value={link.href}
              onChange={(e) => update(index, { href: e.target.value })}
            />
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label={`Remove ${TYPE_LABELS[link.type]} link`}
            onClick={() => remove(index)}
          >
            <HugeiconsIcon
              className="size-4 text-destructive"
              icon={Delete03Icon}
              strokeWidth={2}
            />
          </Button>
        </div>
      ))}
      {unused.length > 0 ? (
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <HugeiconsIcon className="size-4" icon={Add01Icon} strokeWidth={2} />
          Add link
        </Button>
      ) : null}
    </div>
  );
}
