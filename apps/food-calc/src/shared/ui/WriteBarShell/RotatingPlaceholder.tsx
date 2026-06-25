import { useEffect, useRef, useState } from 'react';
import s from './WriteBarShell.module.scss';

// Длительность fade/slide одной смены — ДЕРЖАТЬ синхронной с @keyframes
// phEnter/phLeave в WriteBarShell.module.scss (та же 420ms).
const ANIM_MS = 420;
// Сколько висит одна строка-пример перед сменой.
const DWELL_MS = 3200;

function getReducedMotion(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export interface RotatingPlaceholderProps {
  /** Строки-примеры; циклятся пока `active`. */
  examples: string[];
  /**
   * Карусель крутится ТОЛЬКО когда true. Caller подаёт сюда «инпут пуст И
   * список айтемов пуст» (см. WriteBarShell.examplesActive). При false строка
   * замирает (а сам оверлей всё равно прячется CSS-ом `:placeholder-shown`,
   * как только в инпуте появляется текст).
   */
  active: boolean;
}

/**
 * Анимированный плейсхолдер-карусель для ПУСТОГО write-бара: текущая строка
 * уходит ВНИЗ с фейдом, следующая спускается СВЕРХУ в инпут (composite-only —
 * opacity + translateY, канон animation-budget). Рендерится внутри
 * rich-placeholder-оверлея AutoGrowSearch (`aria-hidden`), поэтому нативный
 * `placeholder` остаётся стабильным для скринридера, а движется только визуал.
 *
 * Корнер-кейсы:
 *  • prefers-reduced-motion → без движения, статичная строка, цикл выключен
 *    (auto-updating content, WCAG 2.2.2/2.3.3);
 *  • ≤1 примера → статика, без таймера;
 *  • скрытая вкладка (document.hidden) → тик пропускается (не копим смены);
 *  • смена набора примеров → индекс сбрасывается в границы;
 *  • размонтирование → все таймеры чистятся.
 */
export function RotatingPlaceholder({ examples, active }: RotatingPlaceholderProps) {
  const [index, setIndex] = useState(0);
  const [leaving, setLeaving] = useState<number | null>(null);
  const [reduced, setReduced] = useState(getReducedMotion);
  // Текущий индекс держим в ref, чтобы тик-интервал читал свежее значение, не
  // перезапускаясь на каждую смену (стабильный setInterval).
  const indexRef = useRef(0);
  const leaveTimer = useRef<number | null>(null);

  // Реактивно следим за prefers-reduced-motion — юзер может переключить на лету.
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Индекс мог уехать за границу при смене набора примеров.
  useEffect(() => {
    if (index >= examples.length) {
      indexRef.current = 0;
      setIndex(0);
      setLeaving(null);
    }
  }, [examples.length, index]);

  const cycling = active && !reduced && examples.length > 1;

  useEffect(() => {
    if (!cycling) return;
    const id = window.setInterval(() => {
      // Пауза, пока вкладка скрыта (auto-updating content, WCAG 2.2.2).
      if (typeof document !== 'undefined' && document.hidden) return;
      const prev = indexRef.current;
      const next = (prev + 1) % examples.length;
      indexRef.current = next;
      setLeaving(prev);
      setIndex(next);
      if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
      leaveTimer.current = window.setTimeout(() => setLeaving(null), ANIM_MS);
    }, DWELL_MS);
    return () => {
      window.clearInterval(id);
      if (leaveTimer.current) window.clearTimeout(leaveTimer.current);
    };
  }, [cycling, examples.length]);

  if (examples.length === 0) return null;

  // Reduced-motion / один пример / неактивно — статичная строка без анимации.
  if (!cycling) {
    return (
      <span className={s.phRotator}>
        <span className={s.phLine}>{examples[index] ?? examples[0]}</span>
      </span>
    );
  }

  return (
    <span className={s.phRotator}>
      {leaving !== null && leaving !== index ? (
        <span key={`leave-${leaving}`} className={`${s.phLine} ${s.phLeaving}`}>
          {examples[leaving]}
        </span>
      ) : null}
      <span key={`curr-${index}`} className={`${s.phLine} ${s.phEntering}`}>
        {examples[index]}
      </span>
    </span>
  );
}

export default RotatingPlaceholder;
