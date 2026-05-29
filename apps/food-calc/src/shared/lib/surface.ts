import { useEffect } from 'react';

export type Surface = 'warm' | 'lavender';

/**
 * Sets `body[data-surface]` for the lifetime of the component. CSS-vars defined
 * in `shared/assets/style/surfaces.scss` cascade through Base UI portals (which
 * mount on document.body), so a warm-pill AutoGrowSearch rendered inside a
 * portaled modal still picks up the surface chosen by the host page.
 *
 * Default value on body is set once in App.tsx. Pages that need a different
 * surface call this hook on mount; on unmount, the previous value (or the
 * default) is restored.
 */
export function useSurface(surface: Surface) {
  useEffect(() => {
    const body = document.body;
    const prev = body.getAttribute('data-surface');
    body.setAttribute('data-surface', surface);
    return () => {
      if (prev === null) body.removeAttribute('data-surface');
      else body.setAttribute('data-surface', prev);
    };
  }, [surface]);
}
