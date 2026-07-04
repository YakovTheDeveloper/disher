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

  const hasNorm = items != null && Object.keys(items).length > 0;
  const label = hasNorm || items === undefined ? 'Норма' : 'Установить дневную норму';

  // Вид по состоянию: норма ЗАДАНА → тихая плитка с рамкой (onSurface=1, без тени).
  // Норма НЕ задана → «кричим» тенью-приглашением (onSurface=2). «Кричим» только
  // когда ТОЧНО знаем, что нормы нет — во время загрузки (items === undefined)
  // держим тихий вид, иначе у юзера с нормой мелькнула бы тень (та же логика «не
  // мелькать», что и у лейбла выше).
  const shout = items != null && !hasNorm;

  return (
    <Button
      className={className}
      onSurface={shout ? 2 : 1}
      icon={<FlagIcon width={25} height={25} />}
      trailingIcon={<ChevronGlyph />}
      onClick={open}
    >
      {label}
    </Button>
  );
};

export default DailyNormButton;
