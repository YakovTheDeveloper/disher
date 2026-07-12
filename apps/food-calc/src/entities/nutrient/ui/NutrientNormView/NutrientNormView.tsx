import { nutrientDisplayGroups } from '@/entities/nutrient/ui/NutrientGroup/constants';
import { NutrientGroupedList } from '@/entities/nutrient/ui/NutrientGroupedList';
import { NutrientRow } from '@/entities/nutrient/ui/NutrientRow';
import { useNutrientReadout, isIntegerUnit } from '@/entities/nutrient/model';

// «Моя норма» не показывает содержание еды — только саму норму, поэтому getValue
// = 0 (readout нужен ради нормы/плейсхолдера, не значения).
const ZERO = () => 0;

/**
 * Витрина «Моя норма» (view-norms): плоский сгруппированный список рядов
 * `NutrientRow` (имя · норма+юнит). Плейсхолдер-норма (нет офиц. нормы И юзер её
 * не задавал) → «—», не выдуманное число. Дом для EditDailyNormModal.
 */
export function NutrientNormView() {
  const readout = useNutrientReadout(ZERO);
  return (
    <NutrientGroupedList
      variant="norms"
      groups={nutrientDisplayGroups}
      renderRow={(n) => {
        const r = readout(n.id);
        const show = !r.isPlaceholder && r.norm > 0;
        const value = show ? (isIntegerUnit(r.unit) ? Math.round(r.norm) : r.norm) : '—';
        return (
          <NutrientRow
            key={n.id}
            name={n.displayNameRu}
            value={value}
            unit={show ? r.unit : ''}
          />
        );
      }}
    />
  );
}

export default NutrientNormView;
