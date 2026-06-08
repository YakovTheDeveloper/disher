import { useCallback, useState } from 'react';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { Heading } from '@/shared/ui/atoms/Typography';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import type { BaseDrawerProps } from '@/shared/ui';
import { useUserNormItems, USER_NORM_NAME } from '@/entities/daily-norm';
import CreateDailyNormModal from '@/features/dailyNorms/OpenDailyNorms/CreateDailyNormModal';
import EditDailyNormModal from '@/features/dailyNorms/OpenDailyNorms/EditDailyNormModal';
import ArrowLeftIcon from '@/shared/assets/icons/arrowLeftLong.svg?react';
import s from './DailyNormDrawer.module.scss';

/**
 * Bottom-sheet с настройками дневной нормы. Открывается из `DailyNormButton`
 * (верх Nutrients / hero продукта) через `drawerStore.show(DailyNormDrawer, {})`.
 *
 * Двусостояние view↔create переехало сюда из удалённого `useNutrientNormSlots`:
 *   • нет нормы → анкета (CreateDailyNormModal, chrome="panel");
 *   • норма есть → просмотр (EditDailyNormModal, chrome="panel") + «Пересчитать
 *     по анкете» переключает на анкету с back-кнопкой.
 * Панели уже отдают bare-контент в panel-режиме — drawer лишь даёт surface +
 * заголовок. После коммита анкеты норма появляется → показывается view.
 *
 * Используем `useUserNormItems` (а не `useHasUserNorm`), чтобы отличить
 * loading (undefined) от «нормы нет» — иначе у юзера с нормой мелькнула бы
 * анкета до первой эмиссии Dexie.
 */
export function DailyNormDrawer({ onClose }: BaseDrawerProps) {
  const items = useUserNormItems();
  const isLoading = items === undefined;
  const hasNorm = items != null && Object.keys(items).length > 0;
  const [recalc, setRecalc] = useState(false);

  const goBackToView = useCallback(() => setRecalc(false), []);
  const startRecalc = useCallback(() => setRecalc(true), []);

  // Анкета показывается, когда нормы ещё нет ИЛИ пользователь жмёт «Пересчитать».
  const showCreate = !isLoading && (recalc || !hasNorm);
  // Back доступен только в анкете, открытой поверх существующей нормы.
  const canGoBack = recalc && hasNorm;
  const title = isLoading
    ? 'Дневная норма'
    : showCreate
      ? 'Подобрать норму'
      : USER_NORM_NAME;

  return (
    <DrawerLayout a11yLabel={title} className={s.surface}>
      <div className={s.header}>
        {canGoBack && (
          <button
            type="button"
            className={s.back}
            onClick={goBackToView}
            aria-label="Назад к норме"
          >
            <ArrowLeftIcon />
          </button>
        )}
        <Heading size="drawer" as="h2" className={s.title}>
          {title}
        </Heading>
      </div>
      <div className={s.body}>
        {isLoading ? (
          <div className={s.loading} aria-live="polite">
            <Spinner size={20} />
          </div>
        ) : showCreate ? (
          // onClose анкеты = вернуться к view: после коммита recalc=false и
          // hasNorm=true → показывается норма (а не закрывается весь drawer).
          <CreateDailyNormModal chrome="panel" onClose={goBackToView} />
        ) : (
          <EditDailyNormModal chrome="panel" onClose={onClose} onRecalc={startRecalc} />
        )}
      </div>
    </DrawerLayout>
  );
}

export default DailyNormDrawer;
