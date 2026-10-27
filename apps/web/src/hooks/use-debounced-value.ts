import { useEffect, useState } from "react";

/** `value` after it has stayed unchanged for `delayMs`; while `paused`, it follows the value at once. */
export function useDebouncedValue<T>(value: T, delayMs: number, paused = false): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    if (paused) {
      setDebounced(value);
      return;
    }
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs, paused]);
  return paused ? value : debounced;
}
