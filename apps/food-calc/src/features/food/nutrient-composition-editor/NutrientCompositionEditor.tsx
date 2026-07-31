import { useState } from 'react';
import { nutrientGroups } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { NutrientCardEditor } from '@/entities/nutrient/ui/NutrientCard';
import { Accordion } from '@/shared/ui/Accordion';
import { Text } from '@/shared/ui/atoms/Typography';
import styles from './NutrientCompositionEditor.module.scss';

type Props = {
  /** Текущий состав: nutrient-id → количество на базис (100 г / 1 шт). */
  values: Record<string, number>;
  /** Правка одного нутриента; 0 = убрать ключ (контракт консумера). */
  onChange: (nutrientId: string, value: number) => void;
};

/**
 * Список групп нутриентов с карточками-редакторами (аккордеоны single-open,
 * lazyMount). Выделен из шага создания продукта (`FoodEntryCreateModals`) для
 * переиспользования: тот же блок едет в `EditNutrientsModal`. Опт-ин галочки
 * «Указать состав» и well-контейнер остаются у консумера — здесь только список.
 */
export function NutrientCompositionEditor({ values, onChange }: Props) {
  const [openGroup, setOpenGroup] = useState<string | null>(null);

  const toggleGroup = (name: string) => {
    setOpenGroup((prev) => (prev === name ? null : name));
  };

  return (
    <div className={styles.groups}>
      {nutrientGroups.map((group) => {
        const isOpen = openGroup === group.name;
        const filledCount = group.content.filter((n) => (values[n.id] ?? 0) > 0).length;
        return (
          // Примитив Accordion. lazyMount — тело монтируется только пока открыто:
          // групп 4 (до 19 карточек каждая) и always-mount всех сразу зря крутил
          // бы ~54 NutrientCardEditor; iOS-делегация тут не страдает (тоггл —
          // button, label→input самодостаточны внутри карточки), поэтому lazy
          // безопасен. Кликабельность несёт вращающийся шеврон.
          <Accordion
            key={group.name}
            open={isOpen}
            onToggle={() => toggleGroup(group.name)}
            lazyMount
            className={`${styles.nutrientGroupItem} ${isOpen ? styles.nutrientGroupOpen : ''}`}
            headerClassName={styles.nutrientsToggle}
            bodyClassName={styles.nutrientsGrid}
            title={
              <Text as="span" role="label" className={styles.nutrientsToggleTitle}>
                {group.displayName}
              </Text>
            }
            trailing={
              filledCount > 0 ? (
                <Text as="span" role="caption" className={styles.nutrientsToggleHint}>
                  {filledCount} запис.
                </Text>
              ) : null
            }
          >
            {group.content.map((nutrientData) => (
              <NutrientCardEditor
                key={nutrientData.id}
                content={nutrientData}
                variant="product-edit"
                className={styles.inlineCard}
                editValue={values[nutrientData.id] ?? 0}
                onValueChange={onChange}
              />
            ))}
          </Accordion>
        );
      })}
    </div>
  );
}

export default NutrientCompositionEditor;
