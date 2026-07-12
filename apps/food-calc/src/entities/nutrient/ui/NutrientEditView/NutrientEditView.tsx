import { nutrientDisplayGroups } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { NutrientGroupedList } from '@/entities/nutrient/ui/NutrientGroupedList';
import { NutrientEditRow } from '@/entities/nutrient/ui/NutrientEditRow';

type Props = {
  /** Базовое значение состава (на 100 г / 1 единицу). */
  getValue: (id: string) => number;
  /** Коммит правки нутриента (на blur). */
  onValueChange: (id: string, value: number) => void;
};

/**
 * Редактор состава нутриентов: сгруппированный список рядов-редакторов с blur-
 * draft. Тонкая композиция обхода + ряда-редактора (`NutrientEditRow`). Дом для
 * ProductDrawer (инлайн-правка) и EditNutrientsModal. Норм-glue тут НЕ нужен —
 * правится сырое значение.
 */
export function NutrientEditView({ getValue, onValueChange }: Props) {
  return (
    <NutrientGroupedList
      groups={nutrientDisplayGroups}
      renderRow={(n) => (
        <NutrientEditRow
          key={n.id}
          name={n.displayNameRu}
          unit={n.unitRu}
          dataName={n.name}
          value={getValue(n.id)}
          compact={n.group !== 'main'}
          onValueChange={(v) => onValueChange(n.id, v)}
        />
      )}
    />
  );
}

export default NutrientEditView;
