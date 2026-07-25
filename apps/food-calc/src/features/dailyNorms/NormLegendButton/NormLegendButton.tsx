import { useCallback } from 'react';
import clsx from 'clsx';
import { useUserNormItems } from '@/entities/daily-norm';
import { modalStore } from '@/shared/ui';
import { Text } from '@/shared/ui/atoms/Typography';
import { ChevronGlyph } from '@/shared/ui/atoms/ChevronGlyph';
import DailyNormModal from '@/features/dailyNorms/OpenDailyNorms/DailyNormModal';
import s from './NormLegendButton.module.scss';

type Props = {
  className?: string;
};

/**
 * Легенда-чип суточной нормы — стоит на месте немой подписи «норма» в шапке колонок
 * микро-групп витрины нутриентов (2026-07-25) и ЗАМЕНЯЕТ бывшую кнопку-мишень из
 * шапки дровера (2026-07-23): контрол нормы стоит вплотную к процентам, которые он
 * объясняет, несёт текст-метку (не немую иконку) и кодирует состояние ЦВЕТОМ.
 *
 *  - норма ЗАДАНА  → тихий серый: «% — [дневная норма] ›» (черта снизу + шеврон);
 *    проценты на экране есть, чип = «редактировать норму».
 *  - норма НЕ задана → indigo-акцент: «[Установить дневную норму] ›»; процентов ещё нет,
 *    чип = «включить их» (progressive disclosure).
 *
 * Состояние читается ГЛУБИНОЙ, не мельканием: пока items грузятся (undefined) — чип не
 * рендерим, иначе у юзера с нормой мелькнул бы «Установить…» на первом тике useLiveQuery.
 */
export function NormLegendButton({ className }: Props) {
  const items = useUserNormItems();
  const itemsResolved = items !== undefined;
  const hasNorm = items != null && Object.keys(items).length > 0;

  const open = useCallback(() => {
    void modalStore.show(DailyNormModal, {});
  }, []);

  if (!itemsResolved) return null;

  return (
    <button
      type="button"
      className={clsx(s.chip, !hasNorm && s.unset, className)}
      onClick={open}
      aria-label={hasNorm ? 'Дневная норма' : 'Установить дневную норму'}
    >
      <Text as="span" role="caption">
        {hasNorm ? (
          <>
            % — <span className={s.underline}>дневная норма</span>
          </>
        ) : (
          <span className={s.underline}>Установить дневную норму</span>
        )}
      </Text>
      <ChevronGlyph width={13} height={13} className={s.chevron} />
    </button>
  );
}

export default NormLegendButton;
