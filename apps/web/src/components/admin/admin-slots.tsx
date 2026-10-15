import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** Where an edit page's save button goes: the right side of its header. */
export const HEADER_SLOT_ID = "admin-header-slot";
/** Where delete and other destructive buttons go: the bottom right of the page. */
export const DANGER_SLOT_ID = "admin-danger-slot";

/**
 * Renders into a place the shell or the page header provides, so a form or a delete button can sit
 * where the layout wants it without the page passing it around. Until the place exists (before
 * hydration, or on a page without one) it renders the fallback.
 */
export function InSlot({ id, children, fallback = null }: { id: string; children: ReactNode; fallback?: ReactNode }) {
  // undefined until the page has mounted, so nothing flashes in the wrong place first.
  const [element, setElement] = useState<HTMLElement | null | undefined>(undefined);
  useEffect(() => setElement(document.getElementById(id)), [id]);
  if (element === undefined) return null;
  return element ? createPortal(children, element) : fallback;
}
