import { useEffect, useRef, useState } from 'react';
import { useDesignVariantsStore, selectActiveKey } from '@/shared/model/designVariantsStore';
import s from './DesignVariantsBar.module.scss';

const FLASH_DURATION_MS = 320;
const FLASH_CLASS = 'dv-anchor-flash';
const OPEN_STORAGE_KEY = 'disher.dvBar.open';

const readInitialOpen = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(OPEN_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

export const DesignVariantsBar = () => {
  const entries = useDesignVariantsStore((st) => st.entries);
  const setPinned = useDesignVariantsStore((st) => st.setPinned);
  const setVariant = useDesignVariantsStore((st) => st.setVariant);
  const next = useDesignVariantsStore((st) => st.next);
  const prev = useDesignVariantsStore((st) => st.prev);
  const activeKey = useDesignVariantsStore(selectActiveKey);
  const pinned = useDesignVariantsStore((st) => st.pinned);

  const [open, setOpen] = useState<boolean>(readInitialOpen);

  useEffect(() => {
    try {
      window.localStorage.setItem(OPEN_STORAGE_KEY, open ? '1' : '0');
    } catch {
      // ignore quota / privacy-mode errors
    }
  }, [open]);

  const active = activeKey ? entries[activeKey] : null;
  const keys = Object.keys(entries);

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
    void el.offsetWidth;
    el.classList.add(FLASH_CLASS);
    const timer = window.setTimeout(() => {
      el.classList.remove(FLASH_CLASS);
    }, FLASH_DURATION_MS);
    return () => window.clearTimeout(timer);
  }, [activeKey, active]);

  const currentIdx = active ? active.variants.indexOf(active.variant) : -1;
  const total = active?.variants.length ?? 0;
  const badgeText = active ? `${currentIdx + 1}/${total}` : '–';

  if (!open) {
    return (
      <button
        type="button"
        className={s.trigger}
        onClick={() => setOpen(true)}
        aria-label="Open design variants"
        aria-expanded={false}
      >
        <span className={s.triggerIcon} aria-hidden>
          🎨
        </span>
        {keys.length > 0 && (
          <span className={s.triggerBadge}>{badgeText}</span>
        )}
      </button>
    );
  }

  return (
    <div className={s.shell} role="dialog" aria-label="Design variants">
      <div className={s.handle}>
        <span className={s.handleTitle}>
          <span className={s.handleDot} aria-hidden />
          design&nbsp;variants
        </span>
        <button
          type="button"
          className={s.close}
          onClick={() => setOpen(false)}
          aria-label="Collapse design variants"
        >
          ×
        </button>
      </div>

      {keys.length === 0 ? (
        <div className={s.empty}>nothing mounted</div>
      ) : (
        <div className={s.body}>
          <label className={s.field}>
            <span className={s.fieldLabel}>anchor</span>
            <select
              className={s.select}
              value={activeKey ?? ''}
              onChange={(e) => setPinned(e.target.value || null)}
            >
              {keys.map((k) => (
                <option key={k} value={k}>
                  {k}
                  {pinned === k ? ' · pinned' : ''}
                </option>
              ))}
            </select>
          </label>

          {active && (
            <>
              <div className={s.nav}>
                <button
                  type="button"
                  className={s.navBtn}
                  onClick={prev}
                  aria-label="Previous variant"
                >
                  ◀
                </button>
                <div className={s.counter}>
                  <span className={s.counterNum}>{badgeText}</span>
                  <span className={s.counterName}>{active.variant}</span>
                </div>
                <button
                  type="button"
                  className={s.navBtn}
                  onClick={next}
                  aria-label="Next variant"
                >
                  ▶
                </button>
              </div>

              <div className={s.chips} role="radiogroup" aria-label="Variants">
                {active.variants.map((v) => (
                  <button
                    key={v}
                    type="button"
                    role="radio"
                    aria-checked={v === active.variant}
                    className={`${s.chip} ${v === active.variant ? s.chipActive : ''}`}
                    onClick={() => activeKey && setVariant(activeKey, v)}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};
