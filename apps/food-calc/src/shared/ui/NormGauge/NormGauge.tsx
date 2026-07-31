import clsx from 'clsx';
import type { CSSProperties } from 'react';
import { Numeral, NumeralMarker } from '@/shared/ui/atoms/Typography';
import s from './NormGauge.module.scss';

/**
 * Общий «гейдж нормы» — выделено из FoodActionCard (2026-07-31): ghost-заливка
 * уровня + 2×2 грид величины (значение+юнит / % нормы). Классы намеренно
 * сохранили карточные имена (`richTrack`/`richFill`/`richNums`/…) — на них
 * завязаны контекстные флипы карточки (plum/press через className-якоря) и
 * тесты FoodActionCard.
 */

/**
 * Трек-заливка «термометра»: absolute inset:0 — разрешается относительно
 * ближайшего позиционированного предка (ряд карточки / td матрицы), кроет его
 * целиком. Уровень едет через --rich (scaleX), не width — композит-only.
 * Числа подняты над заливкой z-index:1 на САМИХ числах (.richNums), чтобы
 * промежуточная обёртка не становилась позиционированной и не ломала отсчёт
 * inset:0 трека.
 */
export function GaugeFill({ level, className }: { level: number; className?: string }) {
  return (
    <span className={clsx(s.richTrack, className)} aria-hidden>
      {level > 0 && (
        <span className={s.richFill} style={{ '--rich': level } as CSSProperties} />
      )}
    </span>
  );
}

type NormFigureProps = {
  /** Готовая отформатированная строка значения; null → «—» и без юнита. */
  value: string | null;
  unit?: string;
  /** Строка процента БЕЗ знака («%» дорисовывает маркер); null → ряда нет. */
  pct?: string | null;
  /** Якорь для контекстных переопределений (plum/press у карточки). */
  className?: string;
  /** Якорь на ячейке процента: его явный cold-strong наследованием не перекрыть,
   *  поэтому контекстный флип цвета цепляется отдельным классом. */
  pctClassName?: string;
};

/**
 * 2×2 грид: колонка чисел (право-выровнены) + колонка маркеров (единица, «%» —
 * лево-выровнены, садятся на одну вертикаль). Ячейки размещены ЯВНО
 * (grid-column/row), поэтому пропуск юнита/процента не смещает соседей.
 * Процент несёт холодный акцент `--norm-figure-pct` (дефолт cold-strong) —
 * консумент флипает переменную на своём классе-якоре.
 */
export function NormFigure({ value, unit, pct, className, pctClassName }: NormFigureProps) {
  return (
    <span className={clsx(s.richNums, className)}>
      <Numeral size="sm" weight="semibold" className={s.richCellValue}>
        {value ?? '—'}
      </Numeral>
      {value !== null && unit && (
        <NumeralMarker kind="unit" className={s.richCellUnit}>
          {unit}
        </NumeralMarker>
      )}
      {pct != null && (
        <>
          <Numeral size="sm" weight="semibold" className={clsx(s.richCellPercent, pctClassName)}>
            {pct}
          </Numeral>
          <NumeralMarker kind="sign" className={s.richCellSign}>
            %
          </NumeralMarker>
        </>
      )}
    </span>
  );
}
