import { useCallback } from 'react';
import { useUserNormItems } from '@/entities/daily-norm';
import { modalStore } from '@/shared/ui';
import CreateDailyNormModal from '@/features/dailyNorms/OpenDailyNorms/CreateDailyNormModal';
import EditDailyNormModal from '@/features/dailyNorms/OpenDailyNorms/EditDailyNormModal';
import FlagIcon from '@/shared/assets/icons/flag.svg?react';
import { SettingRow } from '@/shared/ui/atoms/SettingRow';
import { ChevronGlyph } from '@/shared/ui/atoms/ChevronGlyph';

type Props = {
  className?: string;
};

/**
 * Кнопка дневной нормы — «неотъемлемая часть» Nutrients: рендерится вверху списка
 * нутриентов (FoodsNutrients) и в hero продукта. Текст по состоянию (посмотреть/
 * задать), флажок слева, шеврон справа. Тот же примитив-ряд `SettingRow`, что
 * несёт секции «Аккаунта» — плоский ряд с тающей бровкой, без плашки/тени
 * (unification 2026-07-18).
 *
 * По клику открывает НАПРЯМУЮ модалку (не bottom-sheet-хост): норма есть →
 * просмотр `EditDailyNormModal` («Моя норма»); нормы нет → анкета подбора
 * `CreateDailyNormModal` («Новая норма»). Ветвление view↔create раньше жило в
 * снятом `DailyNormDrawer`; обе панели уже самодостаточны в chrome="modal".
 *
 * Берём `useUserNormItems` (loading-aware), а не `useHasUserNorm` (false при
 * загрузке): пока норма грузится — нейтральный лейбл «Норма», иначе у юзера с
 * нормой мелькало бы «Установить» → «Норма». Уточнение лейбла, а не противоречие.
 */
export const DailyNormButton = ({ className }: Props) => {
  const items = useUserNormItems();

  const hasNorm = items != null && Object.keys(items).length > 0;

  const open = useCallback(() => {
    void modalStore.show(hasNorm ? EditDailyNormModal : CreateDailyNormModal, {});
  }, [hasNorm]);

  const label = hasNorm || items === undefined ? 'Норма' : 'Установить суточную норму';

  return (
    <SettingRow
      className={className}
      icon={<FlagIcon width={18} height={18} />}
      label={label}
      trailing={<ChevronGlyph />}
      onClick={open}
    />
  );
};

export default DailyNormButton;
