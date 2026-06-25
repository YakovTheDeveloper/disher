import clsx from 'clsx';
import type { ReactNode } from 'react';
import { Numeral, Text } from '@/shared/ui/atoms/Typography';
import s from './NutrientRow.module.scss';

type Props = {
  /** Отображаемое имя нутриента (слева). */
  name: string;
  /** Юнит (г / мг / ккал) — тихая подпись справа от значения. Пустая строка — не рендерим. */
  unit?: string;
  /** Числовое значение (норма / содержание) перед юнитом. Опускается у пикера (только юнит). */
  value?: ReactNode;
  /** Если задан — ряд становится кнопкой с цветным press (пикер). Иначе — статичный display-ряд. */
  onClick?: () => void;
  className?: string;
};

/**
 * Единый ряд нутриента: имя слева, значение+юнит справа, затухающая бровка между
 * рядами. Один источник стиля для `NutrientPickerDrawer` (выбор богатого
 * нутриента в SearchFood — кликабельный) и `NutrientTable` в режиме `view-norms`
 * (просмотр нормы — статичный). Палитра наследуется из app-wide тона ModalShell
 * (`--sys-card-*`). Бровка `:last-child` гасится, поэтому ряды должны идти ПРЯМЫМИ
 * соседями во flex-колонке-контейнере.
 */
export function NutrientRow({ name, unit, value, onClick, className }: Props) {
  // Юнит спускается ПОД число (absolute) только когда есть и число, и юнит —
  // тогда правый столбик чисел встаёт ровно (юнит не толкает число влево).
  const hasValue = value != null && value !== '';
  const stacked = hasValue && !!unit;
  const body = (
    <>
      <Text as="span" role="body" className={s.name}>{name}</Text>
      <span className={clsx(s.right, stacked && s.rightStacked)}>
        {hasValue && <Numeral as="span" size="base" weight="semibold" className={s.value}>{value}</Numeral>}
        {unit ? <Text as="span" role="caption" className={s.unit}>{unit}</Text> : null}
      </span>
    </>
  );

  if (onClick) {
    return (
      <button type="button" className={clsx(s.row, s.clickable, className)} onClick={onClick}>
        {body}
      </button>
    );
  }

  return <div className={clsx(s.row, className)}>{body}</div>;
}

export default NutrientRow;
