import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import s from './LayoutEditOverlay.module.scss';

// ---------------------------------------------------------------------------
// LayoutEditOverlay — dev-only «Figma-lite» поверх живого приложения.
//
// Включаешь режим → кликаешь ЛЮБОЙ элемент → он выделяется рамкой с 8 ручками И
// попадает в список СЛОЁВ сбоку. В списке: клик по слою выбирает его (двигаешь
// стрелками / тащишь / вбиваешь X/Y/W/H), замок блокирует слой от перемещения.
// Делаешь скриншот нового расположения, присылаешь — я переношу это в SCSS.
//
// «Вне потока» (по запросу юзера): при первой правке элемент ПОДНИМАЕТСЯ из
// потока — становится `position: fixed` по вьюпорт-координатам и ходит куда
// угодно по экрану. Чтобы он не резался краями drawer'а, временно снимаем с
// предков триггеры containing-block / paint-containment (`transform`,
// `will-change: transform`, `contain`, `filter`, `clip-path`, `backdrop-filter`)
// — тогда fixed резолвится к вьюпорту и `overflow:hidden` предков его не клипит
// (overflow НЕ трогаем → нет рефлоу/прыжка скролла). Всё восстанавливается на
// выходе из режима. Узлы НЕ переносим в портал — React-дерево не трогаем.
//
// Это мокап для скриншота: правки живут в inline-стиле живого DOM, не персист;
// перезагрузка / ре-рендер их сбрасывают.
// ---------------------------------------------------------------------------

const OPEN_KEY = 'disher.layoutEdit.open';
const LAYERS_POS_KEY = 'disher.layoutEdit.layersPos';
const BODY_ACTIVE_CLASS = 'layout-edit-active';
const LIFT_Z = '2147482000'; // ниже рамки/тулбара (2147483000), выше drawer (5001)

type Pos = { x: number; y: number };

function readLayersPos(): Pos | null {
  try {
    const raw = localStorage.getItem(LAYERS_POS_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (typeof p?.x === 'number' && typeof p?.y === 'number') return p;
  } catch {
    /* ignore */
  }
  return null;
}

type Frame = { x: number; y: number; w: number; h: number };
type Dir = -1 | 0 | 1;

type Layer = { id: string; el: HTMLElement; label: string; locked: boolean; num?: string };

type Drag = {
  mode: 'move' | 'resize';
  dirX: Dir;
  dirY: Dir;
  startX: number;
  startY: number;
  baseW: number;
  baseH: number;
  baseLeft: number;
  baseTop: number;
  el: HTMLElement;
};

const HANDLES: { dirX: Dir; dirY: Dir; cls: string }[] = [
  { dirX: -1, dirY: -1, cls: 'nw' },
  { dirX: 0, dirY: -1, cls: 'n' },
  { dirX: 1, dirY: -1, cls: 'ne' },
  { dirX: 1, dirY: 0, cls: 'e' },
  { dirX: 1, dirY: 1, cls: 'se' },
  { dirX: 0, dirY: 1, cls: 's' },
  { dirX: -1, dirY: 1, cls: 'sw' },
  { dirX: -1, dirY: 0, cls: 'w' },
];

// inline-стиль-свойства, которые перетираем при lift'е (для точного restore)
const GEO_PROPS = [
  'position',
  'left',
  'top',
  'width',
  'height',
  'boxSizing',
  'zIndex',
  'margin',
  'translate',
] as const;

// свойства предков, создающие fixed-containing-block / клип
const ANCESTOR_PROPS = [
  'transform',
  'willChange',
  'contain',
  'filter',
  'perspective',
  'clipPath',
] as const;

type StyleSnapshot = Record<string, string>;

function readPos(el: HTMLElement): { left: number; top: number } {
  const left = Number.parseFloat(el.style.left);
  const top = Number.parseFloat(el.style.top);
  if (Number.isFinite(left) && Number.isFinite(top)) return { left, top };
  const r = el.getBoundingClientRect();
  return { left: r.left, top: r.top };
}

function shortTag(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  const cls = el.classList.length ? `.${el.classList[0]}` : '';
  return `${tag}${cls}`;
}

// человекочитаемая подпись слоя: текст элемента, иначе тег.класс
function layerLabel(el: HTMLElement): string {
  const txt = (el.textContent || '').trim().replace(/\s+/g, ' ');
  if (txt) return txt.length <= 22 ? txt : `${txt.slice(0, 21)}…`;
  return shortTag(el);
}

export const LayoutEditOverlay = () => {
  const [enabled, setEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem(OPEN_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [selected, setSelected] = useState<HTMLElement | null>(null);
  const [frame, setFrame] = useState<Frame | null>(null);
  const [layers, setLayers] = useState<Layer[]>([]);
  // X/Y/W/H панели как строки — чтобы можно было свободно печатать / чистить поле
  const [fields, setFields] = useState({ x: '', y: '', w: '', h: '' });
  const focusedFieldRef = useRef<string | null>(null);

  // временный диагностический ридаут (key / счётчик нажатий / состояние selected)
  const [dbg, setDbg] = useState({ key: '—', n: 0 });

  // перетаскиваемая панель слоёв
  const [layersPos, setLayersPos] = useState<Pos | null>(readLayersPos);
  const [layersDragging, setLayersDragging] = useState(false);
  const layersElRef = useRef<HTMLDivElement | null>(null);
  const layersDragOffsetRef = useRef<{ dx: number; dy: number } | null>(null);

  const dragRef = useRef<Drag | null>(null);
  const editedRef = useRef<Set<HTMLElement>>(new Set());
  const idRef = useRef(0);
  // зеркало layers/selected для чтения внутри window-листенеров без переподписки
  const layersRef = useRef<Layer[]>(layers);
  layersRef.current = layers;
  const selectedRef = useRef<HTMLElement | null>(selected);
  selectedRef.current = selected;
  // per-element снимок геометрии (для restore при сбросе)
  const liftSnapRef = useRef<WeakMap<HTMLElement, StyleSnapshot>>(new WeakMap());
  // per-element невидимая заглушка, держащая место в потоке (чтобы соседи не сдвигались)
  const placeholderRef = useRef<WeakMap<HTMLElement, HTMLElement>>(new WeakMap());
  // нейтрализованные предки → их inline-снимок (итерируемая Map для restore-all)
  const neutralizedRef = useRef<Map<HTMLElement, StyleSnapshot>>(new Map());

  const isLocked = useCallback(
    (el: HTMLElement | null) => !!el && layersRef.current.some((l) => l.el === el && l.locked),
    [],
  );

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_KEY, enabled ? '1' : '0');
    } catch {
      /* ignore quota / privacy mode */
    }
  }, [enabled]);

  useEffect(() => {
    document.body.classList.toggle(BODY_ACTIVE_CLASS, enabled);
    return () => document.body.classList.remove(BODY_ACTIVE_CLASS);
  }, [enabled]);

  const clampLayersPos = useCallback((pos: Pos): Pos => {
    const el = layersElRef.current;
    if (!el) return pos;
    const r = el.getBoundingClientRect();
    const maxX = Math.max(0, window.innerWidth - r.width);
    const maxY = Math.max(0, window.innerHeight - r.height);
    return { x: Math.min(Math.max(0, pos.x), maxX), y: Math.min(Math.max(0, pos.y), maxY) };
  }, []);

  useEffect(() => {
    if (!layersPos) return;
    try {
      localStorage.setItem(LAYERS_POS_KEY, JSON.stringify(layersPos));
    } catch {
      /* ignore */
    }
  }, [layersPos]);

  useEffect(() => {
    if (!enabled) return;
    const onResize = () => setLayersPos((p) => (p ? clampLayersPos(p) : p));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [enabled, clampLayersPos]);

  const updateFrame = useCallback((el: HTMLElement | null) => {
    if (!el || !el.isConnected) {
      setFrame(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setFrame({ x: r.left, y: r.top, w: r.width, h: r.height });
  }, []);

  // добавить элемент в список слоёв (дедуп по identity) и выбрать его
  const selectEl = useCallback((el: HTMLElement) => {
    const id = `L${(idRef.current += 1)}`;
    setLayers((prev) =>
      prev.some((l) => l.el === el)
        ? prev
        : [...prev, { id, el, label: layerLabel(el), locked: false }],
    );
    setSelected(el);
  }, []);

  // ---- нейтрализация предков: снимаем CB/clip-триггеры, overflow НЕ трогаем ---
  const neutralizeAncestors = useCallback((el: HTMLElement) => {
    let node = el.parentElement;
    while (node && node !== document.body && node !== document.documentElement) {
      if (!neutralizedRef.current.has(node)) {
        const cs = getComputedStyle(node);
        const bf = cs.getPropertyValue('backdrop-filter') || cs.getPropertyValue('-webkit-backdrop-filter');
        const hasTrigger =
          cs.transform !== 'none' ||
          /transform/.test(cs.willChange) ||
          (cs.contain !== 'none' && cs.contain !== 'normal') ||
          cs.filter !== 'none' ||
          cs.perspective !== 'none' ||
          cs.clipPath !== 'none' ||
          (bf !== '' && bf !== 'none');
        if (hasTrigger) {
          const st = node.style;
          const snap: StyleSnapshot = {};
          for (const p of ANCESTOR_PROPS) snap[p] = st[p as keyof CSSStyleDeclaration] as string;
          snap['backdrop-filter'] = st.getPropertyValue('backdrop-filter');
          snap['-webkit-backdrop-filter'] = st.getPropertyValue('-webkit-backdrop-filter');
          neutralizedRef.current.set(node, snap);

          st.transform = 'none';
          st.willChange = 'auto';
          st.contain = 'none';
          st.filter = 'none';
          st.perspective = 'none';
          st.clipPath = 'none';
          st.setProperty('backdrop-filter', 'none');
          st.setProperty('-webkit-backdrop-filter', 'none');
        }
      }
      node = node.parentElement;
    }
  }, []);

  const restoreAllAncestors = useCallback(() => {
    neutralizedRef.current.forEach((snap, node) => {
      const st = node.style;
      for (const p of ANCESTOR_PROPS) {
        (st[p as keyof CSSStyleDeclaration] as unknown as string) = snap[p] ?? '';
      }
      if (snap['backdrop-filter']) st.setProperty('backdrop-filter', snap['backdrop-filter']);
      else st.removeProperty('backdrop-filter');
      if (snap['-webkit-backdrop-filter']) st.setProperty('-webkit-backdrop-filter', snap['-webkit-backdrop-filter']);
      else st.removeProperty('-webkit-backdrop-filter');
    });
    neutralizedRef.current.clear();
  }, []);

  // ---- поднять элемент из потока в position:fixed по вьюпорт-координатам ------
  const liftEl = useCallback(
    (el: HTMLElement) => {
      if (el.dataset.leLifted === '1') return;
      const r = el.getBoundingClientRect(); // одно чтение, включает текущие трансформы
      const cs = getComputedStyle(el); // margin читаем ДО обнуления
      const st = el.style;
      const snap: StyleSnapshot = {};
      for (const p of GEO_PROPS) snap[p] = st[p as keyof CSSStyleDeclaration] as string;
      liftSnapRef.current.set(el, snap);

      // Невидимая заглушка на исходное место → элемент уходит в fixed, но его слот
      // в потоке остаётся занят, соседи не схлопываются (никаких сдвигов).
      if (el.parentNode) {
        const ph = document.createElement('div');
        ph.setAttribute('data-layout-edit-ui', ''); // наш click-хэндлер его игнорит
        ph.dataset.lePlaceholder = '1';
        ph.style.boxSizing = 'border-box';
        ph.style.width = `${r.width}px`;
        ph.style.height = `${r.height}px`;
        ph.style.margin = cs.margin;
        ph.style.flex = '0 0 auto'; // во flex-родителе не растягивается/не сжимается
        ph.style.visibility = 'hidden'; // занимает место, ничего не рисует
        ph.style.pointerEvents = 'none';
        el.parentNode.insertBefore(ph, el);
        placeholderRef.current.set(el, ph);
      }

      st.boxSizing = 'border-box';
      st.width = `${r.width}px`;
      st.height = `${r.height}px`;
      st.margin = '0';
      st.position = 'fixed';
      st.left = `${r.left}px`;
      st.top = `${r.top}px`;
      st.zIndex = LIFT_Z;
      st.translate = '';

      el.dataset.leLifted = '1';
      el.dataset.leOriginLeft = String(r.left);
      el.dataset.leOriginTop = String(r.top);
      editedRef.current.add(el);
      // снимаем клип/CB с предков ТОЛЬКО после того как зафиксировали left/top,
      // чтобы не было прыжка на первом кадре (см. шапку файла)
      neutralizeAncestors(el);
    },
    [neutralizeAncestors],
  );

  const clearEl = useCallback((el: HTMLElement) => {
    const ph = placeholderRef.current.get(el);
    if (ph) {
      ph.remove();
      placeholderRef.current.delete(el);
    }
    const snap = liftSnapRef.current.get(el);
    if (snap) {
      const st = el.style;
      for (const p of GEO_PROPS) {
        (st[p as keyof CSSStyleDeclaration] as unknown as string) = snap[p] ?? '';
      }
      liftSnapRef.current.delete(el);
    }
    el.style.translate = '';
    delete el.dataset.leLifted;
    delete el.dataset.leOriginLeft;
    delete el.dataset.leOriginTop;
  }, []);

  useEffect(() => {
    updateFrame(selected);
  }, [selected, updateFrame]);

  // X/Y/W/H панели синхронизируются из frame (кроме поля, в котором сейчас печатают)
  useEffect(() => {
    if (!frame) return;
    setFields((prev) => ({
      x: focusedFieldRef.current === 'x' ? prev.x : String(Math.round(frame.x)),
      y: focusedFieldRef.current === 'y' ? prev.y : String(Math.round(frame.y)),
      w: focusedFieldRef.current === 'w' ? prev.w : String(Math.round(frame.w)),
      h: focusedFieldRef.current === 'h' ? prev.h : String(Math.round(frame.h)),
    }));
  }, [frame]);

  // ---- выбор элемента: click в capture-фазе, до того как событие дойдёт до #root
  useEffect(() => {
    if (!enabled) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as HTMLElement | null;
      if (!t) return;
      if (t.closest('[data-layout-edit-ui]')) return; // наша собственная обвязка
      if (t === document.body || t === document.documentElement) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      // уже держим элемент — нельзя взять другой, пока не отпустишь (Enter).
      // протухший (отвалился из DOM) не блокирует — берём новый.
      if (selectedRef.current && selectedRef.current.isConnected) return;
      selectEl(t);
    };
    window.addEventListener('click', onClick, true);
    return () => window.removeEventListener('click', onClick, true);
  }, [enabled, selectEl]);

  // ---- рамка следует за элементом при скролле / ресайзе вьюпорта
  useEffect(() => {
    if (!enabled || !selected) return;
    let raf = 0;
    const sync = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => updateFrame(selected));
    };
    window.addEventListener('scroll', sync, true);
    window.addEventListener('resize', sync);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', sync, true);
      window.removeEventListener('resize', sync);
    };
  }, [enabled, selected, updateFrame]);

  // ---- Клавиатура. Capture-фаза → срабатываем раньше любого stopPropagation и
  //      до скролла drawer'а. Состояние читаем через selectedRef/layersRef
  //      (никаких устаревших замыканий). В наших полях размеров клавиши не трогаем.
  //        • Стрелки — двигают захваченный на 1px (Shift = 10px); 🔒 не двигается.
  //        • Enter — отпускает захваченный.
  //        • Цифры 0-9 — макросы: захвачен+цифра свободна → присвоить; захвачен+
  //          занята → ничего; не захвачен → выделить слой с этой цифрой.
  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      setDbg((d) => ({ key: e.key, n: d.n + 1 }));
      if (t && t.tagName === 'INPUT' && t.closest('[data-layout-edit-ui]')) return;

      const raw = selectedRef.current;
      const sel = raw && raw.isConnected ? raw : null;
      if (raw && !raw.isConnected) setSelected(null); // протух — чистим

      // цифры-макросы
      if (/^[0-9]$/.test(e.key)) {
        const owner = layersRef.current.find((l) => l.num === e.key);
        if (sel) {
          if (!owner) {
            e.preventDefault();
            setLayers((prev) => prev.map((l) => (l.el === sel ? { ...l, num: e.key } : l)));
          }
          // owner есть → ничего
        } else if (owner) {
          e.preventDefault();
          setSelected(owner.el); // не захвачен → выделить слой с этой цифрой
        }
        return;
      }

      if (!sel) return;

      if (e.key === 'Enter') {
        e.preventDefault();
        setSelected(null); // отпустить элемент
        return;
      }
      const step = e.shiftKey ? 10 : 1;
      let dx = 0;
      let dy = 0;
      if (e.key === 'ArrowLeft') dx = -step;
      else if (e.key === 'ArrowRight') dx = step;
      else if (e.key === 'ArrowUp') dy = -step;
      else if (e.key === 'ArrowDown') dy = step;
      else return;
      e.preventDefault();
      if (isLocked(sel)) return;
      liftEl(sel);
      const { left, top } = readPos(sel);
      sel.style.left = `${left + dx}px`;
      sel.style.top = `${top + dy}px`;
      editedRef.current.add(sel);
      updateFrame(sel);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [enabled, isLocked, liftEl, updateFrame]);

  // ---- активный drag (move / resize) — глобальные pointermove/up
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      neutralizeAncestors(d.el); // идемпотентно — перебивает возможный ре-ассерт класса
      const ddx = e.clientX - d.startX;
      const ddy = e.clientY - d.startY;
      if (d.mode === 'move') {
        d.el.style.left = `${d.baseLeft + ddx}px`;
        d.el.style.top = `${d.baseTop + ddy}px`;
      } else {
        if (d.dirX === 1) {
          d.el.style.width = `${Math.max(8, d.baseW + ddx)}px`;
        } else if (d.dirX === -1) {
          const w = Math.max(8, d.baseW - ddx);
          d.el.style.width = `${w}px`;
          d.el.style.left = `${d.baseLeft + (d.baseW - w)}px`; // правый край на месте
        }
        if (d.dirY === 1) {
          d.el.style.height = `${Math.max(8, d.baseH + ddy)}px`;
        } else if (d.dirY === -1) {
          const h = Math.max(8, d.baseH - ddy);
          d.el.style.height = `${h}px`;
          d.el.style.top = `${d.baseTop + (d.baseH - h)}px`; // нижний край на месте
        }
      }
      editedRef.current.add(d.el);
      updateFrame(d.el);
    };
    const onUp = () => {
      dragRef.current = null;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [neutralizeAncestors, updateFrame]);

  // ---- выход из режима: вернуть всё в поток, снять нейтрализацию предков
  useEffect(() => {
    if (enabled) return;
    setSelected(null);
    setLayers([]);
    editedRef.current.forEach(clearEl);
    editedRef.current.clear();
    restoreAllAncestors();
    dragRef.current = null;
  }, [enabled, clearEl, restoreAllAncestors]);

  const beginDrag = useCallback(
    (mode: 'move' | 'resize', dirX: Dir, dirY: Dir) =>
      (e: React.PointerEvent) => {
        if (!selected || isLocked(selected)) return;
        e.preventDefault();
        e.stopPropagation();
        // захват указателя → pointermove/up гарантированно доходят, даже если
        // палец уехал за пределы маленькой ручки (без этого touch-drag рвётся)
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* не все указатели capturable */
        }
        liftEl(selected);
        const { left, top } = readPos(selected);
        dragRef.current = {
          mode,
          dirX,
          dirY,
          startX: e.clientX,
          startY: e.clientY,
          baseW: selected.offsetWidth,
          baseH: selected.offsetHeight,
          baseLeft: left,
          baseTop: top,
          el: selected,
        };
      },
    [selected, isLocked, liftEl],
  );

  const applyField = useCallback(
    (field: 'x' | 'y' | 'w' | 'h', raw: string) => {
      setFields((prev) => ({ ...prev, [field]: raw }));
      const v = Number.parseFloat(raw);
      if (!Number.isFinite(v) || !selected || isLocked(selected)) return;
      liftEl(selected);
      if (field === 'x') selected.style.left = `${v}px`;
      else if (field === 'y') selected.style.top = `${v}px`;
      else if (field === 'w') selected.style.width = `${Math.max(1, v)}px`;
      else if (field === 'h') selected.style.height = `${Math.max(1, v)}px`;
      editedRef.current.add(selected);
      updateFrame(selected);
    },
    [selected, isLocked, liftEl, updateFrame],
  );

  const selectParent = useCallback(() => {
    const p = selected?.parentElement;
    if (p && p !== document.body && p !== document.documentElement) selectEl(p);
  }, [selected, selectEl]);

  const toggleLock = useCallback((id: string) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, locked: !l.locked } : l)));
  }, []);

  const clearNum = useCallback((id: string) => {
    setLayers((prev) => prev.map((l) => (l.id === id ? { ...l, num: undefined } : l)));
  }, []);

  const removeLayer = useCallback(
    (id: string) => {
      const layer = layersRef.current.find((l) => l.id === id);
      if (layer) {
        clearEl(layer.el);
        editedRef.current.delete(layer.el);
        if (editedRef.current.size === 0) restoreAllAncestors();
        setSelected((cur) => (cur === layer.el ? null : cur));
      }
      setLayers((prev) => prev.filter((l) => l.id !== id));
    },
    [clearEl, restoreAllAncestors],
  );

  const resetSelected = useCallback(() => {
    if (!selected) return;
    clearEl(selected);
    editedRef.current.delete(selected);
    if (editedRef.current.size === 0) restoreAllAncestors();
    updateFrame(selected);
  }, [selected, clearEl, restoreAllAncestors, updateFrame]);

  const resetAll = useCallback(() => {
    editedRef.current.forEach(clearEl);
    editedRef.current.clear();
    restoreAllAncestors();
    updateFrame(selected);
  }, [selected, clearEl, restoreAllAncestors, updateFrame]);

  // --- collapsed trigger -----------------------------------------------------
  if (!enabled) {
    return (
      <button
        type="button"
        data-layout-edit-ui
        className={s.trigger}
        onClick={() => setEnabled(true)}
        aria-label="Включить редактор макета"
      >
        ⤢
      </button>
    );
  }

  const selectedLocked = isLocked(selected);

  const onLayersHeadPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = layersElRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    layersDragOffsetRef.current = { dx: e.clientX - r.left, dy: e.clientY - r.top };
    setLayersPos({ x: r.left, y: r.top });
    setLayersDragging(true);
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    e.preventDefault();
  };

  const onLayersHeadPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!layersDragging || !layersDragOffsetRef.current) return;
    setLayersPos(
      clampLayersPos({
        x: e.clientX - layersDragOffsetRef.current.dx,
        y: e.clientY - layersDragOffsetRef.current.dy,
      }),
    );
  };

  const onLayersHeadPointerUp = () => {
    if (!layersDragging) return;
    layersDragOffsetRef.current = null;
    setLayersDragging(false);
  };

  const SIZE_FIELDS: { key: 'x' | 'y' | 'w' | 'h'; label: string }[] = [
    { key: 'x', label: 'X' },
    { key: 'y', label: 'Y' },
    { key: 'w', label: 'W' },
    { key: 'h', label: 'H' },
  ];

  return (
    <>
      {/* selection frame + handles (portal на body → fixed = viewport-relative) */}
      {selected &&
        frame &&
        createPortal(
          <div
            data-layout-edit-ui
            className={`${s.frame} ${selectedLocked ? s.frameLocked : ''}`}
            style={{
              transform: `translate(${frame.x}px, ${frame.y}px)`,
              width: frame.w,
              height: frame.h,
            }}
          >
            {!selectedLocked && (
              <>
                <div
                  className={s.moveArea}
                  onPointerDown={beginDrag('move', 0, 0)}
                  title="Тащи, чтобы двигать"
                />
                {HANDLES.map((h) => (
                  <div
                    key={h.cls}
                    className={`${s.handle} ${s[h.cls]}`}
                    onPointerDown={beginDrag('resize', h.dirX, h.dirY)}
                  />
                ))}
              </>
            )}
          </div>,
          document.body,
        )}

      {/* layers panel — слева, пополняется по мере кликов */}
      {createPortal(
        <div
          data-layout-edit-ui
          className={s.layers}
          ref={layersElRef}
          style={layersPos ? { left: layersPos.x, top: layersPos.y, right: 'auto' } : undefined}
        >
          <div
            className={`${s.layersHead} ${layersDragging ? s.layersHeadDragging : ''}`}
            onPointerDown={onLayersHeadPointerDown}
            onPointerMove={onLayersHeadPointerMove}
            onPointerUp={onLayersHeadPointerUp}
            onPointerCancel={onLayersHeadPointerUp}
          >
            <span className={s.layersGrip} aria-hidden>
              ⠿
            </span>
            слои<span className={s.layersCount}>{layers.length}</span>
          </div>
          <div className={s.layersList}>
            {layers.length === 0 ? (
              <div className={s.layersEmpty}>кликай элементы…</div>
            ) : (
              layers.map((l) => (
                <div
                  key={l.id}
                  className={`${s.layerRow} ${l.el === selected ? s.layerRowGrabbed : ''} ${
                    l.locked ? s.layerRowLocked : ''
                  }`}
                >
                  {l.el === selected && (
                    <span className={s.grabMark} aria-hidden>
                      ✋
                    </span>
                  )}
                  <button
                    type="button"
                    className={s.lockBtn}
                    onClick={() => toggleLock(l.id)}
                    aria-label={l.locked ? 'Разблокировать' : 'Заблокировать'}
                    title={l.locked ? 'Разблокировать' : 'Заблокировать'}
                  >
                    {l.locked ? '🔒' : '🔓'}
                  </button>
                  <button
                    type="button"
                    className={s.layerLabel}
                    onClick={() => {
                      // пока держим один элемент — нельзя взять другой (Enter отпускает)
                      if (!selected) setSelected(l.el);
                    }}
                    title={l.label}
                  >
                    {l.label}
                  </button>
                  {l.num && (
                    <button
                      type="button"
                      className={s.numChip}
                      onClick={() => clearNum(l.id)}
                      title="Убрать цифру-макрос"
                    >
                      {l.num}
                      <span className={s.numX} aria-hidden>
                        ×
                      </span>
                    </button>
                  )}
                  <button
                    type="button"
                    className={s.layerRemove}
                    onClick={() => removeLayer(l.id)}
                    aria-label="Убрать из списка"
                    title="Убрать из списка (сброс правок)"
                  >
                    ×
                  </button>
                </div>
              ))
            )}
          </div>
        </div>,
        document.body,
      )}

      {/* toolbar + size panel */}
      {createPortal(
        <div data-layout-edit-ui className={s.toolbar}>
          <div className={s.head}>
            <span className={s.dot} aria-hidden />
            <span className={s.title}>layout edit</span>
            <button
              type="button"
              className={s.close}
              onClick={() => setEnabled(false)}
              aria-label="Выключить редактор макета"
            >
              ×
            </button>
          </div>

          <div className={s.dbg}>
            key:{dbg.key} ·{dbg.n} · sel:
            {selected ? (selected.isConnected ? shortTag(selected) : 'gone') : '∅'}
          </div>

          {selected && frame ? (
            <>
              <div className={s.grabBanner}>✋ держу элемент · Enter — отпустить</div>
              <div className={s.info}>
                <code className={s.code}>{shortTag(selected)}</code>
                {selectedLocked && <span className={s.lockedTag}>🔒 заблокирован</span>}
                <button type="button" className={s.btn} onClick={selectParent}>
                  ↑ родитель
                </button>
              </div>

              <div className={s.sizePanel}>
                {SIZE_FIELDS.map((f) => (
                  <label key={f.key} className={s.sizeField}>
                    <span className={s.sizeLabel}>{f.label}</span>
                    <input
                      className={s.sizeInput}
                      type="number"
                      value={fields[f.key]}
                      disabled={selectedLocked}
                      onChange={(e) => applyField(f.key, e.target.value)}
                      onFocus={() => {
                        focusedFieldRef.current = f.key;
                      }}
                      onBlur={() => {
                        focusedFieldRef.current = null;
                        updateFrame(selected);
                      }}
                    />
                  </label>
                ))}
              </div>

              <div className={s.btns}>
                <button type="button" className={s.btn} onClick={resetSelected}>
                  сброс
                </button>
                <button type="button" className={s.resetAll} onClick={resetAll}>
                  сбросить всё
                </button>
              </div>
            </>
          ) : (
            <>
              <div className={s.hint}>
                Кликни элемент, чтобы взяться. Стрелки = ±1px (Shift ×10), Enter — отпустить.
              </div>
              <button type="button" className={s.resetAll} onClick={resetAll}>
                сбросить всё
              </button>
            </>
          )}
        </div>,
        document.body,
      )}
    </>
  );
};
