import { useCallback } from 'react';
import { useUserNormItems } from '@/entities/daily-norm';
import { modalStore } from '@/shared/ui';
import { IconButton } from '@/shared/ui/atoms/Button';
import TargetIcon from '@/shared/assets/icons/target.svg?react';
import DailyNormModal from '@/features/dailyNorms/OpenDailyNorms/DailyNormModal';

type Props = {
  className?: string;
  /** Сторона квадратного тап-таргета (px) — прокидывается в IconButton. */
  size?: number;
};

/**
 * Кнопка-флажок суточной нормы для хедеров дроверов (продукт/блюдо/нутриенты).
 * Тихая плитка-иконка (tone `soft`) + синяя точка, ПОКА норма не задана. По клику
 * открывает модалку «Дневная норма» с выбором способа.
 *
 * Состояние читается ГЛУБИНОЙ, не текстом: точка горит только когда ТОЧНО известно,
 * что нормы нет (items загрузились и пусты). Загрузка (undefined) идёт тихо — иначе
 * у юзера с нормой точка мелькнула бы на первом тике useLiveQuery.
 */
export function NormFlagButton({ className, size }: Props) {
  const items = useUserNormItems();

  const itemsResolved = items !== undefined;
  const hasNorm = items != null && Object.keys(items).length > 0;
  const isUnset = itemsResolved && !hasNorm;

  const open = useCallback(() => {
    void modalStore.show(DailyNormModal, {});
  }, []);

  return (
    <IconButton
      className={className}
      size={size}
      tone="soft"
      icon={<TargetIcon width={22} height={22} />}
      aria-label={isUnset ? 'Установить суточную норму' : 'Суточная норма'}
      dot={isUnset}
      onClick={open}
    />
  );
}

export default NormFlagButton;
