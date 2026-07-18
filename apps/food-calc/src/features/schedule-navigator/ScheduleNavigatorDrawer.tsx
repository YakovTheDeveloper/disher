import { useState } from 'react';
import { addMonths, startOfMonth, subMonths } from 'date-fns';
import clsx from 'clsx';
import type { BaseDrawerProps } from '@/shared/ui';
import { DrawerLayout } from '@/shared/ui/DrawerLayout';
import { AllDaysHeader, ScheduleNavigator } from './ScheduleNavigator';
import { useToday } from './hooks';
import s from './ScheduleNavigatorDrawer.module.scss';

interface Props extends BaseDrawerProps<string> {
  selectedDate?: string;
}

// Дровер навигации — ДВА экрана (слайдер+табы сняты 2026-07-12, страницы вернулись
// 2026-07-12 рядом-навигацией): корень = «Быстрый переход» + ряд «Показать все дни»,
// под-экран = ОДИН месяц-календарь с помесячной навигацией ‹ › (вариант B, 2026-07-18).
// Навигация между экранами — локальный стейт + DrawerLayout.onBack (крест → стрелка
// «Назад»), как в ProfileDrawer; свежий mount сбрасывает в корень + текущий месяц.
// Внешний контракт не менялся: `selectedDate?` → `onClose(date)`.
export const ScheduleNavigatorDrawer = ({ onClose, selectedDate }: Props) => {
  const [screen, setScreen] = useState<'root' | 'days'>('root');
  const today = useToday();
  // Показываемый месяц под-экрана «Все дни». Живёт ЗДЕСЬ (не в ScheduleNavigator):
  // стрелки пейджинга сидят в шапке дровера (AllDaysHeader), а решётка — в теле
  // (ScheduleNavigator) — оба читают один месяц, поэтому стейт поднят к общему предку.
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(today));

  return (
    <DrawerLayout
      title={screen === 'root' ? 'Перейти' : undefined}
      // Под-экран «Все дни» несёт СВОЙ узел шапки: помесячная навигация ‹ Май'26 › +
      // подписи колонок (пн…вс). Колонки одинаковы во всех месяцах, поэтому сидят в
      // chrome-ряду, а не липнут к верху скроллера — иначе две полосы дерутся за верх.
      header={
        screen === 'days' ? (
          <AllDaysHeader
            monthDate={viewMonth}
            onPrev={() => setViewMonth((m) => subMonths(m, 1))}
            onNext={() => setViewMonth((m) => addMonths(m, 1))}
          />
        ) : undefined
      }
      a11yLabel={screen === 'days' ? 'Все дни' : undefined}
      onBack={screen === 'root' ? undefined : () => setScreen('root')}
      // .sheetDays центрирует ряд помесячной навигации (40px-плитки) в chrome-полосе,
      // чтобы back-стрелка DrawerLayout (пришпилена к chrome/2) с ним совпала по высоте.
      className={clsx(s.sheet, screen === 'days' && s.sheetDays)}
    >
      <ScheduleNavigator
        screen={screen}
        viewMonth={viewMonth}
        onShowAllDays={() => setScreen('days')}
        selectedDate={selectedDate}
        onSelect={(date) => onClose(date)}
      />
    </DrawerLayout>
  );
};

export default ScheduleNavigatorDrawer;
