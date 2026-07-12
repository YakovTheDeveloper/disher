import { useState } from 'react';
import clsx from 'clsx';
import { Heading, Text } from '@/shared/ui/atoms/Typography';
import { NumberInput } from '@/shared/ui/atoms/input/NumberInput';
import { isIntegerUnit } from '@/entities/nutrient/model';
import s from './NutrientEditRow.module.scss';

type Props = {
  /** Имя нутриента (роль Title). */
  name: string;
  /** Юнит (г / мг / ккал). */
  unit: string;
  /** Текущее базовое значение (на 100 г / 1 единицу) — из `getValue(id)`. */
  value: number;
  /** Коммит правки — на BLUR, не на символ. */
  onValueChange: (value: number) => void;
  /** Компактный инпут (ряды групп — минералы/витамины/аминокислоты). */
  compact?: boolean;
  /** Технический `name` (english) — для `data-nutrient` (листик клетчатки). */
  dataName?: string;
};

/**
 * Ряд-редактор одного нутриента: имя + NumberInput с **blur-draft**. Правка
 * коммитится в БД на BLUR, не на каждый символ: локальный черновик держит ввод,
 * чтобы не писать в Dexie на каждое нажатие (и не ловить delete-on-zero посреди
 * набора). Бывший edit-блок растворённого `NutrientTable`.
 */
export function NutrientEditRow({ name, unit, value, onValueChange, compact, dataName }: Props) {
  const initial = isIntegerUnit(unit) ? Math.round(value) : Number(value.toFixed(1));
  // null = черновика нет (показываем закоммиченное `initial`); число = ввод в
  // процессе. NumberInput сам эмитит onBlur со своим `value`-пропом (= shown).
  const [draft, setDraft] = useState<number | null>(null);
  const shown = draft ?? initial;

  const handleBlur = (v: number) => {
    onValueChange(v);
    setDraft(null);
  };

  return (
    <div className={clsx(s.row, compact && s.compact)} data-nutrient={dataName}>
      <div className={s.rowTop}>
        <Heading as="span" role="title" className={s.name}>{name}</Heading>
      </div>
      <div className={s.rowBottom}>
        <div className={s.editRow}>
          <div className={s.editInputRight}>
            <NumberInput
              value={shown}
              onChange={setDraft}
              onBlur={handleBlur}
              className={s.editInput}
            />
            <Text as="span" role="label" className={s.unitProminent}>{unit}</Text>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NutrientEditRow;
