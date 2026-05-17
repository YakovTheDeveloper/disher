import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDesignVariantsStore } from '@/shared/model/designVariantsStore';

/**
 * Anchor binding returned by `useDesignVariant`. Spread onto a single
 * element in the component:
 *
 *   const { variant, anchor } = useDesignVariant('ScheduleEvents', [...]);
 *   <section {...anchor}>...</section>
 *
 * The data attributes drive CSS:
 *   [data-dv='ScheduleEvents'][data-dv-v='graphite'] { --ev-text: ...; }
 *
 * The ref hooks an IntersectionObserver so the bar can pick this entry as
 * the keyboard-shortcut target when it scrolls into view.
 */
export type DesignVariantAnchor<V extends string> = {
  ref: (el: HTMLElement | null) => void;
  'data-dv': string;
  'data-dv-v': V;
};

export type UseDesignVariantResult<V extends string> = {
  variant: V;
  anchor: DesignVariantAnchor<V>;
};

const DV_ATTR = 'data-dv';

/**
 * Self-registering design-variant hook.
 *
 * - Registers on mount, unregisters on unmount. No static registry to
 *   keep in sync.
 * - Persists the chosen variant per key in localStorage (`dv:<key>`).
 * - Reports anchor visibility to the store via IntersectionObserver so
 *   the bar's arrows / `[` / `]` keys operate on whichever variant set
 *   the user is currently looking at.
 *
 * @param key       Stable identifier shown in the bar (and in CSS).
 * @param variants  Tuple of variant names. First entry is the default.
 */
export function useDesignVariant<const V extends readonly string[]>(
  key: string,
  variants: V,
): UseDesignVariantResult<V[number]> {
  const register = useDesignVariantsStore((s) => s.register);
  const unregister = useDesignVariantsStore((s) => s.unregister);
  const markVisible = useDesignVariantsStore((s) => s.markVisible);
  // Подписка ТОЛЬКО на `variant` (примитив), а не на весь entry-объект.
  // `markVisible` (IntersectionObserver на свайпе) пересоздаёт entry с новыми
  // `visible`/`lastSeen` — если подписаться на объект, консьюмер ре-рендерится
  // на каждом свайпе впустую. Селектор по строке → ре-рендер только при
  // реальной смене варианта.
  const storedVariant = useDesignVariantsStore((s) => s.entries[key]?.variant);

  // Stabilize the variants identity so the effect doesn't re-run on every
  // render — callers typically pass an array literal which is a fresh ref
  // each render. The joined string is the structural identity key.
  const variantsKey = variants.join('|');
  const stableVariants = useMemo(() => variants, [variantsKey]);

  useEffect(() => {
    register(key, stableVariants);
    return () => unregister(key);
  }, [key, stableVariants, register, unregister]);

  // Anchor ref: wires up IO to report visibility on the bound element.
  const observerRef = useRef<IntersectionObserver | null>(null);
  const currentElRef = useRef<HTMLElement | null>(null);

  const ref = useCallback(
    (el: HTMLElement | null) => {
      // Detach from previous element.
      if (observerRef.current && currentElRef.current) {
        observerRef.current.unobserve(currentElRef.current);
      }
      currentElRef.current = el;
      if (!el) return;
      if (typeof IntersectionObserver === 'undefined') return;
      if (!observerRef.current) {
        observerRef.current = new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (e.isIntersecting) markVisible(key);
            }
          },
          { threshold: 0.2 },
        );
      }
      observerRef.current.observe(el);
    },
    [key, markVisible],
  );

  useEffect(() => {
    return () => {
      observerRef.current?.disconnect();
      observerRef.current = null;
    };
  }, []);

  const variant = (storedVariant ?? stableVariants[0]) as V[number];

  return {
    variant,
    anchor: {
      ref,
      [DV_ATTR]: key,
      'data-dv-v': variant,
    },
  };
}
