import type { CSSProperties } from 'react';
import styles from './useEntranceStagger.module.scss';

type EntranceProps = {
  className: string;
  style: CSSProperties;
};

/**
 * Staggered list-entrance animation — pure CSS (opacity + a small upward
 * translate), no animation library. Spread the result onto the element that
 * should animate in on mount:
 *
 *   <div {...useEntranceStagger(index)} />
 *
 * `index` (the row's position in its list) offsets the animation start so the
 * list cascades in. The per-item delay is capped in the stylesheet, and the
 * whole effect collapses to nothing under `prefers-reduced-motion`. It runs once
 * per mount — re-renders don't re-trigger it; navigating back to the list
 * re-mounts the rows and replays it.
 *
 * When the target already has its own className/style, merge them:
 *
 *   const enter = useEntranceStagger(index);
 *   <div className={clsx(base, enter.className)} style={{ ...enter.style, ...own }} />
 */
export function useEntranceStagger(index = 0): EntranceProps {
  return {
    className: styles.entrance,
    style: { '--enter-i': index } as CSSProperties,
  };
}
