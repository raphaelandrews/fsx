import { useVirtualizer } from "@tanstack/react-virtual";
import { useRef } from "react";

export function useVirtualList<T>(items: T[], options?: { estimateSize?: number }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => options?.estimateSize ?? 48,
  });

  return { parentRef, virtualizer };
}
