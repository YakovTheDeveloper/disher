import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import type { BaseDrawerProps } from '@/shared/ui';
import { nutrientGroups } from '@/entities/nutrient/ui/NutrientGroup/constants';
import styles from './NutrientPickerDrawer.module.scss';

export type RichNutrientPick = { id: string; unit: string };

type Props = BaseDrawerProps<RichNutrientPick>;

/**
 * Боковой выбор нутриента для фильтра «Еда богатая нутриентом» в SearchFood.
 * Открывается через `drawerStore.show(NutrientPickerDrawer, {}, { side: 'left' })`;
 * клик по нутриенту резолвит drawer выбранным `{ id, unit }`, дисмисс (backdrop /
 * edge-swipe / крестик) — `undefined`. Список сгруппирован (Основные / Минералы /
 * Витамины / Аминокислоты) и показывает ВСЕ нутриенты — даже те, у кого нет
 * суточной нормы (в карточке у них вместо «%» останется абсолютное значение).
 * Выбор живёт в локальном стейте SearchFood и не персистится.
 */
export function NutrientPickerDrawer({ onClose }: Props) {
  return (
    <DrawerLayout a11yLabel="Выбор нутриента">
      <div className={styles.root}>
        <h2 className={styles.heading}>Нутриенты</h2>
        {nutrientGroups.map((group) => (
          <section key={group.name} className={styles.group}>
            <h3 className={styles.groupTitle}>{group.displayName}</h3>
            <ul className={styles.list}>
              {group.content.map((nutrient) => (
                <li key={nutrient.id}>
                  <button
                    type="button"
                    className={styles.item}
                    onClick={() => onClose({ id: nutrient.id, unit: nutrient.unitRu })}
                  >
                    <span className={styles.itemName}>{nutrient.displayNameRu}</span>
                    <span className={styles.itemUnit}>{nutrient.unitRu}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </DrawerLayout>
  );
}

export default NutrientPickerDrawer;
