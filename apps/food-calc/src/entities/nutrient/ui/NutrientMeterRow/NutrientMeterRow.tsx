import { memo } from 'react';
import { Heading, Numeral, NumeralMarker } from '@/shared/ui/atoms/Typography';
import { formatAmount } from '@/shared/lib/formatNumber';
import { isIntegerUnit } from '@/entities/nutrient/model';
import s from './NutrientMeterRow.module.scss';

type Props = {
  /** Имя нутриента (слева, роль Title). */
  name: string;
  /** Содержание в еде. */
  value: number;
  /** Суточная норма (цель под баром). */
  norm: number;
  /** % нормы (целое). */
  pct: number;
  /** Показывать %/бар/цель. false → в шапке «значение + юнит», бара нет. */
  hasNorm: boolean;
  /** Юнит (г / мг / ккал). */
  unit: string;
  /** Технический `name` нутриента (english) — для `data-nutrient` (листик клетчатки, тест-хуки). */
  dataName?: string;
};

/**
 * Ряд-«мера» нутриента: имя + КРУПНЫЙ % сверху → полноширинный бар → под ним
 * «сейчас» слева и «цель + юнит» справа. Чисто презентационный — ВСЕ числа
 * приходят пропами (norm-glue живёт в `useNutrientReadout`). Бывшее тело
 * `viewMeter`/`renderRow` из растворённого `NutrientTable`.
 *
 * Числа право-выровнены в столбик, юниты СВИСАЮТ в правое поле (absolute,
 * left:100%) — держат вертикаль, живут «на поле» дровера. Все бары одинаковой
 * длины (не пляшут от ширины чисел).
 */
function NutrientMeterRowInner({ name, value, norm, pct, hasNorm, unit, dataName }: Props) {
  const curDisplay = isIntegerUnit(unit) ? Math.round(value) : formatAmount(value);
  const fill = { width: `${Math.min(pct, 100)}%` };

  // «80 г» / «2300 ккал» — инлайн-группа, прижата к правому краю; юнит свисает в
  // правое поле (absolute), число держит общий правый столбик.
  const valueUnit = (display: React.ReactNode) => (
    <span className={s.footTgt}>
      <Numeral as="span" size="sm">{display}</Numeral>
      <NumeralMarker kind="unit" className={s.footUnit}>{unit}</NumeralMarker>
    </span>
  );

  return (
    <div className={s.row} data-nutrient={dataName}>
      <div className={s.rowTop}>
        <Heading as="span" role="title" className={s.name}>{name}</Heading>
        {hasNorm ? (
          <span className={s.pctFlush}>
            <Numeral as="span" size="base" weight="regular">{pct}</Numeral>
            <NumeralMarker kind="sign" className={s.pctFlushSign}>%</NumeralMarker>
          </span>
        ) : (
          valueUnit(curDisplay)
        )}
      </div>
      {hasNorm && (
        <div className={s.rowBottom}>
          <div className={s.meterTrack}>
            <div className={s.meterBar} style={fill} />
          </div>
          <div className={s.meterFoot}>
            <Numeral as="span" size="sm" className={s.footCur}>{curDisplay}</Numeral>
            {valueUnit(norm)}
          </div>
        </div>
      )}
    </div>
  );
}

export const NutrientMeterRow = memo(NutrientMeterRowInner);

export default NutrientMeterRow;
