import clsx from 'clsx';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import type { BaseDrawerProps } from '@/shared/ui';
import { nutrientGroups } from '@/entities/nutrient/ui/NutrientGroup/constants';
import styles from './NutrientPickerDrawer.module.scss';

export type RichNutrientPick = { id: string; unit: string };

type Props = BaseDrawerProps<RichNutrientPick> & {
  /** Id текущего выбранного нутриента — его чип подсвечивается синим. */
  activeId?: string;
};

/**
 * Боковой выбор нутриента для фильтра «Еда богатая нутриентом» в SearchFood.
 * Открывается через `drawerStore.show(NutrientPickerDrawer, { activeId }, { side: 'left' })`;
 * клик по нутриенту резолвит drawer выбранным `{ id, unit }`, дисмисс (backdrop /
 * edge-swipe / крестик) — `undefined`. Список сгруппирован (БЖУ / Минералы /
 * Витамины / Аминокислоты) — чипы-кнопки в ряд (flex-wrap): текущий выбранный
 * синий, остальные белые с тенью. Между группами — каноничная затухающая бровка.
 * Выбор живёт в локальном стейте SearchFood и не персистится.
 */
export function NutrientPickerDrawer({ onClose, activeId }: Props) {
  return (
    <DrawerLayout title="Выбери нутриенты">
      <div className={styles.root}>
        <p className={styles.intro}>
          Еда в поиске покажет, сколько в ней выбранного нутриента
        </p>
        {nutrientGroups.map((group) => (
          <section key={group.name} className={styles.group}>
            <h3 className={styles.groupTitle}>{group.displayName}</h3>
            <div className={styles.list}>
              {group.content.map((nutrient) => (
                <button
                  key={nutrient.id}
                  type="button"
                  className={clsx(styles.chip, nutrient.id === activeId && styles.chipActive)}
                  onClick={() => onClose({ id: nutrient.id, unit: nutrient.unitRu })}
                >
                  {nutrient.displayNameRu}
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </DrawerLayout>
  );
}

export default NutrientPickerDrawer;
