import { useEffect } from 'react';

export type Surface = 'warm' | 'lavender';

/**
 * LEGACY (2026-06-13): the app-wide palette now comes from the live ModalShell
 * variant on `body[data-modal-fields]` (App.tsx), NOT from `data-surface`. This
 * hook + `surfaces.scss` survive ONLY for the UiKitPage palette previewer, which
 * suppresses the global tone while mounted so this toggle stays authoritative.
 * Do not add new callers — pages follow the «law-giver» tone automatically
 * (tds/modalshell-lawgiver-2026-06-13).
 *
 * Sets `body[data-surface]` for the lifetime of the component; restores the
 * previous value on unmount.
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
