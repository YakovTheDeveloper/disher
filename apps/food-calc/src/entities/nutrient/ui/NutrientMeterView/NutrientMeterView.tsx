import { nutrientDisplayGroups } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { NutrientGroupedList } from '@/entities/nutrient/ui/NutrientGroupedList';
import { NutrientMeterRow } from '@/entities/nutrient/ui/NutrientMeterRow';
import { useNutrientReadout } from '@/entities/nutrient/model';

type Props = {
  /** Содержание нутриента (обычно скейленное по количеству). */
  getValue: (id: string) => number;
};

/**
 * Витрина нутриентов «мера»: сгруппированный список рядов-мер (имя · % · бар ·
 * цель). Тонкая композиция обхода (`NutrientGroupedList`) + ряда (`NutrientMeterRow`)
 * + norm-glue (`useNutrientReadout`). Дом для ProductDrawer (просмотр) и виджета
 * FoodsNutrients — режим представления = выбор ряда в слоте.
 */
export function NutrientMeterView({ getValue }: Props) {
  const readout = useNutrientReadout(getValue);
  return (
    <NutrientGroupedList
      groups={nutrientDisplayGroups}
      renderRow={(n) => (
        <NutrientMeterRow key={n.id} name={n.displayNameRu} dataName={n.name} {...readout(n.id)} />
      )}
    />
  );
}

export default NutrientMeterView;
