import { useCallback, useState } from 'react';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import Spinner from '@/shared/ui/atoms/Spinner/Spinner';
import type { BaseDrawerProps } from '@/shared/ui';
import { useUserNormItems, USER_NORM_NAME } from '@/entities/daily-norm';
import CreateDailyNormModal from '@/features/dailyNorms/OpenDailyNorms/CreateDailyNormModal';
import EditDailyNormModal from '@/features/dailyNorms/OpenDailyNorms/EditDailyNormModal';
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
    <DrawerLayout
      title={title}
      onBack={canGoBack ? goBackToView : undefined}
      backLabel="Назад к норме"
      className={s.surface}
      modalFields
      // Анкета подбора нормы имеет собственный footer («Готово»), который
      // отмечает конец формы — нижний scroll-fade там лишь размывает последнюю
      // плитку в поверхность и читается как глюк. Во вью нормы (таблица
      // нутриентов, длинный скролл) хинт полезен — оставляем.
      scrollHints={!showCreate}
    >
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
