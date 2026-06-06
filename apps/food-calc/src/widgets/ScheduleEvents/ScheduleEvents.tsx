import styles from './ScheduleEvents.module.scss';
import React, { memo, useMemo, useState } from 'react';
import { TimeGroup } from '@/features/time-group';
import type { ScheduleEvent } from '@/entities/schedule-event';
import { removeScheduleEvents } from '@/entities/schedule-event';
import clsx from 'clsx';
import { ItemsList } from '@/shared/ui/atoms/ItemsList';
import { Screen } from '@/shared/ui/Screen';
import AddButton from '@/shared/ui/atoms/Button/AddButton/AddButton';
import { groupItemsByTime } from '@/shared/lib/schedule';
import {
  ScheduleEventCreateModals,
  EVENT_MODAL_INPUT_IDS,
  ScheduleEventEditModal,
  EVENT_EDIT_MODAL_INPUT_IDS,
} from './ui';
import { AppBottomBarShell } from '@/shared/ui/AppBottomBar';
import { ScheduleEventCard } from './components/ScheduleEventCard';
import { ItemActionsDrawer } from '@/features/shared/item-actions-drawer';
import { buildEventEditActions } from './eventActions';
import toaster from '@/shared/lib/toaster/toaster';
import { safeMutate } from '@/shared/lib/safeMutate';
import { drawerStore } from '@/shared/ui/drawer-store';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import { ROW_BOUNDARY_KEY, ROW_BOUNDARY_VARIANTS } from '@/features/shared/long-press-item';
import { Heading } from '@/shared/ui/atoms/Typography/Heading';
import { formatWeekdayTitle } from '@/shared/lib/time/formatWeekday';

// Цветовая схема общая с FoodSchedule (`useDesignVariant('ScheduleFood', …)`):
// один anchor в DesignBar управляет обоими списками. Порядок и имена должны
// совпадать с `FOOD_DV_VARIANTS` в FoodSchedule.tsx.
const EVENTS_VARIANTS = [
  'meadow',
  'sunrise',
  'sorbet',
  'garden',
  'lagoon',
  'tropic',
  'twilight',
] as const;
type Props = {
  children?: React.ReactNode;
  date: string;
  events: ScheduleEvent[];
  topSlot?: React.ReactNode;
};

const ScheduleEvents = ({ date, events, topSlot }: Props) => {
  const eventsGroupedByTime = useMemo(() => groupItemsByTime(events), [events]);
  // Заголовок дня недели — идентично экрану Еды (FoodSchedule): contentHeader
  // даёт маленький логотип справа при наличии событий и большой по центру на
  // пустом дне.
  const weekdayTitle = useMemo(() => formatWeekdayTitle(date), [date]);

  const { anchor: eventsAnchor } = useDesignVariant('ScheduleFood', EVENTS_VARIANTS);
  // Shared with FoodSchedule: one DesignBar control for the adjacent-row edge
  // treatment across food + event rows (same key → same stored variant).
  const { anchor: boundaryAnchor } = useDesignVariant(ROW_BOUNDARY_KEY, ROW_BOUNDARY_VARIANTS);

  const [editingItem, setEditingItem] = useState<ScheduleEvent | null>(null);
  const [editingStep, setEditingStep] = useState<'idle' | 'time' | 'text' | 'atoms'>('idle');

  const closeEditModal = () => {
    setEditingItem(null);
    setEditingStep('idle');
  };

  const openEditModal = (item: ScheduleEvent, step: 'time' | 'text' | 'atoms') => {
    setEditingItem(item);
    setEditingStep(step);
  };

  // Long-press → per-item action drawer: delete (top-right) + the three field
  // editors (events have no detail page, so these replace the «info» action).
  const openActionsDrawer = (item: ScheduleEvent) => {
    void drawerStore.show(ItemActionsDrawer, {
      title: item.text || 'Событие',
      onDelete: async () => {
        const res = await safeMutate(() => removeScheduleEvents([item.id]), 'Не удалось удалить');
        if (res.ok) toaster.success('Удалено');
      },
      actions: buildEventEditActions((step) => openEditModal(item, step)),
    });
  };

  return (
    <Screen
      stickyTop={topSlot}
      headerOverlap
      hollow={events.length === 0}
      contentHeader={<Heading size="section">{weekdayTitle}</Heading>}
      overlay={
        <>
          <ScheduleEventCreateModals scheduleId={date} />
          {editingItem && (
            <ScheduleEventEditModal
              item={editingItem}
              initialStep={editingStep}
              onClose={closeEditModal}
            />
          )}
        </>
      }
      key={3}
      bottomBar={
        <AppBottomBarShell side="right">
          <AddButton
            htmlFor={EVENT_MODAL_INPUT_IDS.TEXT_INPUT}
            as="label"
            onClick={() => {}}
            prominent={events.length === 0}
            dark
          >
            Добавить событие дня
          </AddButton>
        </AppBottomBarShell>
      }
    >
      <section {...eventsAnchor} className={clsx(['builder__time-groups', styles.eventsBuilder])}>
        <div {...boundaryAnchor}>
          <ItemsList offsetTop>
            {(() => {
              let globalIndex = 0;
              return eventsGroupedByTime.map((timeGroup) => (
                <React.Fragment key={timeGroup.startTime}>
                  <TimeGroup group={timeGroup}>
                    {timeGroup.items.map((item) => {
                      const itemIndex = globalIndex++;
                      return (
                        <ScheduleEventCard
                          key={item.id}
                          item={item}
                          index={itemIndex}
                          totalCount={events.length}
                          onLongPress={() => openActionsDrawer(item)}
                          onEditTime={() => openEditModal(item, 'time')}
                          onEditText={() => openEditModal(item, 'text')}
                          onEditAtoms={() => openEditModal(item, 'atoms')}
                          timeHtmlFor={EVENT_EDIT_MODAL_INPUT_IDS.TIME_INPUT}
                          textHtmlFor={EVENT_EDIT_MODAL_INPUT_IDS.TEXT_INPUT}
                          atomsHtmlFor={EVENT_EDIT_MODAL_INPUT_IDS.ATOMS_INPUT}
                        />
                      );
                    })}
                  </TimeGroup>
                </React.Fragment>
              ));
            })()}
          </ItemsList>
        </div>
      </section>
    </Screen>
  );
};

export default memo(ScheduleEvents);
