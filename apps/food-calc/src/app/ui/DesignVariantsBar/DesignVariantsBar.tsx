import { useEffect, useRef } from 'react';
import { useDesignVariantsStore, selectActiveKey } from '@/shared/model/designVariantsStore';
import s from './DesignVariantsBar.module.scss';

const FLASH_DURATION_MS = 320;
const FLASH_CLASS = 'dv-anchor-flash';

/**
 * Floating dev-mode bar for switching design variants of currently
 * mounted components. Entries register themselves via `useDesignVariant`
 * — no static list. `[` / `]` advance the active set (auto-picked from
 * viewport visibility or pinned by the user). On switch, the anchor
 * element flashes briefly so it's obvious which element changed.
 */
export const DesignVariantsBar = () => {
  const entries = useDesignVariantsStore((st) => st.entries);
  const setPinned = useDesignVariantsStore((st) => st.setPinned);
  const setVariant = useDesignVariantsStore((st) => st.setVariant);
  const next = useDesignVariantsStore((st) => st.next);
  const prev = useDesignVariantsStore((st) => st.prev);
  const activeKey = useDesignVariantsStore(selectActiveKey);
  const pinned = useDesignVariantsStore((st) => st.pinned);

  const active = activeKey ? entries[activeKey] : null;
  const keys = Object.keys(entries);

  // Keyboard shortcuts: `[` prev, `]` next.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === ']') {
        e.preventDefault();
        next();
      } else if (e.key === '[') {
        e.preventDefault();
        prev();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [next, prev]);

  // Flash the anchor element whenever the active variant changes — gives
  // the user immediate visual confirmation of where the change landed.
  const lastVariantRef = useRef<string | null>(null);
  useEffect(() => {
    if (!activeKey || !active) {
      lastVariantRef.current = null;
      return;
    }
    if (lastVariantRef.current === active.variant) return;
    lastVariantRef.current = active.variant;
    const el = document.querySelector<HTMLElement>(`[data-dv="${activeKey}"]`);
    if (!el) return;
    el.classList.remove(FLASH_CLASS);
    // Force reflow so the animation restarts.
    void el.offsetWidth;
    el.classList.add(FLASH_CLASS);
    const timer = window.setTimeout(() => {
      el.classList.remove(FLASH_CLASS);
    }, FLASH_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [activeKey, active]);

  if (keys.length === 0) {
    return (
      <div className={s.bar} role="toolbar" aria-label="Design variants">
        <span className={s.icon} aria-hidden>
          🎨
        </span>
        <span className={s.empty}>nothing mounted</span>
      </div>
    );
  }

  const currentIdx = active ? active.variants.indexOf(active.variant) : -1;
  const total = active?.variants.length ?? 0;

  return (
    <div className={s.bar} role="toolbar" aria-label="Design variants">
      <span className={s.icon} aria-hidden>
        🎨
      </span>

      <select
        className={s.select}
        value={activeKey ?? ''}
        onChange={(e) => setPinned(e.target.value || null)}
      >
        {keys.map((k) => (
          <option key={k} value={k}>
            {k}
            {pinned === k ? ' 📌' : ''}
          </option>
        ))}
      </select>

      <button
        type="button"
        className={s.arrow}
        onClick={prev}
        disabled={!active}
        aria-label="Previous variant"
      >
        ◀
      </button>

      <span className={s.badge}>
        {active ? `${currentIdx + 1}/${total} · ${active.variant}` : '—'}
      </span>

      <button
        type="button"
        className={s.arrow}
        onClick={next}
        disabled={!active}
        aria-label="Next variant"
      >
        ▶
      </button>

      {active && (
        <select
          className={s.select}
          value={active.variant}
          onChange={(e) => activeKey && setVariant(activeKey, e.target.value)}
        >
          {active.variants.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      )}
    </div>
  );
};
