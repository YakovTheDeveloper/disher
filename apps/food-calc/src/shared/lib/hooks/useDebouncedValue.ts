import { useEffect, useState } from 'react';

/**
 * Debounce a fast-changing value: returns the latest `value` only after it has
 * stopped changing for `delay` ms. The canonical fix for "expensive work runs on
 * every keystroke" when the work is LOCAL (filtering/rendering, not HTTP).
 *
 * Why not `useDeferredValue` here: the deferred hook keeps the input responsive
 * but re-renders the derived tree TWICE per keystroke (stale + fresh). On a
 * ~700-item Fuse filter + list, fast typing piles those up and janks. A debounce
 * skips the intermediate values entirely — the heavy filter runs ONCE, after the
 * burst — so the list stays referentially stable between keystrokes (React
 * Compiler then reuses the mapped rows) and the input never blocks.
 *
 * The consumer keeps the immediate value for the controlled input and feeds this
 * debounced value only to the expensive derivation.
 */
export function useDebouncedValue<T>(value: T, delay = 200): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}
