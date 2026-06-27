import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import type { BaseDrawerProps } from '@/shared/ui';
import { ChoiceGroup, ChoiceItem } from '@/shared/ui/atoms/Choice';
import { Text } from '@/shared/ui/atoms/Typography';
import { nutrientGroups } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { NutrientGroupTitle } from '@/entities/nutrient/ui/NutrientGroupTitle';
import styles from './NutrientPickerDrawer.module.scss';

export type RichNutrientPick = { id: string; unit: string };

type Props = BaseDrawerProps<RichNutrientPick> & {
  /** Id текущего выбранного нутриента — он помечается галочкой. */
  activeId?: string;
};

/**
 * Боковой выбор нутриента для фильтра «Еда богатая нутриентом» в SearchFood.
 * Открывается через `drawerStore.show(NutrientPickerDrawer, { activeId }, { side: 'left' })`.
 * Одиночный выбор (роль choice/radio через общий `ChoiceGroup`): весь список —
 * один radiogroup, выбранный нутриент помечается кромкой + галочкой (sys-ярус),
 * клик/стрелка резолвит drawer выбранным `{ id, unit }`, дисмисс (backdrop /
 * edge-swipe / крестик) — `undefined`. Список сгруппирован (БЖУ / Минералы /
 * Витамины / Аминокислоты); между группами — каноничная затухающая бровка.
 * Выбор живёт в локальном стейте SearchFood и не персистится.
 */
export function NutrientPickerDrawer({ onClose, activeId }: Props) {
  const allNutrients = nutrientGroups.flatMap((group) => group.content);
  const handleSelect = (id: string) => {
    const nutrient = allNutrients.find((n) => n.id === id);
    if (nutrient) onClose({ id: nutrient.id, unit: nutrient.unitRu });
  };
  return (
    <DrawerLayout title="Выбери нутриенты">
      <div className={styles.root}>
        <Text role="caption" className={styles.intro}>
          Еда в поиске покажет, сколько в ней выбранного нутриента
        </Text>
        <ChoiceGroup
          className={styles.choiceGroups}
          aria-label="Нутриенты"
          value={activeId}
          onChange={handleSelect}
        >
          {nutrientGroups.map((group) => (
            <section key={group.name} className={styles.group}>
              <NutrientGroupTitle as="h3" className={styles.groupTitle}>
                {group.displayName}
              </NutrientGroupTitle>
              <div className={styles.list}>
                {group.content.map((nutrient) => (
                  <ChoiceItem key={nutrient.id} value={nutrient.id}>
                    {nutrient.displayNameRu}
                  </ChoiceItem>
                ))}
              </div>
            </section>
          ))}
        </ChoiceGroup>
      </div>
    </DrawerLayout>
  );
}

export default NutrientPickerDrawer;
