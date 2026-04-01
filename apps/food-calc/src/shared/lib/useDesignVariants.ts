import { useEffect, useState } from 'react';

/**
 * Design variant picker — cycles through N variants on an interval.
 *
 * Usage:
 *   const { index, total } = useDesignVariants(VARIANTS.length, 2000);
 *   const V = VARIANTS[index];
 *
 * How to use for design selection:
 *   1. Define an array of variant components (Variant1, Variant2, …)
 *   2. Wrap the rendered component with <DesignVariantLabel index={index} total={total} />
 *      or render the label manually using the returned values
 *   3. Pick the one you like, remove the hook, hardcode that variant
 */
export function useDesignVariants(total: number, intervalMs = 2000) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setIndex((i) => (i + 1) % total), intervalMs);
    return () => clearInterval(t);
  }, [total, intervalMs]);

  return { index, total };
}
