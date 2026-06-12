import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import type { BaseDrawerProps } from '@/shared/ui';
import FlaskIcon from '@/shared/assets/icons/flask.svg?react';
import EditIcon from '@/shared/assets/icons/edit.svg?react';
import s from './ClipMenuDrawer.module.scss';

type Props = BaseDrawerProps<void> & {
  /** Сколько гипотез уже приложено — счётчик у пункта «Гипотезы». */
  hypothesesCount: number;
  /** Есть ли уточнение — точка-флажок у пункта «Уточнение». */
  hasClarification: boolean;
  onPickHypotheses: () => void;
  onPickClarification: () => void;
};

/**
 * Развилка по скрепке бара Анализа: два пункта — «Гипотезы» и «Уточнение», каждый
 * ведёт в свой под-экран (закрываем чузер ПЕРЕД открытием следующего дровера,
 * иначе он останется смонтированным поверх). Счётчик/точка показывают, что уже
 * приложено.
 */
export const ClipMenuDrawer = ({
  onClose,
  hypothesesCount,
  hasClarification,
  onPickHypotheses,
  onPickClarification,
}: Props) => {
  const pick = (fn: () => void) => {
    onClose();
    fn();
  };

  return (
    <DrawerLayout title="Добавить к разбору" a11yLabel="Добавить к разбору">
      <div className={s.actions}>
        <button
          type="button"
          className={s.actionBtn}
          onClick={() => pick(onPickHypotheses)}
        >
          <span className={s.icon}>
            <FlaskIcon width={22} height={22} />
          </span>
          <span className={s.label}>Гипотезы</span>
          {hypothesesCount > 0 && <span className={s.count}>{hypothesesCount}</span>}
        </button>

        <button
          type="button"
          className={s.actionBtn}
          onClick={() => pick(onPickClarification)}
        >
          <span className={s.icon}>
            <EditIcon width={22} height={22} />
          </span>
          <span className={s.label}>Уточнение</span>
          {hasClarification && <span className={s.dot} aria-hidden="true" />}
        </button>
      </div>
    </DrawerLayout>
  );
};

export default ClipMenuDrawer;
