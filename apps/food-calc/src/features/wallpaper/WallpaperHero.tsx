import { useCallback, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { useLongPress } from '@/shared/lib/hooks/useLongPress';
import { drawerStore } from '@/shared/ui/drawer-store';
import {
  useWallpaperStore,
  HERO_ZOOM_MIN,
  HERO_ZOOM_MAX,
  type WallpaperScreen,
} from '@/shared/lib/wallpaper';
import { WallpaperDrawer } from './WallpaperDrawer';
import styles from './WallpaperHero.module.scss';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * WallpaperHero — интерактивный слой поверх ЛЮБОЙ hero-обложки. Два режима на
 * одной невидимой зоне `.hit`:
 *
 *  • покой — долгий тап (useLongPress, канон 450ms) открывает WallpaperDrawer
 *    оформления ЭТОГО экрана; короткий тап/свайп проходит насквозь к Embla;
 *  • правка (`editing`, пока дровер открыт) — pinch двумя пальцами масштабирует
 *    обложку, drag двигает её (как зум в Галерее iOS/Android). Дровер открыт с
 *    `interactiveBehind` → бэкдроп без pointer-events, hero ловит жест поверх
 *    листа. Результат — постоянный кроп в `useWallpaperStore` (WallpaperImage
 *    читает его реактивно). Наборы хендлеров не смешиваются: активен ровно один.
 *
 * Жест — свой лёгкий на Pointer Events: указатели в `Map` (не boolean-флаг —
 * иначе мультитач рвётся), центроид → сдвиг, дистанция между пальцами → scale,
 * `setPointerCapture`, `touch-action:none` только на время правки. База жеста
 * пересчитывается при каждой смене числа указателей (палец лёг/убрали).
 */
export const WallpaperHero = ({ screen }: { screen: WallpaperScreen }) => {
  const [editing, setEditing] = useState(false);

  const openDrawer = useCallback(() => {
    setEditing(true);
    void drawerStore
      .show(WallpaperDrawer, { screen }, { side: 'bottom', interactiveBehind: true })
      .finally(() => setEditing(false));
  }, [screen]);

  const longPress = useLongPress(openDrawer);

  // Живое состояние жеста — в ref'ах: WallpaperHero не подписан на кроп, поэтому
  // за жест не перерисовывается, а хендлеры/база остаются стабильны между кадрами.
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const size = useRef({ w: 0, h: 0 });
  const base = useRef<{ scale: number; x: number; y: number; cx: number; cy: number; dist: number } | null>(null);
  const raf = useRef(0);
  const pending = useRef<{ scale: number; x: number; y: number } | null>(null);

  const centroid = () => {
    const pts = [...pointers.current.values()];
    const n = pts.length || 1;
    const cx = pts.reduce((sum, p) => sum + p.x, 0) / n;
    const cy = pts.reduce((sum, p) => sum + p.y, 0) / n;
    const dist =
      pts.length >= 2 ? Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) : 0;
    return { cx, cy, dist };
  };

  // Пересчитать базу от ТЕКУЩЕГО кропа + текущих указателей — вызывается при любой
  // смене их числа, чтобы добавленный/убранный палец не давал скачка.
  const rebase = () => {
    const crop = useWallpaperStore.getState().crops[screen];
    const { cx, cy, dist } = centroid();
    base.current = { scale: crop.scale, x: crop.x, y: crop.y, cx, cy, dist };
  };

  const flush = () => {
    raf.current = 0;
    if (pending.current) {
      useWallpaperStore.getState().setCrop(screen, pending.current);
      pending.current = null;
    }
  };

  const onPointerDown = (e: ReactPointerEvent) => {
    try {
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } catch {
      // capture — оптимизация (не даёт увести жест), не обязательна
    }
    const r = (e.currentTarget as Element).getBoundingClientRect();
    size.current = { w: r.width, h: r.height };
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    rebase();
  };

  const onPointerMove = (e: ReactPointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !base.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const b = base.current;
    const { cx, cy, dist } = centroid();
    const factor = b.dist && dist ? dist / b.dist : 1;
    const scale = clamp(b.scale * factor, HERO_ZOOM_MIN, HERO_ZOOM_MAX);
    // Панорама осмыслена только на приближении: при scale=1 предел сдвига = 0.
    const maxX = ((scale - 1) * size.current.w) / 2;
    const maxY = ((scale - 1) * size.current.h) / 2;
    pending.current = {
      scale,
      x: clamp(b.x + (cx - b.cx), -maxX, maxX),
      y: clamp(b.y + (cy - b.cy), -maxY, maxY),
    };
    if (!raf.current) raf.current = requestAnimationFrame(flush);
  };

  const endPointer = (e: ReactPointerEvent) => {
    try {
      (e.currentTarget as Element).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
    pointers.current.delete(e.pointerId);
    if (pointers.current.size > 0) rebase();
    else base.current = null;
  };

  const gesture = {
    onPointerDown,
    onPointerMove,
    onPointerUp: endPointer,
    onPointerCancel: endPointer,
  };

  return (
    <div
      className={styles.hit}
      aria-hidden="true"
      data-editing={editing ? '' : undefined}
      {...(editing ? gesture : longPress)}
    />
  );
};

export default WallpaperHero;
