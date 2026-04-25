import { useEffect } from 'react';
import { useDesignVariantsStore } from '@/shared/model/designVariantsStore';
import s from './DesignVariantsBar.module.scss';

export const DesignVariantsBar = () => {
  const components = useDesignVariantsStore((st) => st.components);
  const activeComponent = useDesignVariantsStore((st) => st.activeComponent);
  const setActive = useDesignVariantsStore((st) => st.setActive);
  const next = useDesignVariantsStore((st) => st.next);
  const prev = useDesignVariantsStore((st) => st.prev);

  const names = Object.keys(components);
  const active = activeComponent ? components[activeComponent] : null;

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

  if (names.length === 0) return null;

  return (
    <div className={s.bar} role="toolbar" aria-label="Design variants">
      <span className={s.icon} aria-hidden>🎨</span>

      <select
        className={s.select}
        value={activeComponent ?? ''}
        onChange={(e) => setActive(e.target.value)}
      >
        {names.map((n) => (
          <option key={n} value={n}>{n}</option>
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
        {active ? `V${active.index + 1}/${active.total}` : '—'}
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
    </div>
  );
};
