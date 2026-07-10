import { useEffect, useRef, useState } from 'react';
import { useDesignVariantsStore, selectActiveKey } from '@/shared/model/designVariantsStore';
import { useLongPress } from '@/shared/lib/hooks/useLongPress';
import { openBugReport } from '@/features/dev/bug-report';
import toaster from '@/shared/lib/toaster/toaster';
import { seedTestDays } from './seedTestDays';
import s from './DesignVariantsBar.module.scss';

const FLASH_DURATION_MS = 320;
const FLASH_CLASS = 'dv-anchor-flash';
const OPEN_STORAGE_KEY = 'disher.dvBar.open';
const POS_STORAGE_KEY = 'disher.dvBar.pos';

type Pos = { x: number; y: number };

const readInitialOpen = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(OPEN_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
};

const readInitialPos = (): Pos | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(POS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (typeof parsed?.x === 'number' && typeof parsed?.y === 'number') return parsed;
    return null;
  } catch {
    return null;
  }
};

// NB: no position clamping. The bar may be dragged fully off-screen on purpose
// (dev tool — acceptable to "lose" it; recover by clearing localStorage
// `disher.dvBar.pos`). Earlier a clampPos() penned it inside the viewport.

export const DesignVariantsBar = () => {
  const entries = useDesignVariantsStore((st) => st.entries);
  const setPinned = useDesignVariantsStore((st) => st.setPinned);
  const setVariant = useDesignVariantsStore((st) => st.setVariant);
  const next = useDesignVariantsStore((st) => st.next);
  const prev = useDesignVariantsStore((st) => st.prev);
  const activeKey = useDesignVariantsStore(selectActiveKey);
  const pinned = useDesignVariantsStore((st) => st.pinned);

  const [open, setOpen] = useState<boolean>(readInitialOpen);
  const [pos, setPos] = useState<Pos | null>(readInitialPos);
  const [dragging, setDragging] = useState(false);
  const [seeding, setSeeding] = useState(false);

  // Dev-сидер: заполняет 1–10 июня 2026 реалистичной едой + симптомами (с
  // запечённым молочно→головная-боль/вздутие сигналом) для проверки «длительного
  // анализа» на живых данных. См. seedTestDays.ts.
  const handleSeed = async () => {
    if (seeding) return;
    setSeeding(true);
    try {
      const r = await seedTestDays();
      const miss = r.missing.length ? ` · не найдено в каталоге: ${r.missing.join(', ')}` : '';
      toaster.success(`Засеяно 1–10 июня: ${r.foods} блюд, ${r.events} симптомов${miss}`);
    } catch (e) {
      console.error('[seedTestDays] failed', e);
      toaster.error('Не удалось засеять тестовые дни (см. консоль)');
    } finally {
      setSeeding(false);
    }
  };

  const shellRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef<{ dx: number; dy: number } | null>(null);

  // Long-press the collapsed 🎨 trigger to open the dev bug-report form. Short
  // tap (and keyboard Enter/Space) keeps opening the variants bar via onClick.
  const bugReportPress = useLongPress(() => {
    // Contain a failed modal/chunk load (flaky dev server, stale cache) as a
    // log line instead of an unhandled rejection — matches the best-effort
    // error handling inside the flow (captureScreenshot, submitBugReport).
    openBugReport().catch((e) => console.warn('[bug-report] open failed', e));
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(OPEN_STORAGE_KEY, open ? '1' : '0');
    } catch {
      // ignore quota / privacy-mode errors
    }
  }, [open]);

  useEffect(() => {
    if (!pos) return;
    try {
      window.localStorage.setItem(POS_STORAGE_KEY, JSON.stringify(pos));
    } catch {
      // ignore
    }
  }, [pos]);

  const onHandlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest('button')) return; // let the close button work
    const shell = shellRef.current;
    if (!shell) return;
    const rect = shell.getBoundingClientRect();
    dragOffsetRef.current = { dx: e.clientX - rect.left, dy: e.clientY - rect.top };
    setPos({ x: rect.left, y: rect.top });
    setDragging(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    e.preventDefault();
  };

  const onHandlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging || !dragOffsetRef.current) return;
    const next = {
      x: e.clientX - dragOffsetRef.current.dx,
      y: e.clientY - dragOffsetRef.current.dy,
    };
    setPos(next);
  };

  const onHandlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    dragOffsetRef.current = null;
    setDragging(false);
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

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

  // Flash management: при смене `activeKey` (через IntersectionObserver на скролле)
  // нужно ОБЯЗАТЕЛЬНО снимать FLASH_CLASS со старого элемента, иначе через
  // 5-6 свайпов у пользователя 6 элементов с фиолетовым outline'ом
  // одновременно (визуальный мусор на пол-экрана). Раньше cleanup убивал
  // только таймер, а класс оставался на старом anchor'е навсегда.
  //
  // Сравнение по `activeKey + variant`, а не только по variant — иначе при
  // переходе с anchor'а A (variant=floating) на B (variant=floating) flash
  // не сработает (variant строка не изменилась).
  const flashRef = useRef<{ el: HTMLElement; timer: number } | null>(null);
  const lastKeyVariantRef = useRef<string | null>(null);
  useEffect(() => {
    const cleanup = () => {
      if (flashRef.current) {
        window.clearTimeout(flashRef.current.timer);
        flashRef.current.el.classList.remove(FLASH_CLASS);
        flashRef.current = null;
      }
    };

    if (!activeKey || !active) {
      lastKeyVariantRef.current = null;
      cleanup();
      return;
    }

    const keyVariant = `${activeKey}:${active.variant}`;
    if (lastKeyVariantRef.current === keyVariant) return;
    lastKeyVariantRef.current = keyVariant;

    cleanup();

    const el = document.querySelector<HTMLElement>(`[data-dv="${activeKey}"]`);
    if (!el) return;
    el.classList.remove(FLASH_CLASS);
    void el.offsetWidth;
    el.classList.add(FLASH_CLASS);
    const timer = window.setTimeout(() => {
      el.classList.remove(FLASH_CLASS);
      flashRef.current = null;
    }, FLASH_DURATION_MS);
    flashRef.current = { el, timer };

    return cleanup;
  }, [activeKey, active]);

  // One-shot стирание залежавшегося FLASH_CLASS на любых [data-dv] при mount —
  // на случай если до этого фикса у юзера в DOM уже накопилось N anchor'ов
  // с навсегда залипшим классом (фиолетовые полоски через всю страницу).
  useEffect(() => {
    document.querySelectorAll<HTMLElement>(`[data-dv].${FLASH_CLASS}`).forEach((el) => {
      el.classList.remove(FLASH_CLASS);
    });
  }, []);

  const currentIdx = active ? active.variants.indexOf(active.variant) : -1;
  const total = active?.variants.length ?? 0;
  const badgeText = active ? `${currentIdx + 1}/${total}` : '–';

  if (!open) {
    return (
      <button
        type="button"
        className={s.trigger}
        onClick={() => setOpen(true)}
        {...bugReportPress}
        aria-label="Open design variants (long-press for bug report)"
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

  const shellStyle = pos
    ? { top: pos.y, left: pos.x, right: 'auto' as const }
    : undefined;

  return (
    <div
      ref={shellRef}
      className={`${s.shell} ${dragging ? s.shellDragging : ''}`}
      role="dialog"
      aria-label="Design variants"
      style={shellStyle}
    >
      <div
        className={`${s.handle} ${dragging ? s.handleDragging : ''}`}
        onPointerDown={onHandlePointerDown}
        onPointerMove={onHandlePointerMove}
        onPointerUp={onHandlePointerUp}
        onPointerCancel={onHandlePointerUp}
      >
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

      <div className={s.seedSection}>
        <button
          type="button"
          className={s.seedBtn}
          onClick={handleSeed}
          disabled={seeding}
        >
          {seeding ? 'Засеиваю…' : '🌱 Засеять 1–10 июня (еда + симптомы)'}
        </button>
      </div>
    </div>
  );
};
