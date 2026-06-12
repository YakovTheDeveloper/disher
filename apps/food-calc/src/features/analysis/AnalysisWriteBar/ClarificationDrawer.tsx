import { useState } from 'react';
import type { BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { AutoGrowSearch } from '@/shared/ui/atoms/input/AutoGrowSearch';
import Button from '@/shared/ui/atoms/Button/Button';
import s from './ClarificationDrawer.module.scss';

type Props = BaseDrawerProps<void> & {
  initialValue: string;
  maxLength: number;
  /** Живой коммит в бар на каждый ввод (как AttachHypothesesPicker) — свайп-
   *  дисмисс сохраняет правку. */
  onChange: (value: string) => void;
};

/**
 * Под-экран «Уточнение для разбора» (открывается из ClipMenuDrawer). Текстовое
 * поле для необязательной инструкции LLM (≤ maxLength). Значение коммитится в
 * бар живьём; «Готово» просто закрывает.
 */
export const ClarificationDrawer = ({ onClose, initialValue, maxLength, onChange }: Props) => {
  const [value, setValue] = useState(initialValue);

  const handleChange = (next: string) => {
    setValue(next);
    onChange(next);
  };

  return (
    <DrawerLayout
      title="Уточнение для разбора"
      a11yLabel="Уточнение для разбора"
      footer={
        <div className={s.footer}>
          <Button variant="primary" center onClick={() => onClose()}>
            Готово
          </Button>
        </div>
      }
    >
      <div className={s.body}>
        <AutoGrowSearch
          value={value}
          onChange={handleChange}
          placeholder="Что учесть при разборе…"
          maxRows={6}
          maxLength={maxLength}
        />
      </div>
    </DrawerLayout>
  );
};

export default ClarificationDrawer;
