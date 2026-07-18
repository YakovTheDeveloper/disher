import type { ReactNode } from 'react';
import { ActionList } from '@/shared/ui/ActionList';
import { DailyNormButton } from '@/features/dailyNorms/DailyNormButton';

type Props = {
  /**
   * Контрол «Состав на» (Select основы количества). Опционален: у блюда основы
   * нет — только read-only сумма нутриентов, поэтому секция состава не рендерится.
   */
  composition?: ReactNode;
  /** Заголовок секции состава. Дефолт «Состав на». */
  compositionLabel?: string;
};

/**
 * Общий заголовочный блок Nutrients-разбора продукта и блюда: секция «Дневная
 * норма» (кнопка нормы) + опциональная секция «Состав на» (селект основы). Обе —
 * `ActionList.Section`, тот же примитив-секции, что держит корень «Аккаунта», так
 * что продукт, блюдо и разбор дня говорят одним языком секций.
 */
export function FoodNormSections({ composition, compositionLabel = 'Состав на' }: Props) {
  return (
    <ActionList>
      <ActionList.Section label="Дневная норма" italicLabel>
        <DailyNormButton />
      </ActionList.Section>
      {composition != null && (
        <ActionList.Section label={compositionLabel} italicLabel>
          {composition}
        </ActionList.Section>
      )}
    </ActionList>
  );
}

export default FoodNormSections;
