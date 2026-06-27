import { useCallback } from 'react';
import { useUserNormItems } from '@/entities/daily-norm';
import { ChevronGlyph } from '@/shared/ui/atoms/ChevronGlyph';
import { drawerStore } from '@/shared/ui/drawer-store';
import { DailyNormDrawer } from '@/features/dailyNorms/DailyNormDrawer';
import FlagIcon from '@/shared/assets/icons/flag.svg?react';
import { Button } from '@/shared/ui/atoms/Button';

type Props = {
  className?: string;
};

/**
 * Тихая кнопка дневной нормы — «неотъемлемая часть» Nutrients: рендерится
 * вверху списка нутриентов (FoodsNutrients) и в hero продукта. Текст по
 * состоянию (посмотреть/задать), флажок справа. По клику открывает
 * `DailyNormDrawer` (bottom-sheet). Семантическая обёртка над `QuietActionButton`.
 *
 * Берём `useUserNormItems` (loading-aware), а не `useHasUserNorm` (false при
 * загрузке): пока норма грузится — нейтральный лейбл «Дневная норма», иначе у
 * юзера с нормой мелькало бы «Задать» → «Посмотреть». Уточнение лейбла, а не
 * противоречие.
 */
export const DailyNormButton = ({ className }: Props) => {
  const items = useUserNormItems();

  const open = useCallback(() => {
    void drawerStore.show(DailyNormDrawer, {});
  }, []);

  const label =
    items === undefined
      ? 'Дневная норма'
      : items != null && Object.keys(items).length > 0
        ? 'Дневная норма'
        : 'Задать дневную норму';

  return (
    <Button
      className={className}
      onSurface={2}
      icon={<FlagIcon width={25} height={25} />}
      trailingIcon={<ChevronGlyph />}
      onClick={open}
    >
      {label}
    </Button>
  );
};

export default DailyNormButton;
