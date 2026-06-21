import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import type { BaseDrawerProps } from '@/shared/ui';
import { Chip } from '@/shared/ui/atoms/Chip/Chip';
import { Text } from '@/shared/ui/atoms/Typography';
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
 * Витамины / Аминокислоты) — общий примитив Chip в ряд (flex-wrap): текущий
 * выбранный — navy (--chip-active-fill), остальные — холодный mono-тон app.
 * Между группами — каноничная затухающая бровка.
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
            <Text as="h3" variant="sectionLabel" className={styles.groupTitle}>
              {group.displayName}
            </Text>
            <div className={styles.list}>
              {group.content.map((nutrient) => (
                <Chip
                  key={nutrient.id}
                  active={nutrient.id === activeId}
                  aria-pressed={nutrient.id === activeId}
                  onClick={() => onClose({ id: nutrient.id, unit: nutrient.unitRu })}
                >
                  {nutrient.displayNameRu}
                </Chip>
              ))}
            </div>
          </section>
        ))}
      </div>
    </DrawerLayout>
  );
}

export default NutrientPickerDrawer;
