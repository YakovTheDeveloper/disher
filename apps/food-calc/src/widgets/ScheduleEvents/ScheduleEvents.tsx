import styles from './ScheduleEvents.module.scss';
import React, { memo, useMemo, useState } from 'react';
import { TimeGroup } from '@/features/time-group';
import type { ScheduleEvent } from '@/entities/schedule-event';
import { removeScheduleEvents } from '@/entities/schedule-event';
import clsx from 'clsx';
import { ItemsList } from '@/shared/ui/atoms/ItemsList';
import { Screen, type TopBarHideTarget } from '@/shared/ui/Screen';
import { Heading } from '@/shared/ui/atoms/Typography';
import { groupItemsByTime } from '@/shared/lib/schedule';
import {
  ScheduleEventEditModal,
  EVENT_EDIT_MODAL_INPUT_IDS,
  EventsWriteBar,
} from './ui';
import { ScheduleEventCard } from './components/ScheduleEventCard';
import { ItemActionsDrawer } from '@/features/shared/item-actions-drawer';
import { buildEventEditActions } from './eventActions';
import toaster from '@/shared/lib/toaster/toaster';
import { safeMutate } from '@/shared/lib/safeMutate';
import { drawerStore } from '@/shared/ui/drawer-store';
import { useDesignVariant } from '@/shared/lib/useDesignVariant';
import { CARD_PALETTE_KEY, CARD_PALETTES } from '@/shared/lib/cardPalette';

type Props = {
  children?: React.ReactNode;
  date: string;
  events: ScheduleEvent[];
  topSlot?: React.ReactNode;
  /** Прокидывается в `Screen` → направление-зависимое скрытие кнопок бара. */
  topBarHide?: TopBarHideTarget;
};

const ScheduleEvents = ({ date, events, topSlot, topBarHide }: Props) => {
  const eventsGroupedByTime = useMemo(() => groupItemsByTime(events), [events]);

  // DesignBar anchor: ОБЩИЙ ключ палитры карточек — один контрол красит еду, блюдо
  // и события сразу (shared/lib/cardPalette.ts). Раньше был отдельный 'ScheduleEvents'.
  const { anchor } = useDesignVariant(CARD_PALETTE_KEY, CARD_PALETTES);

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
      topBarHide={topBarHide}
      overlay={
        editingItem && (
          <ScheduleEventEditModal
            item={editingItem}
            initialStep={editingStep}
            onClose={closeEditModal}
          />
        )
      }
      key={3}
      bottomBar={<EventsWriteBar scheduleId={date} />}
    >
      <Heading role="display" masthead as="h2">События дня</Heading>
      <section {...anchor} className={clsx(['builder__time-groups', styles.eventsBuilder])}>
        <ItemsList>
            {(() => {
              let globalIndex = 0;
              return eventsGroupedByTime.map((timeGroup) => (
                <React.Fragment key={timeGroup.startTime}>
                  <TimeGroup group={timeGroup}>
                    {(() => {
                      // Dedup the per-row time (reset per group): a row matching
                      // the time above renders blank but stays tappable to edit.
                      let prevTime: string | null = null;
                      return timeGroup.items.map((item) => {
                      const itemIndex = globalIndex++;
                      const dimTime = prevTime === item.time;
                      prevTime = item.time;
                      return (
                        <ScheduleEventCard
                          key={item.id}
                          item={item}
                          index={itemIndex}
                          dimTime={dimTime}
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
                      });
                      })()}
                  </TimeGroup>
                </React.Fragment>
              ));
            })()}
        </ItemsList>
      </section>
    </Screen>
  );
};

export default memo(ScheduleEvents);
