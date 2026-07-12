import { useState } from 'react';
import type { BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { AllDaysHeader, ScheduleNavigator } from './ScheduleNavigator';
import s from './ScheduleNavigatorDrawer.module.scss';

interface Props extends BaseDrawerProps<string> {
  selectedDate?: string;
}

// Дровер навигации — ДВА экрана (слайдер+табы сняты 2026-07-12, страницы вернулись
// 2026-07-12 рядом-навигацией): корень = «Быстрый переход» + ряд «Показать все дни»,
// под-экран = поток месяцев. Навигация — локальный стейт + DrawerLayout.onBack
// (крест → стрелка «Назад»), как в ProfileDrawer; свежий mount сбрасывает в корень.
// Внешний контракт не менялся: `selectedDate?` → `onClose(date)`.
export const ScheduleNavigatorDrawer = ({ onClose, selectedDate }: Props) => {
  const [screen, setScreen] = useState<'root' | 'days'>('root');

  return (
    <DrawerLayout
      title={screen === 'root' ? 'Навигация' : undefined}
      // Под-экран «Все дни» несёт СВОЙ узел шапки: заголовок + подписи колонок
      // (пн…вс). Они одинаковы во всех месяцах, поэтому сидят в chrome-ряду, а не
      // липнут к верху скроллера — иначе две пришпиленные полосы дерутся за верх.
      header={screen === 'days' ? <AllDaysHeader /> : undefined}
      a11yLabel={screen === 'days' ? 'Все дни' : undefined}
      onBack={screen === 'root' ? undefined : () => setScreen('root')}
      className={s.sheet}
    >
      <ScheduleNavigator
        screen={screen}
        onShowAllDays={() => setScreen('days')}
        selectedDate={selectedDate}
        onSelect={(date) => onClose(date)}
      />
    </DrawerLayout>
  );
};

export default ScheduleNavigatorDrawer;
