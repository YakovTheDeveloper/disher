import { useEffect } from 'react';
import { useDesignVariantsStore } from '@/shared/model/designVariantsStore';

/**
 * Design variant picker — reads the current variant index from the global
 * DesignVariantsBar store. Components are registered statically in
 * `KNOWN_VARIANT_COMPONENTS` so the bar dropdown is stable across mount/unmount.
 *
 * Usage:
 *   const { index, total } = useDesignVariants('Calendar', VARIANTS.length);
 *   const V = VARIANTS[index];
 */
export function useDesignVariants(name: string, total: number) {
  const syncTotal = useDesignVariantsStore((s) => s.syncTotal);
  const entry = useDesignVariantsStore((s) => s.components[name]);

  useEffect(() => {
    syncTotal(name, total);
  }, [name, total, syncTotal]);

  if (!entry && process.env.NODE_ENV !== 'production') {
    console.warn(
      `[useDesignVariants] "${name}" is not listed in KNOWN_VARIANT_COMPONENTS. Add it so the DesignVariantsBar can show it.`,
    );
  }

  return { index: entry?.index ?? 0, total };
}
